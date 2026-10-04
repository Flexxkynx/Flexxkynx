// Sunset Valley+ | Strafenkatalog
(() => {
  const isFiveM = typeof GetParentResourceName === 'function';
  const RES = isFiveM ? GetParentResourceName() : 'svp_chp_panel';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n).toLocaleString('en-US');
  const CLS = { I: 'Infraction', M: 'Misdemeanor', F: 'Felony' };
  const CATALOG = window.SVP_CATALOG;

  const state = {
    officer: '', agency: null, agencies: [], maxJail: 120,
    cat: '', cls: '', ticket: new Map(), ticketNo: ''
  };

  const post = (name, data = {}) => {
    if (!isFiveM) return Promise.resolve();
    return fetch(`https://${RES}/${name}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    }).catch(() => {});
  };

  const toast = (txt) => {
    const t = $('toast'); t.textContent = txt; t.classList.remove('hidden');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), 2200);
  };

  // Alle Tatbestände nach Paragraph
  const byKey = {};
  CATALOG.forEach((cat) => cat.items.forEach((it) => (byKey[it.code] = it)));
  const total = Object.keys(byKey).length;

  /* ---------- Kategorien (Seitenleiste) ---------- */
  function renderCats() {
    const btn = (id, icon, name, count) =>
      `<button class="cat-btn${state.cat === id ? ' on' : ''}" data-cat="${id}">
        <span class="ic">${icon}</span><span class="nm">${esc(name)}</span><span class="ct">${count}</span></button>`;
    $('catNav').innerHTML = '<div class="cat-title">Kategorien</div>' + btn('', '📚', 'Alle Tatbestände', total) +
      CATALOG.map((c) => btn(c.id, c.icon || '•', c.name, c.items.length)).join('');
  }
  $('catNav').addEventListener('click', (e) => {
    const b = e.target.closest('.cat-btn'); if (!b) return;
    state.cat = b.dataset.cat; renderCats(); renderCatalog();
    $('catalogTable').scrollTop = 0;
  });

  $('clsSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    state.cls = b.dataset.cls;
    $('clsSeg').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    renderCatalog();
  });

  /* ---------- Katalog ---------- */
  function renderCatalog() {
    const q = $('search').value.trim().toLowerCase();
    let html = '', hits = 0;
    CATALOG.forEach((cat) => {
      if (state.cat && cat.id !== state.cat) return;
      const items = cat.items.filter((it) => (!state.cls || it.cls === state.cls) &&
        (!q || it.code.toLowerCase().includes(q) || it.title.toLowerCase().includes(q)));
      if (!items.length) return;
      hits += items.length;
      html += `<div class="cat-head">${cat.icon || ''} ${esc(cat.name)}</div>`;
      items.forEach((it) => {
        const n = state.ticket.get(it.code);
        html += `<div class="row ${it.cls}${n ? ' sel' : ''}" data-key="${esc(it.code)}">
          <span class="code">${esc(it.code)}</span>
          <span class="t"><b>${esc(it.title)}</b>
            <small><span class="tag ${it.cls}">${CLS[it.cls]}</span>${it.license ? '<span class="tag lw">🪪 Führerscheinentzug</span>' : ''}</small></span>
          <span class="num fine">${money(it.fine)}</span>
          <span class="num">${it.jail ? it.jail + ' HE' : '–'}</span>
          <span class="num">${it.points ? it.points : '–'}</span>
          <span class="add">${n ? '×' + n : '+'}</span>
        </div>`;
      });
    });
    $('catalogTable').innerHTML = html || '<div class="no-hit">🔍<br>Keine Treffer für diese Suche.</div>';
    $('resultCount').textContent = `${hits} von ${total} Tatbeständen`;
  }

  $('catalogTable').addEventListener('click', (e) => {
    const row = e.target.closest('.row'); if (!row) return;
    const k = row.dataset.key;
    state.ticket.set(k, (state.ticket.get(k) || 0) + 1);
    renderTicket(); renderCatalog();
    const again = $('catalogTable').querySelector(`.row[data-key="${CSS.escape(k)}"]`);
    if (again) again.classList.add('flash');
  });
  $('search').addEventListener('input', renderCatalog);

  /* ---------- Strafbescheid ---------- */
  function totals() {
    let fine = 0, jail = 0, points = 0, license = false;
    state.ticket.forEach((n, k) => {
      const it = byKey[k];
      fine += it.fine * n; jail += it.jail * n; points += it.points * n;
      if (it.license) license = true;
    });
    return { fine, jail: Math.min(jail, state.maxJail), rawJail: jail, points, license };
  }

  function newTicketNo() {
    state.ticketNo = 'SV-' + String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
    $('ticketNo').textContent = 'Nr. ' + state.ticketNo;
  }

  function renderTicket() {
    const box = $('ticketItems');
    if (!state.ticket.size) {
      box.innerHTML = '<div class="empty"><span class="big">⚖️</span>Tatbestände links anklicken,<br>um sie hinzuzufügen.</div>';
    } else {
      box.innerHTML = [...state.ticket].map(([k, n]) => {
        const it = byKey[k];
        return `<div class="ti" data-key="${esc(k)}">
          <div class="t"><b class="code">${esc(k)}</b><small>${esc(it.title)}</small></div>
          <span class="sum">${money(it.fine * n)}</span>
          <div class="qty"><button data-d="-1">−</button><span>${n}</span><button data-d="1">+</button></div>
        </div>`;
      }).join('');
    }
    const t = totals();
    $('totFine').textContent = money(t.fine);
    $('totJail').textContent = t.jail + ' HE' + (t.rawJail > t.jail ? ' ⚠' : '');
    $('totJail').title = t.rawJail > t.jail ? `Begrenzt auf ${state.maxJail} HE (Summe: ${t.rawJail} HE)` : '';
    $('totPoints').textContent = t.points;
    $('licWarn').classList.toggle('hidden', !t.license);
  }

  $('ticketItems').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const k = b.closest('.ti').dataset.key;
    const n = (state.ticket.get(k) || 0) + Number(b.dataset.d);
    n > 0 ? state.ticket.set(k, n) : state.ticket.delete(k);
    renderTicket(); renderCatalog();
  });

  function ticketText() {
    const t = totals();
    const ag = state.agencies.find((a) => a.id === state.agency);
    const charges = [...state.ticket].map(([k, n]) => ` • ${n > 1 ? n + 'x ' : ''}${k} – ${byKey[k].title}`);
    return [
      `=== STRAFBESCHEID ${state.ticketNo} | ${ag ? ag.name : 'Behörde'} | ${$('serverName').textContent} ===`,
      `Datum: ${new Date().toLocaleString('de-DE')}`,
      `Beamter: ${state.officer || '-'}`,
      `Person: ${$('suspect').value || 'Unbekannt'}${$('plate').value ? ' | Kennzeichen: ' + $('plate').value.toUpperCase() : ''}`,
      'Tatbestände:', ...charges,
      `Geldstrafe: ${money(t.fine)} | Haft: ${t.jail} HE | Punkte: ${t.points}${t.license ? ' | FÜHRERSCHEINENTZUG' : ''}`,
      $('notes').value ? 'Bemerkung: ' + $('notes').value : ''
    ].filter(Boolean).join('\n');
  }

  $('copyBtn').addEventListener('click', () => {
    if (!state.ticket.size) return toast('Keine Tatbestände ausgewählt');
    const ta = document.createElement('textarea');
    ta.value = ticketText(); document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    toast('✓ Strafbescheid kopiert');
  });

  $('clearBtn').addEventListener('click', () => {
    state.ticket.clear(); ['suspect', 'plate', 'notes'].forEach((id) => ($(id).value = ''));
    newTicketNo(); renderTicket(); renderCatalog();
  });

  /* ---------- Kopfzeile / Behörde ---------- */
  function applyAgency(id) {
    const ag = state.agencies.find((a) => a.id === id) || state.agencies[0];
    if (!ag) return;
    state.agency = ag.id;
    $('badge').textContent = ag.short;
    $('deptName').textContent = ag.name;
    document.documentElement.style.setProperty('--accent', ag.color);
    $('agencyTabs').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === ag.id));
  }
  $('agencyTabs').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (b) applyAgency(b.dataset.id);
  });

  const tick = () => {
    const d = new Date();
    $('clock').textContent = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    $('ticketDate').innerHTML = d.toLocaleDateString('de-DE') + '<br>' + $('clock').textContent;
  };
  setInterval(tick, 10000);

  const close = () => { $('tablet').classList.add('hidden'); post('close'); };
  $('closeBtn').addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault(); $('search').focus();
    }
  });

  function open(d) {
    state.officer = d.officer || ''; state.agencies = d.agencies || []; state.maxJail = d.maxJail || 120;
    $('serverName').textContent = d.serverName || 'Sunset Valley+';
    $('agencyTabs').innerHTML = state.agencies.map((a) => `<button data-id="${esc(a.id)}" title="${esc(a.name)}">${esc(a.short)}</button>`).join('');
    $('agencyTabs').classList.toggle('hidden', state.agencies.length < 2);
    applyAgency(state.agencies.some((a) => a.id === state.agency) ? state.agency : state.agencies[0]?.id);
    if (!state.ticketNo) newTicketNo();
    tick(); renderTicket();
    $('tablet').classList.remove('hidden');
  }

  window.addEventListener('message', ({ data }) => {
    if (data.action === 'open') open(data);
    else if (data.action === 'close') $('tablet').classList.add('hidden');
  });

  renderCats(); renderCatalog(); renderTicket();

  // Vorschau im normalen Browser (ohne FiveM)
  if (!isFiveM) {
    document.body.style.background = 'radial-gradient(circle at 30% 20%, #3a4252, #1d2129)';
    open({
      officer: 'Demo', serverName: 'Sunset Valley+', maxJail: 120, agencies: [
        { id: 'chp', short: 'CHP', name: 'California Highway Patrol', color: '#c9a227' },
        { id: 'lspd', short: 'LSPD', name: 'Los Santos Police Department', color: '#2f6fdb' },
        { id: 'lssd', short: 'LSSD', name: "Los Santos Sheriff's Department", color: '#3c8d4a' },
        { id: 'usms', short: 'USMS', name: 'United States Marshals Service', color: '#a8b2c1' },
        { id: 'doj', short: 'DOJ', name: 'Department of Justice', color: '#8e44ad' }]
    });
  }
})();
