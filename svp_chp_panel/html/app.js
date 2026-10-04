// Sunset Valley+ | Strafenkatalog
(() => {
  const isFiveM = typeof GetParentResourceName === 'function';
  const RES = isFiveM ? GetParentResourceName() : 'svp_chp_panel';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n).toLocaleString('en-US');
  const CLS = { I: 'Infraction', M: 'Misdemeanor', F: 'Felony' };

  const state = { officer: '', agency: null, agencies: [], maxJail: 120, ticket: new Map() };

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
  window.SVP_CATALOG.forEach((cat) => cat.items.forEach((it) => (byKey[it.code] = it)));

  /* ---------- Katalog ---------- */
  window.SVP_CATALOG.forEach((c) => $('catFilter').insertAdjacentHTML('beforeend', `<option value="${c.id}">${esc(c.name)}</option>`));

  function renderCatalog() {
    const q = $('search').value.trim().toLowerCase();
    const cf = $('catFilter').value, kf = $('clsFilter').value;
    let html = '';
    window.SVP_CATALOG.forEach((cat) => {
      if (cf && cat.id !== cf) return;
      const items = cat.items.filter((it) => (!kf || it.cls === kf) &&
        (!q || it.code.toLowerCase().includes(q) || it.title.toLowerCase().includes(q)));
      if (!items.length) return;
      html += `<div class="cat-head">${esc(cat.name)}</div>`;
      items.forEach((it) => {
        html += `<div class="row${state.ticket.has(it.code) ? ' sel' : ''}" data-key="${esc(it.code)}" title="${CLS[it.cls]}${it.license ? ' · Führerscheinentzug' : ''}">
          <span class="code">${esc(it.code)}</span>
          <span>${esc(it.title)}${it.license ? ' 🪪' : ''}</span>
          <span class="cls ${it.cls}">${it.cls}</span>
          <span class="num fine">${money(it.fine)}</span>
          <span class="num">${it.jail ? it.jail + ' HE' : '–'}</span>
          <span class="num">${it.points ? it.points + ' P' : '–'}</span>
        </div>`;
      });
    });
    $('catalogTable').innerHTML = html || '<div style="padding:20px;color:var(--muted)">Keine Treffer.</div>';
  }

  $('catalogTable').addEventListener('click', (e) => {
    const row = e.target.closest('.row'); if (!row) return;
    const k = row.dataset.key;
    state.ticket.set(k, (state.ticket.get(k) || 0) + 1);
    renderTicket(); renderCatalog();
  });
  ['search', 'catFilter', 'clsFilter'].forEach((id) => $(id).addEventListener('input', renderCatalog));

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

  function renderTicket() {
    const box = $('ticketItems');
    if (!state.ticket.size) {
      box.innerHTML = '<div class="empty">Tatbestände links anklicken.</div>';
    } else {
      box.innerHTML = [...state.ticket].map(([k, n]) => `<div class="ti" data-key="${esc(k)}">
          <div class="t"><b class="code">${esc(k)}</b><small>${esc(byKey[k].title)}</small></div>
          <button data-d="-1">−</button><span class="cnt">${n}</span><button data-d="1">+</button>
        </div>`).join('');
    }
    const t = totals();
    $('totFine').textContent = money(t.fine);
    $('totJail').textContent = t.jail + ' HE' + (t.rawJail > t.jail ? ' (max)' : '');
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
      `=== STRAFBESCHEID | ${ag ? ag.name : 'Behörde'} | ${$('serverName').textContent} ===`,
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
    toast('In Zwischenablage kopiert');
  });

  $('clearBtn').addEventListener('click', () => {
    state.ticket.clear(); ['suspect', 'plate', 'notes'].forEach((id) => ($(id).value = ''));
    renderTicket(); renderCatalog();
  });

  /* ---------- Kopfzeile / Behörde ---------- */
  function applyAgency(id) {
    const ag = state.agencies.find((a) => a.id === id) || state.agencies[0];
    if (!ag) return;
    state.agency = ag.id;
    $('badge').textContent = ag.short; $('badge').style.background = ag.color;
    $('deptName').textContent = ag.name;
    document.documentElement.style.setProperty('--accent', ag.color);
  }
  $('agencySelect').addEventListener('change', (e) => applyAgency(e.target.value));

  const close = () => { $('tablet').classList.add('hidden'); post('close'); };
  $('closeBtn').addEventListener('click', close);
  document.addEventListener('keyup', (e) => e.key === 'Escape' && close());

  function open(d) {
    state.officer = d.officer || ''; state.agencies = d.agencies || []; state.maxJail = d.maxJail || 120;
    $('serverName').textContent = d.serverName || 'Sunset Valley+';
    $('agencySelect').innerHTML = state.agencies.map((a) => `<option value="${esc(a.id)}">${esc(a.short)}</option>`).join('');
    const keep = state.agencies.some((a) => a.id === state.agency) ? state.agency : state.agencies[0]?.id;
    $('agencySelect').value = keep; applyAgency(keep);
    renderTicket();
    $('tablet').classList.remove('hidden');
  }

  window.addEventListener('message', ({ data }) => {
    if (data.action === 'open') open(data);
    else if (data.action === 'close') $('tablet').classList.add('hidden');
  });

  renderCatalog(); renderTicket();

  // Vorschau im normalen Browser (ohne FiveM)
  if (!isFiveM) {
    document.body.style.background = '#2b2f36';
    open({
      officer: 'Demo', serverName: 'Sunset Valley+', maxJail: 120, agencies: [
        { id: 'chp', short: 'CHP', name: 'California Highway Patrol', color: '#c9a227' },
        { id: 'usms', short: 'USMS', name: 'United States Marshals Service', color: '#a8b2c1' }]
    });
  }
})();
