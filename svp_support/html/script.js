/* =========================================================================
   SUPPORT-REPORT – Spieler-Panel  |  script.js
   Reines Frontend (NUI). Kein Lua.
   ========================================================================= */

const ICON = (path) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

const CATEGORIES = [
  { key: 'rule',   label: 'Regelverstoß', sub: 'RDM, VDM, Metagaming …', icon: ICON('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M12 8v4M12 16h.01"/>') },
  { key: 'bug',    label: 'Bug',          sub: 'Etwas funktioniert nicht', icon: ICON('<rect x="7" y="6" width="10" height="14" rx="5"/><path d="M12 20V11M7 13H3M21 13h-4M8 8L5 5M16 8l3-3M7 17l-3 2M17 17l3 2"/>') },
  { key: 'report', label: 'Beschwerde',   sub: 'Über einen Spieler', icon: ICON('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v4M12 14h.01"/>') },
  { key: 'other',  label: 'Sonstiges',    sub: 'Fragen und alles andere', icon: ICON('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>') }
];

const STATUS_TEXT = {
  open:       'Wartet auf einen Admin',
  inProgress: 'Ein Admin kümmert sich',
  done:       'Abgeschlossen'
};

const CONFIG = { minLength: 10, maxLength: 500, maxChatLength: 300 };

const state = {
  open: false,
  player: { name: 'Spieler', serverId: '' },
  case: null,       // aktueller Fall oder null
  category: 'other',
  demo: false
};

