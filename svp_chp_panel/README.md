# Sunset Valley+ – Strafenkatalog für die Behörden

A FiveM resource (standalone, no ESX/QBCore needed). It contains **only the penalty catalog**:
about 110 offences with real California code sections (California Vehicle Code, Penal Code,
Health & Safety Code, plus federal law / U.S. Code for the USMS), each with a class, fine, jail units (HE) and license points.
A calculator adds up the penalty, and the "Kopieren" button produces a finished penalty notice.

- The UI description as a prompt is in [`UI-PROMPT.md`](UI-PROMPT.md).
- The complete code to write is below. Each block is one file.

## Folder structure
```
svp_chp_panel/
├── fxmanifest.lua
├── config.lua
├── server.lua
├── client.lua
└── html/
    ├── index.html
    ├── style.css
    ├── app.js
    └── data.js
```

## Installation
1. Create the folder `svp_chp_panel` in `resources/` and create the files below.
2. In `server.cfg`:
   ```cfg
   ensure svp_chp_panel

   # Permissions per agency
   add_ace group.chp  svp.mdt.chp  allow
   add_ace group.lspd svp.mdt.lspd allow
   add_ace group.lssd svp.mdt.lssd allow
   add_ace group.usms svp.mdt.usms allow
   add_ace group.doj  svp.mdt.doj  allow
   add_principal identifier.license:XXXXXXXX group.chp
   ```
3. In game: `/chp` or **F6**. For testing without permissions: `Config.UseAce = false`.

## Customising
| What | Where |
|---|---|
| Agencies, colors, permissions | `config.lua` → `Config.Agencies` |
| Max jail time | `config.lua` → `Config.MaxJail` |
| Command / key | `config.lua` → `Config.Command`, `Config.DefaultKey` |
| **Fines / jail / offences** | `html/data.js` → `SVP_CATALOG` |

> The sections follow real California law. The fines and jail units are server values for roleplay.
> The points are approximate values and can be changed freely in `data.js`.

## Code

### `fxmanifest.lua`
```lua
fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'svp_chp_panel'
description 'Strafenkatalog für die Behörden - Sunset Valley+'
author 'Sunset Valley+'
version '1.0.0'

shared_script 'config.lua'
client_script 'client.lua'
server_script 'server.lua'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/data.js',
    'html/app.js'
}
```

### `config.lua`
```lua
Config = {}

Config.ServerName   = 'Sunset Valley+'

-- Behörden, die den Strafenkatalog nutzen dürfen.
-- Jede Behörde hat eine eigene ACE-Permission (siehe README).
Config.Agencies = {
    { id = 'chp',  short = 'CHP',  name = 'California Highway Patrol',     ace = 'svp.mdt.chp',  color = '#c9a227' },
    { id = 'lspd', short = 'LSPD', name = 'Los Santos Police Department',  ace = 'svp.mdt.lspd', color = '#2f6fdb' },
    { id = 'lssd', short = 'LSSD', name = "Los Santos Sheriff's Department", ace = 'svp.mdt.lssd', color = '#3c8d4a' },
    { id = 'usms', short = 'USMS', name = 'United States Marshals Service', ace = 'svp.mdt.usms', color = '#a8b2c1' },
    { id = 'doj',  short = 'DOJ',  name = 'Department of Justice',         ace = 'svp.mdt.doj',  color = '#8e44ad' },
}

-- Obergrenze für Haftzeit (Hafteinheiten = Minuten im Gefängnis-Script)
Config.MaxJail      = 120

-- Befehl + Standard-Taste zum Öffnen des Strafenkatalogs
Config.Command      = 'chp'
Config.DefaultKey   = 'F6'

-- Zugriff über die ACE-Permissions der Behörden (Config.Agencies).
-- Auf false setzen, damit jeder den Katalog öffnen kann (z.B. zum Testen)
Config.UseAce       = true
```

