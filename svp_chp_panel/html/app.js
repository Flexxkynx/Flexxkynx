// Sunset Valley+ | Behörden-MDT & Strafenkatalog
(() => {
  const isFiveM = typeof GetParentResourceName === 'function';
  const RES = isFiveM ? GetParentResourceName() : 'svp_chp_panel';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n).toLocaleString('en-US');
  const CLS = { I: 'Infraction', M: 'Misdemeanor', F: 'Felony' };

  const state = { me: null, agencies: [], statuses: {}, maxJail: 120, ticket: new Map() };

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

  // Alle Tatbestände mit eindeutiger Key-ID
  const ALL = [];
  window.SVP_CATALOG.forEach((cat) => cat.items.forEach((it) => ALL.push({ ...it, cat: cat.id, key: it.code })));
  const byKey = Object.fromEntries(ALL.map((it) => [it.key, it]));

  /* ---------- Tabs ---------- */
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === b));
    document.querySelectorAll('.tab-page').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + b.dataset.tab));
    if (b.dataset.tab === 'records') post('getRecords', { query: $('recSearch').value });
  }));

  /* ---------- Strafenkatalog ---------- */
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
    $('catalogTable').innerHTML = html || '<div class="empty" style="padding:20px;color:var(--muted)">Keine Treffer.</div>';
  }

  $('catalogTable').addEventListener('click', (e) => {
    const row = e.target.closest('.row'); if (!row) return;
    const k = row.dataset.key;
    state.ticket.set(k, (state.ticket.get(k) || 0) + 1);
    renderTicket(); renderCatalog();
  });
  ['search', 'catFilter', 'clsFilter'].forEach((id) => $(id).addEventListener('input', renderCatalog));

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
      box.innerHTML = [...state.ticket].map(([k, n]) => {
        const it = byKey[k];
        return `<div class="ti" data-key="${esc(k)}">
          <div class="t"><b class="code">${esc(k)}</b><small>${esc(it.title)}</small></div>
          <button data-d="-1">−</button><span class="cnt">${n}</span><button data-d="1">+</button>
        </div>`;
      }).join('');
    }
    const t = totals();
    $('totFine').textContent = money(t.fine);
    $('totJail').textContent = t.jail + ' HE' + (t.rawJail > t.jail ? ` (max)` : '');
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

  function chargeList() {
    return [...state.ticket].map(([k, n]) => `${n > 1 ? n + 'x ' : ''}${k} – ${byKey[k].title}`);
  }

  function ticketText() {
    const t = totals();
    const ag = state.agencies.find((a) => a.id === state.me?.agency);
    return [
      `=== STRAFBESCHEID | ${ag ? ag.name : 'Behörde'} | ${$('serverName').textContent} ===`,
      `Datum: ${new Date().toLocaleString('de-DE')}`,
      `Beamter: ${$('callsign').value || '-'}`,
      `Person: ${$('suspect').value || 'Unbekannt'}${$('plate').value ? ' | Kennzeichen: ' + $('plate').value.toUpperCase() : ''}`,
      'Tatbestände:', ...chargeList().map((c) => ' • ' + c),
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

  $('saveBtn').addEventListener('click', () => {
    if (!state.ticket.size) return toast('Keine Tatbestände ausgewählt');
    if (!$('suspect').value.trim()) return toast('Bitte Namen der Person eintragen');
    const t = totals();
    post('record', {
      suspect: $('suspect').value.trim(), plate: $('plate').value.trim().toUpperCase(),
      notes: $('notes').value.trim(), charges: chargeList(), fine: t.fine, jail: t.jail, points: t.points
    });
    if (!isFiveM) toast('Akte gespeichert (Demo)');
  });

  $('clearBtn').addEventListener('click', () => {
    state.ticket.clear(); ['suspect', 'plate', 'notes'].forEach((id) => ($(id).value = ''));
    renderTicket(); renderCatalog();
  });

  /* ---------- Akten ---------- */
  const searchRecords = () => post('getRecords', { query: $('recSearch').value.trim() });
  $('recBtn').addEventListener('click', searchRecords);
  $('recSearch').addEventListener('keydown', (e) => e.key === 'Enter' && searchRecords());

  function renderRecords(list) {
    $('recordList').innerHTML = list.length ? list.map((r) => `
      <div class="rec">
        <div class="h"><b>#${r.id} · ${esc(r.suspect)}${r.plate ? ' · ' + esc(r.plate) : ''}</b>
          <small>${new Date(r.time * 1000).toLocaleString('de-DE')} · ${esc((r.agency || '').toUpperCase())} · ${esc(r.officer)}</small></div>
        <ul>${r.charges.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
        <small>${money(r.fine)} · ${r.jail} HE · ${r.points} Punkte${r.notes ? ' · ' + esc(r.notes) : ''}</small>
      </div>`).join('') : '<div style="color:var(--muted)">Keine Akten gefunden.</div>';
  }

  /* ---------- Einheiten ---------- */
  function renderUnits(units) {
    $('unitList').innerHTML = units.map((u) => {
      const st = state.statuses[u.status] || { label: u.status, color: '#999' };
      const ag = state.agencies.find((a) => a.id === u.agency);
      return `<tr>
        <td>${esc(ag ? ag.short : (u.agency || '').toUpperCase())}</td>
        <td class="code">${esc(u.callsign)}</td><td>${esc(u.name)}</td>
        <td><span class="pill" style="background:${st.color}">${esc(u.status)} · ${esc(st.label)}</span></td>
        <td>${esc(u.location)}</td></tr>`;
    }).join('') || '<tr><td colspan="5" style="color:var(--muted)">Keine Einheiten im Dienst.</td></tr>';
  }

  /* ---------- Funkcodes ---------- */
  function renderCodes() {
    const q = $('codeSearch').value.trim().toLowerCase();
    $('codeList').innerHTML = window.SVP_CODES.map((g) => {
      const items = g.items.filter(([c, d]) => !q || c.toLowerCase().includes(q) || d.toLowerCase().includes(q));
      if (!items.length) return '';
      return `<div class="code-group"><h4>${esc(g.name)}</h4>${items.map(([c, d]) =>
        `<div class="code-item"><b>${esc(c)}</b><span>${esc(d)}</span></div>`).join('')}</div>`;
    }).join('');
  }
  $('codeSearch').addEventListener('input', renderCodes);

  /* ---------- Funk-Log ---------- */
  function addRadio(callsign, msg, time) {
    const d = time ? new Date(time * 1000) : new Date();
    $('radioLog').insertAdjacentHTML('beforeend',
      `<div class="msg"><span>${d.toLocaleTimeString('de-DE')}</span><b>${esc(callsign)}</b>${esc(msg)}</div>`);
    $('radioLog').scrollTop = $('radioLog').scrollHeight;
  }
  const sendRadio = () => {
    const m = $('radioMsg').value.trim(); if (!m) return;
    post('dispatch', { msg: m }); if (!isFiveM) addRadio($('callsign').value, m);
    $('radioMsg').value = '';
  };
  $('radioBtn').addEventListener('click', sendRadio);
  $('radioMsg').addEventListener('keydown', (e) => e.key === 'Enter' && sendRadio());

  /* ---------- Kopfzeile / eigene Einheit ---------- */
  function applyAgency(id) {
    const ag = state.agencies.find((a) => a.id === id) || state.agencies[0];
    if (!ag) return;
    $('badge').textContent = ag.short; $('badge').style.background = ag.color;
    $('deptName').textContent = ag.name;
    document.documentElement.style.setProperty('--accent', ag.color);
  }
  $('agencySelect').addEventListener('change', (e) => { applyAgency(e.target.value); state.me.agency = e.target.value; post('update', { agency: e.target.value }); });
  $('statusSelect').addEventListener('change', (e) => post('update', { status: e.target.value }));
  $('callsign').addEventListener('change', (e) => post('update', { callsign: e.target.value.toUpperCase() }));

  const close = () => { $('tablet').classList.add('hidden'); post('close'); };
  $('closeBtn').addEventListener('click', close);
  document.addEventListener('keyup', (e) => e.key === 'Escape' && close());

  function open(d) {
    state.me = d.me; state.agencies = d.agencies || []; state.statuses = d.statuses || {};
    state.maxJail = d.maxJail || 120;
    $('serverName').textContent = d.serverName || 'Sunset Valley+';
    $('agencySelect').innerHTML = state.agencies.map((a) => `<option value="${a.id}">${esc(a.short)}</option>`).join('');
    $('agencySelect').value = d.me.agency; applyAgency(d.me.agency);
    $('statusSelect').innerHTML = Object.entries(state.statuses).map(([k, v]) => `<option value="${esc(k)}">${esc(k)} – ${esc(v.label)}</option>`).join('');
    $('statusSelect').value = d.me.status;
    $('callsign').value = d.me.callsign;
    $('location').textContent = d.location || '-';
    $('tablet').classList.remove('hidden');
  }

  window.addEventListener('message', ({ data }) => {
    switch (data.action) {
      case 'open': open(data); break;
      case 'close': $('tablet').classList.add('hidden'); break;
      case 'units': renderUnits(data.units || []); break;
      case 'radio': addRadio(data.callsign, data.msg, data.time); break;
      case 'records': renderRecords(data.records || []); break;
      case 'recordSaved': toast(`Akte #${data.id} gespeichert`); break;
      case 'panic': {
        const bar = $('panicBar');
        bar.textContent = `🚨 11-99 | ${data.callsign} BRAUCHT HILFE | ${data.location || ''}`;
        bar.classList.remove('hidden'); setTimeout(() => bar.classList.add('hidden'), 15000);
        addRadio('DISPATCH', `11-99 – ${data.callsign} – ${data.location || ''}`);
        break;
      }
    }
  });

  renderCatalog(); renderTicket(); renderCodes();

  // Vorschau im normalen Browser (ohne FiveM)
  if (!isFiveM) {
    document.body.style.background = '#2b2f36';
    const statuses = {
      '10-8': { label: 'Im Dienst / Verfügbar', color: '#2ecc71' }, '10-6': { label: 'Beschäftigt', color: '#f1c40f' },
      '10-97': { label: 'Am Einsatzort', color: '#3498db' }, '11-99': { label: 'BEAMTER BRAUCHT HILFE', color: '#e74c3c' },
      '10-7': { label: 'Außer Dienst', color: '#7f8c8d' }
    };
    open({
      me: { agency: 'chp', callsign: '12-A7', status: '10-8' }, serverName: 'Sunset Valley+', location: 'Route 68, Harmony',
      statuses, maxJail: 120, agencies: [
        { id: 'chp', short: 'CHP', name: 'California Highway Patrol', color: '#c9a227' },
        { id: 'lspd', short: 'LSPD', name: 'Los Santos Police Department', color: '#2f6fdb' }]
    });
    renderUnits([{ agency: 'chp', callsign: '12-A7', name: 'Demo', status: '10-8', location: 'Route 68, Harmony' },
                 { agency: 'lspd', callsign: '1-ADAM-12', name: 'Demo 2', status: '10-97', location: 'Vespucci Blvd' }]);
  }
})();