const $ = (id) => document.getElementById(id);
const el = {
  ui: $('ui'), panel: $('panel'), closeBtn: $('closeBtn'),
  viewForm: $('viewForm'), viewCase: $('viewCase'),
  categories: $('categories'), description: $('description'), descCount: $('descCount'), submitBtn: $('submitBtn'),
  statusCard: $('statusCard'), statusDot: $('statusDot'), statusTitle: $('statusTitle'), statusSub: $('statusSub'),
  cancelBtn: $('cancelBtn'), chatThread: $('chatThread'), chatInput: $('chatInput'), chatSendBtn: $('chatSendBtn'),
  chatForm: $('chatForm'), newReportBtn: $('newReportBtn'), demobar: $('demobar'),
  caseMeta: $('caseMeta'), playerTag: $('playerTag'), descCounter: document.querySelector('.counter')
};

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function clean(value, max) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}
function clockText(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function waitText(fromMs) {
  const s = Math.max(0, Math.floor((Date.now() - fromMs) / 1000));
  if (s < 60) return `seit ${s} Sek.`;
  const m = Math.floor(s / 60);
  if (m < 60) return `seit ${m} Min.`;
  return `seit ${Math.floor(m / 60)} Std. ${m % 60} Min.`;
}
function toMs(value) {
  const n = Number(value);
  if (!isFinite(n) || n <= 0) return Date.now();
  return n < 1e12 ? n * 1000 : n;
}

/* ---------------------------------------------------------------- NUI-Brücke */
const IN_FIVEM = typeof window.GetParentResourceName === 'function';

function nuiPost(callback, data = {}) {
  if (!IN_FIVEM) { console.log('[support-report] →', callback, data); return Promise.resolve(null); }
  return fetch(`https://${GetParentResourceName()}/${callback}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(data)
  }).catch(() => null);
}

function normalizeCase(raw) {
  const r = raw || {};
  const status = ['open', 'inProgress', 'done'].includes(r.status) ? r.status : 'open';
  const category = CATEGORIES.some((c) => c.key === r.category) ? r.category : 'other';
  return {
    id: String(r.id ?? ''),
    category,
    description: clean(r.description, CONFIG.maxLength),
    status,
    createdAt: toMs(r.createdAt),
    resolvedAt: r.resolvedAt ? toMs(r.resolvedAt) : null,
    assignedTo: r.assignedTo ? { name: clean(r.assignedTo.name, 40), rank: clean(r.assignedTo.rank, 24) } : null,
    messages: Array.isArray(r.messages) ? r.messages.map(normalizeMessage) : []
  };
}
function normalizeMessage(raw) {
  const m = raw || {};
  const from = ['player', 'admin', 'system'].includes(m.from) ? m.from : 'player';
  return { from, author: clean(m.author, 40), text: clean(m.text, CONFIG.maxChatLength), at: toMs(m.at) };
}

window.addEventListener('message', (event) => {
  const msg = event.data || {};
  const data = msg.data || {};

  switch (msg.action) {
    case 'open':
      if (data.player) state.player = { name: clean(data.player.name, 40) || 'Spieler', serverId: clean(data.player.serverId, 8) };
      state.case = data.case ? normalizeCase(data.case) : null;
      showUi(true);
      renderAll();
      break;

    case 'close':
      showUi(false);
      break;

    case 'caseUpdate':
      state.case = data.case ? normalizeCase(data.case) : null;
      renderAll();
      break;

    case 'message': {
      if (!state.case) break;
      const msgObj = normalizeMessage(data.message || data);
      state.case.messages.push(msgObj);
      renderChat();
      break;
    }
  }
});

function showUi(visible) {
  state.open = visible;
  el.ui.classList.toggle('visible', visible);
}
function closeUi() {
  showUi(false);
  nuiPost('closeUi');
}

/* ---------------------------------------------------------------- RENDERING */
function renderCategories() {
  el.categories.innerHTML = CATEGORIES.map((c) => `
    <button type="button" class="cat-btn ${state.category === c.key ? 'is-active' : ''}" data-cat="${c.key}">
      <span class="cat-icon">${c.icon}</span>
      <span><span class="cat-label">${esc(c.label)}</span><span class="cat-sub">${esc(c.sub)}</span></span>
    </button>`).join('');
}

function validateForm() {
  const len = el.description.value.trim().length;
  el.descCount.textContent = String(el.description.value.length);
  const ok = len >= CONFIG.minLength && len <= CONFIG.maxLength;
  el.submitBtn.disabled = !ok;
  el.descCounter.classList.toggle('is-ok', ok);
  return ok;
}

function renderPlayer() {
  const p = state.player;
  el.playerTag.textContent = p.serverId ? `${p.name} · ID ${p.serverId}` : p.name;
}

function renderAll() {
  renderPlayer();
  const hasCase = !!state.case;
  el.viewForm.hidden = hasCase;
  el.viewCase.hidden = !hasCase;
  if (hasCase) {
    renderStatus();
    renderChat();
  } else {
    renderCategories();
    validateForm();
  }
}

function renderStatus() {
  const c = state.case;
  if (!c) return;
  el.statusCard.classList.toggle('is-progress', c.status === 'inProgress');
  el.statusCard.classList.toggle('is-done', c.status === 'done');
  el.statusTitle.textContent = STATUS_TEXT[c.status];
  el.statusSub.textContent = statusSubText(c);
  el.cancelBtn.hidden = c.status === 'done';
  el.newReportBtn.hidden = c.status !== 'done';
  el.chatForm.hidden = c.status === 'done';

  const cat = CATEGORIES.find((x) => x.key === c.category) || CATEGORIES[CATEGORIES.length - 1];
  const idText = c.id && c.id !== 'pending' ? `Fall #${esc(c.id)}` : 'Fall wird angelegt …';
  el.caseMeta.innerHTML = `<span class="pill">${esc(cat.label)}</span><span class="case-id">${idText}</span><span>· erstellt ${esc(clockText(c.createdAt))} Uhr</span>`;
}

function statusSubText(c) {
  if (c.status === 'done') return `Abgeschlossen um ${clockText(c.resolvedAt || Date.now())} Uhr`;
  const admin = c.assignedTo && c.status === 'inProgress' ? `${c.assignedTo.name} · ` : '';
  return admin + waitText(c.createdAt);
}

function growChatInput() {
  el.chatInput.style.height = 'auto';
  el.chatInput.style.height = `${Math.min(el.chatInput.scrollHeight + 2, 90)}px`;
}

function renderChat() {
  const c = state.case;
  if (!c) return;
  el.chatThread.innerHTML = c.messages.length
    ? c.messages.map((m) => {
        if (m.from === 'system') return `<div class="msg from-system"><div class="msg-bubble">${esc(m.text)}</div></div>`;
        return `
        <div class="msg from-${m.from}">
          <div>
            <div class="msg-bubble">${esc(m.text)}</div>
            <div class="msg-meta">${esc(m.from === 'admin' ? m.author : 'Du')} · ${esc(clockText(m.at))}</div>
          </div>
        </div>`;
      }).join('')
    : `<div class="chat-empty">Noch keine Nachrichten. Ein Admin meldet sich, sobald er den Fall übernimmt.</div>`;
  el.chatThread.scrollTop = el.chatThread.scrollHeight;
}

/* ----------------------------------------------------------------- AKTIONEN */
function submitReport() {
  if (!validateForm()) return;
  const description = clean(el.description.value, CONFIG.maxLength);
  nuiPost('submitReport', { category: state.category, description, sendPosition: true });

  // Optimistisch anzeigen — der Server liefert die echte Fall-Nummer per caseUpdate nach.
  state.case = normalizeCase({
    id: 'pending', category: state.category, description,
    status: 'open', createdAt: Date.now(),
    messages: [{ from: 'player', author: state.player.name, text: description, at: Date.now() }]
  });
  el.description.value = '';
  renderAll();
}

function cancelReport() {
  if (!state.case) return;
  nuiPost('cancelReport', { id: state.case.id });
}

function sendMessage() {
  const text = clean(el.chatInput.value, CONFIG.maxChatLength);
  if (!text || !state.case || state.case.status === 'done') return;
  state.case.messages.push({ from: 'player', author: state.player.name, text, at: Date.now() });
  el.chatInput.value = '';
  growChatInput();
  nuiPost('sendMessage', { id: state.case.id, text });
  renderChat();
}

function startNewReport() {
  state.case = null;
  state.category = 'other';
  renderAll();
}

/* -------------------------------------------------------------------- EVENTS */
document.addEventListener('DOMContentLoaded', () => {
  renderAll();

  el.closeBtn.addEventListener('click', closeUi);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.open) closeUi(); });

  el.categories.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    state.category = btn.dataset.cat;
    renderCategories();
  });

  el.description.addEventListener('input', validateForm);
  el.submitBtn.addEventListener('click', submitReport);

  el.cancelBtn.addEventListener('click', cancelReport);
  el.newReportBtn.addEventListener('click', startNewReport);

  el.chatSendBtn.addEventListener('click', sendMessage);
  el.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  el.chatInput.addEventListener('input', growChatInput);

  if (!IN_FIVEM) bootDemo();
});