### `server.lua`
```lua
-- Sunset Valley+ | Strafenkatalog - Server

-- Liefert die Behörden, auf die der Spieler Zugriff hat
local function allowedAgencies(src)
    local list = {}
    for _, a in ipairs(Config.Agencies) do
        if not Config.UseAce or IsPlayerAceAllowed(src, a.ace) then
            list[#list + 1] = { id = a.id, short = a.short, name = a.name, color = a.color }
        end
    end
    return list
end

RegisterNetEvent('svp_chp:requestOpen', function()
    local src = source
    local agencies = allowedAgencies(src)
    if #agencies == 0 then
        TriggerClientEvent('svp_chp:denied', src)
        return
    end
    TriggerClientEvent('svp_chp:open', src, GetPlayerName(src), agencies)
end)
```

### `client.lua`
```lua
-- Sunset Valley+ | Strafenkatalog - Client
local isOpen = false

local function close()
    isOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
end

RegisterCommand(Config.Command, function()
    if isOpen then close() return end
    TriggerServerEvent('svp_chp:requestOpen')
end, false)

RegisterKeyMapping(Config.Command, 'Strafenkatalog öffnen', 'keyboard', Config.DefaultKey)

RegisterNetEvent('svp_chp:open', function(officer, agencies)
    isOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'open',
        officer = officer,
        agencies = agencies,
        serverName = Config.ServerName,
        maxJail = Config.MaxJail
    })
end)

RegisterNetEvent('svp_chp:denied', function()
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName('~r~Kein Zugriff:~s~ Nur für Beamte der Behörden.')
    EndTextCommandThefeedPostTicker(false, true)
end)

RegisterNUICallback('close', function(_, cb) close() cb('ok') end)
```

### `html/index.html`
```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Sunset Valley+ Strafenkatalog</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="tablet" class="hidden">
    <header>
      <div class="brand">
        <div class="badge" id="badge">CHP</div>
        <div>
          <div class="title" id="deptName">California Highway Patrol</div>
          <div class="subtitle"><span id="serverName">Sunset Valley+</span> · Strafenkatalog</div>
        </div>
      </div>
      <div class="me">
        <select id="agencySelect" title="Behörde"></select>
        <button class="close" id="closeBtn" title="Schließen (ESC)">✕</button>
      </div>
    </header>

    <main>
      <div class="catalog">
        <div class="cat-list">
          <div class="toolbar">
            <input id="search" placeholder="Paragraph oder Tatbestand suchen… (z.B. 23152, Raub)">
            <select id="catFilter"><option value="">Alle Kategorien</option></select>
            <select id="clsFilter">
              <option value="">Alle Klassen</option>
              <option value="I">Infraction</option>
              <option value="M">Misdemeanor</option>
              <option value="F">Felony</option>
            </select>
          </div>
          <div id="catalogTable"></div>
        </div>

        <aside class="ticket">
          <h3>Strafbescheid</h3>
          <input id="suspect" placeholder="Name der Person">
          <input id="plate" placeholder="Kennzeichen (optional)">
          <div id="ticketItems" class="ticket-items"><div class="empty">Tatbestände links anklicken.</div></div>
          <div class="totals">
            <div><span>Geldstrafe</span><b id="totFine">$0</b></div>
            <div><span>Haft</span><b id="totJail">0 HE</b></div>
            <div><span>Punkte</span><b id="totPoints">0</b></div>
            <div id="licWarn" class="lic hidden">⚠ Führerscheinentzug empfohlen</div>
          </div>
          <textarea id="notes" rows="2" placeholder="Bemerkungen / Sachverhalt"></textarea>
          <div class="btns">
            <button id="copyBtn" class="primary">📋 Kopieren</button>
            <button id="clearBtn" class="danger">🗑</button>
          </div>
        </aside>
      </div>
    </main>
    <div id="toast" class="hidden"></div>
  </div>

  <script src="data.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

### `html/style.css`
```css
:root {
  --bg: #0f1621;
  --panel: #162131;
  --panel2: #1c2a3d;
  --line: #2a3b52;
  --text: #e6edf5;
  --muted: #8ea1b8;
  --accent: #c9a227;
  --red: #e74c3c;
  --green: #2ecc71;
  --blue: #3498db;
  --yellow: #f1c40f;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; background: transparent; overflow: hidden;
  font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: var(--text); font-size: 14px; }
