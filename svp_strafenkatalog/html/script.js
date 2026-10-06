(() => {
  const $ = (id) => document.getElementById(id);
  const isFiveM = typeof window.GetParentResourceName === 'function';
  const resource = isFiveM ? window.GetParentResourceName() : 'svp_strafenkatalog';

  const AGENCIES = [
    { id: 'chp',  short: 'CHP',  name: 'California Highway Patrol',       color: '#c9a227' },
    { id: 'lspd', short: 'LSPD', name: 'Los Santos Police Department',    color: '#2f6fdb' },
    { id: 'lssd', short: 'LSSD', name: "Los Santos Sheriff's Department", color: '#3c8d4a' },
    { id: 'usms', short: 'USMS', name: 'U.S. Marshals Service',           color: '#a8b2c1' },
    { id: 'doj',  short: 'DOJ',  name: 'Department of Justice',           color: '#8e44ad' }
  ];
  const CLS = { I: 'Infraction', M: 'Misdemeanor', F: 'Felony' };
  const CATALOG = window.SVP_CATALOG || [];
  const TOTAL = CATALOG.reduce((n, c) => n + c.items.length, 0);
  const BY_CODE = new Map();
  CATALOG.forEach((c) => c.items.forEach((i) => BY_CODE.set(i.code, i)));

  const state = {
    agencies: AGENCIES.slice(),
    agency: AGENCIES[0],
    officer: '',
    serverName: 'Sunset Valley+',
    maxJail: 120,
    cat: 'all',
    cls: '',
    query: '',
    selected: new Map(), // code -> count
    ticket: '',
    issued: new Date()
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n).toLocaleString('en-US');
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDate = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const hexRgb = (h) => { const n = parseInt(h.replace('#', ''), 16); return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`; };

  /* ---------- Agency ---------- */
  function resolveAgencies(list) {
    if (!Array.isArray(list) || !list.length) return AGENCIES.slice();
    const out = list.map((a) => {
      const key = String(typeof a === 'string' ? a : (a.id || a.short || '')).toLowerCase();
      const base = AGENCIES.find((x) => x.id === key);
      return typeof a === 'string' ? base : { ...(base || {}), ...a, id: key };
    }).filter((a) => a && a.short);
    return out.length ? out : AGENCIES.slice();
  }

  function renderAgencySeg() {
    $('agencySeg').innerHTML = state.agencies.map((a) =>
      `<button data-agency="${esc(a.id)}" class="${a.id === state.agency.id ? 'active' : ''}" title="${esc(a.name)}">${esc(a.short)}</button>`
    ).join('');
    $('agencySeg').classList.toggle('hidden', state.agencies.length < 2);
  }

  function setAgency(id) {
    state.agency = state.agencies.find((a) => a.id === id) || state.agencies[0];
    const a = state.agency;
    const root = document.documentElement.style;
    root.setProperty('--accent', a.color);
    root.setProperty('--accent-rgb', hexRgb(a.color));
    $('emblemText').textContent = a.short;
    $('emblemText').style.fontSize = a.short.length > 3 ? '9.5px' : '11px';
    $('agencyName').textContent = a.name;
    renderAgencySeg();
  }

  /* ---------- Sidebar ---------- */
  function renderCats() {
    const all = { id: 'all', icon: '⚖️', name: 'Alle Tatbestände', count: TOTAL };
    const list = [all, ...CATALOG.map((c) => ({ id: c.id, icon: c.icon, name: c.name, count: c.items.length }))];
    $('cats').innerHTML = list.map((c) => `
      <button class="cat${c.id === state.cat ? ' active' : ''}" data-cat="${esc(c.id)}" title="${esc(c.name)}">
        <span class="cat-ic">${c.icon}</span>
        <span class="cat-name">${esc(c.name)}</span>
        <span class="cat-count">${c.count}</span>
      </button>`).join('');
  }

  /* ---------- Catalog ---------- */
  function matches(i) {
    if (state.cls && i.cls !== state.cls) return false;
    if (!state.query) return true;
    const q = state.query;
    return i.code.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || i.code.replace(/\s/g, '').toLowerCase().includes(q.replace(/\s/g, ''));
  }

  function rowHtml(i) {
    const n = state.selected.get(i.code) || 0;
    const nil = '<span class="nil">–</span>';
    return `<div class="row c-${i.cls}${n ? ' sel' : ''}" data-code="${esc(i.code)}">
      <span class="pill" title="${esc(i.code)}">${esc(i.code)}</span>
      <span class="r-title">
        <b>${esc(i.title)}</b>
        <span class="r-sub"><span class="k">${CLS[i.cls]}</span>${i.license ? '<span class="lic">🪪 Führerscheinentzug</span>' : ''}</span>
      </span>
      <span class="r-fine">${i.fine ? money(i.fine) : nil}</span>
      <span class="r-num">${i.jail ? i.jail + ' HE' : nil}</span>
      <span class="r-num">${i.points ? i.points : nil}</span>
      <span class="r-meta">${i.fine ? `<span class="m-fine">${money(i.fine)}</span>` : ''}${i.jail ? `<span class="m-jail">${i.jail} HE</span>` : ''}${i.points ? `<span class="m-pts">${i.points} P</span>` : ''}</span>
      <span class="add${n ? ' has' : ''}">${n ? '×' + n : '+'}</span>
    </div>`;
  }

  function renderList(flashCode) {
    const scroll = $('list').scrollTop;
    let html = '', shown = 0;
    for (const c of CATALOG) {
      if (state.cat !== 'all' && c.id !== state.cat) continue;
      const items = c.items.filter(matches);
      if (!items.length) continue;
      shown += items.length;
      html += `<div class="grp"><div class="grp-head">${esc(c.name)}</div><div class="rows">${items.map(rowHtml).join('')}</div></div>`;
    }
    $('list').innerHTML = html || '<div class="empty-list">Keine Tatbestände gefunden.</div>';
    $('list').scrollTop = scroll;
    $('listFoot').innerHTML = `<b>${shown}</b> von <b>${TOTAL}</b> Tatbeständen`;
    if (flashCode) {
      const row = $('list').querySelector(`.row[data-code="${CSS.escape(flashCode)}"]`);
      if (row) row.classList.add('flash');
    }
  }

  /* ---------- Notice ---------- */
  function totals() {
    let fine = 0, jail = 0, points = 0, license = false;
    for (const [code, n] of state.selected) {
      const i = BY_CODE.get(code);
      fine += i.fine * n; jail += i.jail * n; points += i.points * n;
      if (i.license) license = true;
    }
    const capped = jail > state.maxJail;
    return { fine, jail: capped ? state.maxJail : jail, rawJail: jail, capped, points, license };
  }

  function renderNotice(newCode) {
    const box = $('selected');
    if (!state.selected.size) {
      box.innerHTML = '<div class="sel-empty"><span class="big">⚖️</span>Tatbestände links anklicken,<br>um sie hinzuzufügen.</div>';
    } else {
      box.innerHTML = [...state.selected].map(([code, n]) => {
        const i = BY_CODE.get(code);
        const sub = i.fine * n;
        return `<div class="sel-item c-${i.cls}${code === newCode ? ' in' : ''}">
          <div style="min-width:0">
            <div class="si-top"><span class="si-code">${esc(i.code)}</span><span class="si-sum">${sub ? money(sub) : (i.jail ? i.jail * n + ' HE' : '')}</span></div>
            <div class="si-title" title="${esc(i.title)}">${esc(i.title)}</div>
          </div>
          <div class="stepper">
            <button data-step="-1" data-code="${esc(code)}">−</button>
            <span>${n}</span>
            <button data-step="1" data-code="${esc(code)}">+</button>
          </div>
        </div>`;
      }).join('');
      if (newCode) box.scrollTop = box.scrollHeight;
    }
    const t = totals();
    $('tFine').textContent = money(t.fine);
    $('tJail').textContent = t.jail;
    $('tMax').classList.toggle('hidden', !t.capped);
    $('tMax').title = t.capped ? `Maximum erreicht (${t.rawJail} HE berechnet)` : '';
    $('tPoints').textContent = t.points;
    $('tLicense').classList.toggle('hidden', !t.license);
  }

  function change(code, delta) {
    const cur = state.selected.get(code) || 0;
    const next = Math.max(0, Math.min(99, cur + delta));
    if (next) state.selected.set(code, next); else state.selected.delete(code);
    renderList(delta > 0 ? code : null);
    renderNotice(!cur && next ? code : null);
  }

  function newTicket() {
    state.ticket = 'SV-' + String(Math.floor(100000 + Math.random() * 900000));
    state.issued = new Date();
    $('ticketNo').textContent = 'Nr. ' + state.ticket;
    $('nDate').textContent = fmtDate(state.issued);
    $('nTime').textContent = fmtTime(state.issued) + ' Uhr';
  }

  function reset() {
    state.selected.clear();
    $('personName').value = '';
    $('plate').value = '';
    $('notes').value = '';
    newTicket();
    renderList();
    renderNotice();
  }

  /* ---------- Copy ---------- */
  function buildText() {
    const t = totals();
    const line = '────────────────────────────';
    const out = [
      `STRAFBESCHEID Nr. ${state.ticket}`,
      `${state.agency.short} – ${state.agency.name} · ${state.serverName}`,
      line,
      `Datum:    ${fmtDate(state.issued)}, ${fmtTime(state.issued)} Uhr`,
      `Beamter:  ${state.officer || '—'}`,
      `Person:   ${$('personName').value.trim() || '—'}`
    ];
    const plate = $('plate').value.trim().toUpperCase();
    if (plate) out.push(`Kennz.:   ${plate}`);
    out.push(line, 'Tatbestände:');
    for (const [code, n] of state.selected) {
      const i = BY_CODE.get(code);
      const parts = [];
      if (i.fine) parts.push(money(i.fine * n));
      if (i.jail) parts.push(i.jail * n + ' HE');
      if (i.points) parts.push(i.points * n + ' P');
      out.push(` • ${n}× ${i.code} [${CLS[i.cls]}] ${i.title}${parts.length ? ' – ' + parts.join(' / ') : ''}`);
    }
    out.push(
      line,
      `Geldstrafe: ${money(t.fine)}`,
      `Haft:       ${t.jail} HE${t.capped ? ` (Maximum, berechnet ${t.rawJail} HE)` : ''}`,
      `Punkte:     ${t.points}`
    );
    if (t.license) out.push('Führerscheinentzug empfohlen');
    const notes = $('notes').value.trim();
    if (notes) out.push(line, 'Bemerkungen:', notes);
    return out.join('\n');
  }

  function copyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove();
    if (!ok && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  }

  let toastTimer;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ---------- Clock ---------- */
  function tick() { $('clock').textContent = fmtTime(new Date()); }
  setInterval(tick, 10000);
  tick();

  /* ---------- Open / Close ---------- */
  const isOpen = () => !$('app').classList.contains('hidden');

  function open(data = {}) {
    state.agencies = resolveAgencies(data.agencies);
    state.officer = data.officer || '';
    state.serverName = data.serverName || 'Sunset Valley+';
    if (Number(data.maxJail) > 0) state.maxJail = Number(data.maxJail);
    $('serverName').textContent = state.serverName;
    const keep = state.agencies.some((a) => a.id === state.agency.id) ? state.agency.id : state.agencies[0].id;
    setAgency(keep);
    if (!state.ticket) newTicket();
    renderCats();
    renderList();
    renderNotice();
    const app = $('app');
    app.classList.add('hidden');
    void app.offsetWidth; // restart pop-in animation
    app.classList.remove('hidden');
    setTimeout(() => $('search').focus(), 60);
  }

  function close(notify = true) {
    if (!isOpen()) return;
    $('app').classList.add('hidden');
    if (notify && isFiveM) {
      fetch(`https://${resource}/close`, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8' }, body: '{}' }).catch(() => {});
    }
  }

  /* ---------- Events ---------- */
  $('agencySeg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-agency]');
    if (b) setAgency(b.dataset.agency);
  });
  $('cats').addEventListener('click', (e) => {
    const b = e.target.closest('.cat');
    if (!b) return;
    state.cat = b.dataset.cat;
    renderCats();
    $('list').scrollTop = 0;
    renderList();
  });
  $('clsSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cls]');
    if (!b) return;
    state.cls = b.dataset.cls;
    $('clsSeg').querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
    $('list').scrollTop = 0;
    renderList();
  });
  $('search').addEventListener('input', (e) => {
    state.query = e.target.value.trim().toLowerCase();
    $('list').scrollTop = 0;
    renderList();
  });
  $('list').addEventListener('click', (e) => {
    const row = e.target.closest('.row');
    if (row) change(row.dataset.code, 1);
  });
  $('selected').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-step]');
    if (b) change(b.dataset.code, Number(b.dataset.step));
  });
  $('plate').addEventListener('input', (e) => {
    const p = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    e.target.setSelectionRange(p, p);
  });
  $('closeBtn').addEventListener('click', () => close());
  $('copyBtn').addEventListener('click', () => {
    if (!state.selected.size) return toast('Keine Tatbestände ausgewählt');
    copyText(buildText());
    toast('✓ Strafbescheid kopiert');
  });
  $('resetBtn').addEventListener('click', () => { reset(); toast('Strafbescheid zurückgesetzt'); });

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
      e.preventDefault();
      $('search').focus();
      $('search').select();
    }
  });

  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.action === 'open') open(d);
    else if (d.action === 'close') close(false);
  });

  /* ---------- Demo ---------- */
  if (!isFiveM) {
    document.body.classList.add('demo');
    open({ officer: 'Ofc. J. Miller #1427', serverName: 'Sunset Valley+', maxJail: 120 });
  }
})();