/* Wartezeit läuft im Client weiter hoch, ohne komplett neu zu rendern. */
setInterval(() => {
  if (!state.open || !state.case || state.case.status === 'done') return;
  el.statusSub.textContent = statusSubText(state.case);
}, 1000);

/* --------------------------------------------------------------- DEMO-MODUS */
function bootDemo() {
  state.demo = true;
  document.body.classList.add('demo');
  el.demobar.hidden = false;
  state.player = { name: 'Marek Wolinski', serverId: '112' };

  el.demobar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-demo]');
    if (!btn) return;
    const send = (action, data) => window.postMessage({ action, data }, '*');

    switch (btn.dataset.demo) {
      case 'claim':
        if (!state.case) return;
        send('caseUpdate', { case: { ...state.case, id: state.case.id === 'pending' ? '1042' : state.case.id, status: 'inProgress', assignedTo: { name: 'Nico Hartmann', rank: 'Senior Admin' } } });
        break;
      case 'reply':
        if (!state.case) return;
        send('message', { message: { from: 'admin', author: 'Nico Hartmann', text: 'Hallo, ich schaue mir das gerade an!', at: Date.now() } });
        break;
      case 'resolve':
        if (!state.case) return;
        send('caseUpdate', { case: { ...state.case, status: 'done', resolvedAt: Date.now() } });
        break;
      case 'reset':
        send('open', { player: state.player, case: null });
        break;
    }
  });

  window.postMessage({ action: 'open', data: { player: state.player, case: null } }, '*');
}