.hidden { display: none !important; }

#tablet {
  position: absolute; inset: 5vh 6vw; display: flex; flex-direction: column;
  background: var(--bg); border: 3px solid #05080d; border-radius: 18px;
  box-shadow: 0 0 0 10px #1b1f26, 0 20px 60px rgba(0,0,0,.7); overflow: hidden;
}
header {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  padding: 10px 16px; background: linear-gradient(90deg, #0b2447, #19376d);
  border-bottom: 3px solid var(--accent);
}
.brand { display: flex; align-items: center; gap: 12px; }
.badge {
  width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center;
  background: var(--accent); color: #111; font-weight: 800; font-size: 12px; border: 2px solid #fff;
}
.title { font-weight: 700; font-size: 17px; letter-spacing: .5px; }
.subtitle { color: #b8c7dc; font-size: 12px; }
.me { display: flex; gap: 8px; align-items: center; }
input, select, textarea, button {
  font: inherit; color: var(--text); background: var(--panel2); border: 1px solid var(--line);
  border-radius: 6px; padding: 7px 10px; outline: none;
}
input:focus, select:focus, textarea:focus { border-color: var(--accent); }
button { cursor: pointer; background: var(--panel2); }
button:hover { filter: brightness(1.2); }
button.primary { background: var(--accent); color: #111; border-color: var(--accent); font-weight: 700; }
button.danger { background: #5a1f1f; border-color: #7a2a2a; }
button.close { background: transparent; border: none; font-size: 18px; }

main { flex: 1; padding: 14px; min-width: 0; min-height: 0; overflow: hidden; }
.toolbar { display: flex; gap: 8px; }
.toolbar input { flex: 1; }

.catalog { display: flex; gap: 14px; height: 100%; min-height: 0; }
.cat-list { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
#catalogTable { flex: 1; overflow-y: auto; padding-right: 4px; }
.cat-head { position: sticky; top: 0; background: var(--bg); color: var(--accent); font-weight: 700;
  padding: 8px 2px 6px; border-bottom: 1px solid var(--line); z-index: 1; }
.row {
  display: grid; grid-template-columns: 120px 1fr 34px 80px 60px 40px; gap: 8px; align-items: center;
  padding: 7px 8px; border-bottom: 1px solid #1f2d40; cursor: pointer; border-radius: 4px;
}
.row:hover { background: var(--panel2); }
.row.sel { background: rgba(201,162,39,.12); }
.code { font-family: Consolas, monospace; color: #9fc3ff; font-size: 13px; }
.cls { font-size: 11px; font-weight: 800; text-align: center; border-radius: 4px; padding: 2px 0; }
.cls.I { background: #24466b; } .cls.M { background: #7a5b12; } .cls.F { background: #7a1f1f; }
.num { text-align: right; font-variant-numeric: tabular-nums; color: var(--muted); }
.num.fine { color: var(--green); }

.ticket { width: 330px; background: var(--panel); border: 1px solid var(--line); border-radius: 10px;
  padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.ticket h3 { color: var(--accent); font-size: 15px; }
.ticket-items { flex: 1; overflow-y: auto; border: 1px dashed var(--line); border-radius: 6px; padding: 4px; min-height: 80px; }
.ticket-items .empty { color: var(--muted); text-align: center; padding: 20px 6px; font-size: 13px; }
.ti { display: flex; align-items: center; gap: 6px; padding: 5px; border-bottom: 1px solid #22324a; font-size: 12px; }
.ti .t { flex: 1; } .ti .t small { display: block; color: var(--muted); }
.ti button { padding: 1px 7px; font-size: 12px; }
.ti .cnt { width: 20px; text-align: center; font-weight: 700; }
.totals { background: var(--panel2); border-radius: 6px; padding: 8px 10px; }
.totals div { display: flex; justify-content: space-between; padding: 2px 0; }
.totals b { font-size: 15px; } #totFine { color: var(--green); }
.lic { color: var(--red); font-weight: 700; justify-content: center !important; }
.btns { display: flex; gap: 6px; } .btns button { flex: 1; } .btns .danger { flex: 0 0 44px; }
textarea { resize: none; }

#toast { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: var(--accent); color: #111; padding: 8px 18px; border-radius: 20px; font-weight: 700; }
::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
```

### `html/app.js`
```js
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
```

### `html/data.js`
```js
/*
 * Sunset Valley+ | Strafenkatalog
 *
 * Paragraphen = echte kalifornische Gesetze:
 *   CVC = California Vehicle Code, PC = Penal Code, HS = Health & Safety Code,
 *   USC = United States Code (Bundesrecht, Zuständigkeit USMS)
 * Klasse: I = Infraction (Ordnungswidrigkeit), M = Misdemeanor (Vergehen),
 *         F = Felony (Verbrechen)
 * fine   = Geldstrafe in $ (Server-Werte, frei anpassbar)
 * jail   = Hafteinheiten (HE) für das Gefängnis-Script
 * points = Punkte auf den Führerschein (DMV-Punktesystem, Richtwerte)
 * license = true -> Führerscheinentzug empfohlen
 */
window.SVP_CATALOG = [
  {
    id: 'traffic', name: 'Verkehrsverstöße (CVC)', items: [
      { code: 'CVC 22350',      title: 'Nicht angepasste Geschwindigkeit (Basic Speed Law)', cls: 'I', fine: 250,  jail: 0,  points: 1 },
      { code: 'CVC 22349(a)',   title: 'Überschreitung Höchstgeschwindigkeit (65 mph)',       cls: 'I', fine: 350,  jail: 0,  points: 1 },
      { code: 'CVC 22348(b)',   title: 'Geschwindigkeit über 100 mph',                       cls: 'I', fine: 1000, jail: 0,  points: 2, license: true },
      { code: 'CVC 22400(a)',   title: 'Behinderung durch zu langsames Fahren',              cls: 'I', fine: 150,  jail: 0,  points: 1 },
      { code: 'CVC 21453(a)',   title: 'Rotlichtverstoß',                                    cls: 'I', fine: 500,  jail: 0,  points: 1 },
      { code: 'CVC 22450(a)',   title: 'Stoppschild missachtet',                             cls: 'I', fine: 250,  jail: 0,  points: 1 },
      { code: 'CVC 21801(a)',   title: 'Vorfahrt beim Linksabbiegen missachtet',             cls: 'I', fine: 250,  jail: 0,  points: 1 },
      { code: 'CVC 21950(a)',   title: 'Vorrang von Fußgängern am Überweg missachtet',       cls: 'I', fine: 300,  jail: 0,  points: 1 },
      { code: 'CVC 21658(a)',   title: 'Fahrstreifen nicht eingehalten',                     cls: 'I', fine: 200,  jail: 0,  points: 1 },
      { code: 'CVC 22107',      title: 'Unsicherer Spurwechsel / ohne Blinker',              cls: 'I', fine: 200,  jail: 0,  points: 1 },
      { code: 'CVC 21651(b)',   title: 'Falschfahrer auf geteilter Schnellstraße',           cls: 'M', fine: 2000, jail: 10, points: 2, license: true },
      { code: 'CVC 21755',      title: 'Rechts überholen (unsicher)',                        cls: 'I', fine: 250,  jail: 0,  points: 1 },
      { code: 'CVC 23123.5',    title: 'Handy am Steuer',                                    cls: 'I', fine: 200,  jail: 0,  points: 0 },
      { code: 'CVC 27315(d)',   title: 'Nicht angeschnallt',                                 cls: 'I', fine: 150,  jail: 0,  points: 0 },
      { code: 'CVC 22500',      title: 'Halte-/Parkverbot',                                  cls: 'I', fine: 100,  jail: 0,  points: 0 },
      { code: 'CVC 21806(a)',   title: 'Einsatzfahrzeug keine Rettungsgasse / Vorrang',      cls: 'I', fine: 500,  jail: 0,  points: 1 },
      { code: 'CVC 21809(a)',   title: 'Move-Over-Gesetz missachtet (Einsatzstelle)',        cls: 'I', fine: 400,  jail: 0,  points: 0 },
      { code: 'CVC 2800(a)',    title: 'Anweisung eines Beamten missachtet',                 cls: 'M', fine: 750,  jail: 5,  points: 1 },
      { code: 'CVC 23103(a)',   title: 'Rücksichtsloses Fahren (Reckless Driving)',          cls: 'M', fine: 1500, jail: 10, points: 2 },
      { code: 'CVC 23109(a)',   title: 'Illegales Straßenrennen (Speed Contest)',            cls: 'M', fine: 2500, jail: 15, points: 2, license: true },
      { code: 'CVC 23109(c)',   title: 'Burnout / Exhibition of Speed',                      cls: 'M', fine: 1000, jail: 5,  points: 1 },
    ]
  },
  {
    id: 'vehicle', name: 'Fahrzeug & Dokumente (CVC)', items: [
      { code: 'CVC 12500(a)',   title: 'Fahren ohne Führerschein',                           cls: 'M', fine: 1000, jail: 5,  points: 1 },
      { code: 'CVC 12951(a)',   title: 'Führerschein nicht mitgeführt',                      cls: 'I', fine: 100,  jail: 0,  points: 0 },
      { code: 'CVC 14601.1(a)', title: 'Fahren trotz Führerscheinentzug',                    cls: 'M', fine: 2500, jail: 15, points: 2 },
      { code: 'CVC 4000(a)(1)', title: 'Fahrzeug nicht zugelassen',                          cls: 'I', fine: 300,  jail: 0,  points: 0 },
      { code: 'CVC 16028(a)',   title: 'Kein Versicherungsnachweis',                         cls: 'I', fine: 500,  jail: 0,  points: 0 },
      { code: 'CVC 5200(a)',    title: 'Kennzeichen fehlt / nicht sichtbar',                 cls: 'I', fine: 200,  jail: 0,  points: 0 },
      { code: 'CVC 26708(a)',   title: 'Unzulässige Scheibentönung',                         cls: 'I', fine: 200,  jail: 0,  points: 0 },
      { code: 'CVC 24250',      title: 'Fahren ohne Licht bei Dunkelheit',                   cls: 'I', fine: 150,  jail: 0,  points: 0 },
      { code: 'CVC 27150(a)',   title: 'Unzulässige / zu laute Auspuffanlage',               cls: 'I', fine: 250,  jail: 0,  points: 0 },
      { code: 'CVC 24002(a)',   title: 'Fahrzeug nicht verkehrssicher',                      cls: 'I', fine: 300,  jail: 0,  points: 0 },
      { code: 'CVC 27606',      title: 'Unerlaubte Blaulicht-/Sirenenanlage',                cls: 'M', fine: 1500, jail: 5,  points: 0 },
      { code: 'CVC 10851(a)',   title: 'Fahrzeugdiebstahl / unbefugte Benutzung',            cls: 'F', fine: 5000, jail: 25, points: 0 },
      { code: 'CVC 10852',      title: 'Manipulation / Beschädigung eines Fahrzeugs',        cls: 'M', fine: 1000, jail: 5,  points: 0 },
    ]
  },
  {
    id: 'dui', name: 'Alkohol, Unfall & Flucht (CVC)', items: [
      { code: 'CVC 23152(a)',   title: 'Fahren unter Alkohol-/Drogeneinfluss (DUI)',         cls: 'M', fine: 3000, jail: 15, points: 2, license: true },
      { code: 'CVC 23152(b)',   title: 'DUI mit 0,08 % BAK oder mehr',                       cls: 'M', fine: 3000, jail: 15, points: 2, license: true },
      { code: 'CVC 23153(a)',   title: 'DUI mit Personenschaden',                            cls: 'F', fine: 8000, jail: 40, points: 2, license: true },
      { code: 'CVC 23222(a)',   title: 'Offener Alkoholbehälter im Fahrzeug',                cls: 'I', fine: 250,  jail: 0,  points: 0 },
      { code: 'CVC 20002(a)',   title: 'Fahrerflucht (Sachschaden)',                         cls: 'M', fine: 2000, jail: 10, points: 2 },
      { code: 'CVC 20001(a)',   title: 'Fahrerflucht (Personenschaden)',                     cls: 'F', fine: 6000, jail: 30, points: 2, license: true },
      { code: 'CVC 2800.1(a)',  title: 'Flucht vor der Polizei (Evading)',                   cls: 'M', fine: 3000, jail: 15, points: 2 },
      { code: 'CVC 2800.2(a)',  title: 'Flucht vor der Polizei mit rücksichtsloser Fahrweise', cls: 'F', fine: 6000, jail: 30, points: 2, license: true },
      { code: 'CVC 2800.3(a)',  title: 'Flucht vor der Polizei mit Personenschaden',         cls: 'F', fine: 9000, jail: 45, points: 2, license: true },
    ]
  },
  {
    id: 'penal', name: 'Straftaten (Penal Code)', items: [
      { code: 'PC 148(a)(1)',   title: 'Widerstand / Behinderung eines Beamten',             cls: 'M', fine: 1500, jail: 10, points: 0 },
      { code: 'PC 69',          title: 'Widerstand gegen Vollstreckungsbeamte (Gewalt/Drohung)', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 148.9(a)',    title: 'Falsche Identität gegenüber Beamten',                cls: 'M', fine: 1000, jail: 5,  points: 0 },
      { code: 'PC 148.5(a)',    title: 'Falsche Notrufmeldung / Falschanzeige',              cls: 'M', fine: 1500, jail: 5,  points: 0 },
      { code: 'PC 415',         title: 'Störung der öffentlichen Ordnung',                   cls: 'M', fine: 500,  jail: 0,  points: 0 },
      { code: 'PC 647(f)',      title: 'Öffentliche Trunkenheit',                            cls: 'M', fine: 300,  jail: 0,  points: 0 },
      { code: 'PC 602',         title: 'Hausfriedensbruch / unbefugtes Betreten',            cls: 'M', fine: 750,  jail: 5,  points: 0 },
      { code: 'PC 594(a)',      title: 'Sachbeschädigung / Vandalismus',                     cls: 'M', fine: 1000, jail: 5,  points: 0 },
      { code: 'PC 240',         title: 'Tätlicher Angriff (Assault)',                        cls: 'M', fine: 1500, jail: 10, points: 0 },
      { code: 'PC 242',         title: 'Körperverletzung (Battery)',                         cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: 'PC 243(b)',      title: 'Körperverletzung an einem Beamten',                  cls: 'M', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 245(a)(1)',   title: 'Angriff mit tödlicher Waffe (ADW)',                  cls: 'F', fine: 8000, jail: 40, points: 0 },
      { code: 'PC 245(c)',      title: 'Angriff mit tödlicher Waffe auf einen Beamten',      cls: 'F', fine: 12000, jail: 60, points: 0 },
      { code: 'PC 422',         title: 'Ernsthafte Bedrohung (Criminal Threats)',            cls: 'F', fine: 2500, jail: 15, points: 0 },
      { code: 'PC 488',         title: 'Einfacher Diebstahl (Petty Theft)',                  cls: 'M', fine: 1000, jail: 5,  points: 0 },
      { code: 'PC 487',         title: 'Schwerer Diebstahl (Grand Theft)',                   cls: 'F', fine: 3500, jail: 20, points: 0 },
      { code: 'PC 496(a)',      title: 'Hehlerei (Besitz gestohlener Ware)',                 cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: 'PC 459',         title: 'Einbruch (Burglary)',                                cls: 'F', fine: 5000, jail: 25, points: 0 },
      { code: 'PC 211',         title: 'Raub (Robbery)',                                     cls: 'F', fine: 7500, jail: 35, points: 0 },
      { code: 'PC 215(a)',      title: 'Fahrzeugraub (Carjacking)',                          cls: 'F', fine: 9000, jail: 45, points: 0 },
      { code: 'PC 207(a)',      title: 'Entführung (Kidnapping)',                            cls: 'F', fine: 15000, jail: 70, points: 0 },
      { code: 'PC 236',         title: 'Freiheitsberaubung (False Imprisonment)',            cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 192(c)(1)',   title: 'Fahrlässige Tötung mit Fahrzeug',                    cls: 'F', fine: 12000, jail: 60, points: 2, license: true },
      { code: 'PC 192(a)',      title: 'Totschlag (Voluntary Manslaughter)',                 cls: 'F', fine: 15000, jail: 80, points: 0 },
      { code: 'PC 664/187(a)',  title: 'Versuchter Mord',                                    cls: 'F', fine: 20000, jail: 90, points: 0 },
      { code: 'PC 187(a)',      title: 'Mord',                                               cls: 'F', fine: 30000, jail: 120, points: 0 },
      { code: 'PC 32',          title: 'Beihilfe nach der Tat (Accessory)',                  cls: 'F', fine: 2500, jail: 15, points: 0 },
      { code: 'PC 182(a)',      title: 'Verabredung zu einer Straftat (Conspiracy)',         cls: 'F', fine: 5000, jail: 20, points: 0 },
      { code: 'PC 67',          title: 'Bestechung eines Beamten',                           cls: 'F', fine: 7500, jail: 25, points: 0 },
      { code: 'PC 538d(a)',     title: 'Amtsanmaßung (Vortäuschen Polizeibeamter)',          cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 166(a)(4)',   title: 'Missachtung einer gerichtlichen Anordnung',          cls: 'M', fine: 1500, jail: 10, points: 0 },
      { code: 'PC 853.7',       title: 'Nichterscheinen trotz Vorladung (FTA)',              cls: 'M', fine: 1000, jail: 5,  points: 0 },
    ]
  },
  {
    id: 'weapons', name: 'Waffen (Penal Code)', items: [
      { code: 'PC 417(a)(2)',   title: 'Bedrohen / Zeigen einer Schusswaffe (Brandishing)',  cls: 'M', fine: 2500, jail: 10, points: 0 },
      { code: 'PC 25400(a)',    title: 'Verdecktes Tragen einer Schusswaffe ohne Lizenz',    cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 25850(a)',    title: 'Geladene Schusswaffe in der Öffentlichkeit',          cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 26350(a)',    title: 'Offenes Tragen einer Faustfeuerwaffe',               cls: 'M', fine: 1500, jail: 5,  points: 0 },
      { code: 'PC 29800(a)',    title: 'Waffenbesitz als vorbestrafte Person (Felon)',       cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 30605(a)',    title: 'Besitz einer Sturmwaffe (Assault Weapon)',           cls: 'F', fine: 8000, jail: 35, points: 0 },
      { code: 'PC 246',         title: 'Schießen auf bewohntes Gebäude / Fahrzeug',          cls: 'F', fine: 10000, jail: 50, points: 0 },
      { code: 'PC 26100(c)',    title: 'Schießen aus einem Fahrzeug (Drive-By)',             cls: 'F', fine: 12000, jail: 60, points: 0 },
      { code: 'PC 21310',       title: 'Verdecktes Tragen eines Dolches / Messers',          cls: 'M', fine: 1000, jail: 5,  points: 0 },
    ]
  },
  {
    id: 'drugs', name: 'Betäubungsmittel (Health & Safety Code)', items: [
      { code: 'HS 11357(b)',    title: 'Cannabis-Besitz über der erlaubten Menge (28,5 g)',  cls: 'M', fine: 500,  jail: 0,  points: 0 },
      { code: 'HS 11359(b)',    title: 'Besitz von Cannabis zum Verkauf',                    cls: 'M', fine: 2500, jail: 10, points: 0 },
      { code: 'HS 11358',       title: 'Illegaler Cannabis-Anbau',                           cls: 'M', fine: 3000, jail: 10, points: 0 },
      { code: 'HS 11350(a)',    title: 'Besitz einer kontrollierten Substanz',               cls: 'M', fine: 1500, jail: 10, points: 0 },
      { code: 'HS 11377(a)',    title: 'Besitz von Methamphetamin',                          cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: 'HS 11351',       title: 'Besitz kontrollierter Substanzen zum Verkauf',       cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'HS 11378',       title: 'Besitz von Methamphetamin zum Verkauf',              cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'HS 11352(a)',    title: 'Transport / Verkauf kontrollierter Substanzen',      cls: 'F', fine: 8000, jail: 40, points: 0 },
      { code: 'HS 11379.6',     title: 'Herstellung von Drogen (Drogenlabor)',               cls: 'F', fine: 12000, jail: 60, points: 0 },
      { code: 'HS 11364',       title: 'Besitz von Drogenutensilien',                        cls: 'M', fine: 300,  jail: 0,  points: 0 },
      { code: 'HS 11550(a)',    title: 'Unter Einfluss kontrollierter Substanzen',           cls: 'M', fine: 1000, jail: 5,  points: 0 },
    ]
  },
  {
    id: 'federal', name: 'Bundesrecht (U.S. Code)', items: [
      { code: '18 USC 111',     title: 'Angriff auf / Behinderung eines Bundesbeamten',      cls: 'F', fine: 8000, jail: 35, points: 0 },
      { code: '18 USC 912',     title: 'Amtsanmaßung (Vortäuschen Bundesbeamter)',           cls: 'F', fine: 5000, jail: 20, points: 0 },
      { code: '18 USC 1001',    title: 'Falschaussage gegenüber Bundesbehörden',             cls: 'F', fine: 4000, jail: 15, points: 0 },
      { code: '18 USC 1071',    title: 'Verstecken eines Flüchtigen (Harboring)',            cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: '18 USC 1073',    title: 'Flucht zur Vermeidung von Strafverfolgung',          cls: 'F', fine: 5000, jail: 25, points: 0 },
      { code: '18 USC 751',     title: 'Flucht aus dem Gewahrsam (Escape)',                  cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: '18 USC 3146',    title: 'Nichterscheinen trotz Kaution (Bail Jumping)',       cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: '18 USC 401',     title: 'Missachtung des Bundesgerichts (Contempt)',          cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: '18 USC 1503',    title: 'Behinderung der Justiz (Obstruction of Justice)',    cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: '18 USC 1512',    title: 'Zeugenbeeinflussung (Witness Tampering)',            cls: 'F', fine: 8000, jail: 40, points: 0 },
      { code: '18 USC 1201',    title: 'Entführung (Bundesrecht)',                           cls: 'F', fine: 15000, jail: 80, points: 0 },
      { code: '18 USC 922(g)',  title: 'Waffenbesitz trotz Verbot (z.B. vorbestraft)',       cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: '18 USC 1361',    title: 'Beschädigung von Bundeseigentum',                    cls: 'M', fine: 2500, jail: 10, points: 0 },
    ]
  },
];
```
