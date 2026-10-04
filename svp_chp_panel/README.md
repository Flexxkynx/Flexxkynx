# Sunset Valley+ – Strafenkatalog für die Behörden

A FiveM resource (standalone, no ESX/QBCore needed). It contains **only the penalty catalog**:
231 offences with real code sections: 155 from the **California Penal Code**, plus California Vehicle Code,
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="tablet" class="hidden">
    <header>
      <div class="brand">
        <div class="emblem">
          <svg viewBox="0 0 64 72" aria-hidden="true">
            <path d="M32 2 L60 12 V34 C60 52 47 64 32 70 C17 64 4 52 4 34 V12 Z" class="shield"/>
            <path d="M32 8 L54 16 V34 C54 49 44 58 32 63 C20 58 10 49 10 34 V16 Z" class="shield-inner"/>
          </svg>
          <span id="badge">CHP</span>
        </div>
        <div>
          <div class="title" id="deptName">California Highway Patrol</div>
          <div class="subtitle"><span id="serverName">Sunset Valley+</span><span class="dot"></span>Strafenkatalog</div>
        </div>
      </div>
      <div class="head-right">
        <div class="agencies" id="agencyTabs"></div>
        <div class="clock" id="clock">--:--</div>
        <button class="icon-btn" id="closeBtn" title="Schließen (ESC)">✕</button>
      </div>
    </header>

    <div class="body">
      <nav class="cats" id="catNav"></nav>

      <section class="list">
        <div class="toolbar">
          <label class="search">
            <span class="s-icon">⌕</span>
            <input id="search" placeholder="Paragraph oder Tatbestand suchen… (z.B. 23152, Raub)">
            <kbd>/</kbd>
          </label>
          <div class="seg" id="clsSeg">
            <button data-cls="" class="on">Alle</button>
            <button data-cls="I">Infraction</button>
            <button data-cls="M">Misdemeanor</button>
            <button data-cls="F">Felony</button>
          </div>
        </div>
        <div class="list-head">
          <span>Paragraph</span><span>Tatbestand</span><span class="r">Geldstrafe</span><span class="r">Haft</span><span class="r">Punkte</span><span></span>
        </div>
        <div id="catalogTable"></div>
        <div class="list-foot" id="resultCount"></div>
      </section>

      <aside class="ticket">
        <div class="paper-head">
          <div>
            <div class="ph-title">Strafbescheid</div>
            <div class="ph-sub" id="ticketNo">Nr. SV-000000</div>
          </div>
          <div class="ph-date" id="ticketDate"></div>
        </div>
        <div class="fields">
          <label><span>Person</span><input id="suspect" placeholder="Vor- und Nachname"></label>
          <label><span>Kennzeichen</span><input id="plate" placeholder="optional"></label>
        </div>
        <div id="ticketItems" class="ticket-items"></div>
        <div class="stats">
          <div class="stat"><span>Geldstrafe</span><b id="totFine">$0</b></div>
          <div class="stat"><span>Haft</span><b id="totJail">0 HE</b></div>
          <div class="stat"><span>Punkte</span><b id="totPoints">0</b></div>
        </div>
        <div id="licWarn" class="lic hidden">🪪 Führerscheinentzug empfohlen</div>
        <textarea id="notes" rows="2" placeholder="Bemerkungen / Sachverhalt"></textarea>
        <div class="btns">
          <button id="copyBtn" class="primary">📋 Strafbescheid kopieren</button>
          <button id="clearBtn" class="danger" title="Zurücksetzen">🗑</button>
        </div>
      </aside>
    </div>
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
  --bg: #0b1220;
  --bg2: #0f1829;
  --panel: #131e33;
  --panel2: #1a2740;
  --line: #24344f;
  --line2: #1b2840;
  --text: #e8eef7;
  --muted: #8396b2;
  --dim: #5b6d88;
  --accent: #c9a227;
  --green: #34d399;
  --red: #f05252;
  --cls-i: #3b82f6;
  --cls-m: #f59e0b;
  --cls-f: #ef4444;
  --radius: 12px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; background: transparent; overflow: hidden;
  font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif; color: var(--text); font-size: 14px;
  -webkit-font-smoothing: antialiased; }
.hidden { display: none !important; }
.mono, .code { font-family: 'JetBrains Mono', Consolas, monospace; }
button { font: inherit; color: inherit; cursor: pointer; border: none; background: none; }
input, textarea { font: inherit; color: var(--text); background: var(--bg2); border: 1px solid var(--line);
  border-radius: 8px; padding: 9px 11px; outline: none; transition: border-color .15s, box-shadow .15s; width: 100%; }
input::placeholder, textarea::placeholder { color: var(--dim); }
input:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
textarea { resize: none; }

/* ---------- Tablet ---------- */
#tablet {
  position: absolute; inset: 4.5vh 5vw; display: flex; flex-direction: column;
  background:
    radial-gradient(1200px 500px at 10% -10%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 60%),
    linear-gradient(180deg, var(--bg) 0%, #090f1b 100%);
  border-radius: 22px; overflow: hidden;
  box-shadow: 0 0 0 1px #2a3550, 0 0 0 12px #10141c, 0 0 0 13px #2a3040, 0 30px 80px rgba(0,0,0,.75);
  animation: pop .22s ease-out;
}
@keyframes pop { from { opacity: 0; transform: scale(.97) translateY(8px); } to { opacity: 1; transform: none; } }

/* ---------- Header ---------- */
header {
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  padding: 14px 20px; position: relative;
  background: linear-gradient(90deg, #0a1a36 0%, #10264d 55%, #0a1a36 100%);
}
header::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent); }
.brand { display: flex; align-items: center; gap: 14px; }
.emblem { position: relative; width: 48px; height: 54px; display: grid; place-items: center; }
.emblem svg { position: absolute; inset: 0; width: 100%; height: 100%; filter: drop-shadow(0 3px 8px rgba(0,0,0,.5)); }
.emblem .shield { fill: var(--accent); }
.emblem .shield-inner { fill: #0d1a33; stroke: color-mix(in srgb, var(--accent) 70%, #fff); stroke-width: 1.5; }
.emblem span { position: relative; font-weight: 800; font-size: 11px; letter-spacing: .5px; color: var(--accent); margin-top: -4px; }
.title { font-weight: 800; font-size: 18px; letter-spacing: .2px; }
.subtitle { color: #a9b9d2; font-size: 12px; display: flex; align-items: center; gap: 8px; margin-top: 2px; }
.dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }
.head-right { display: flex; align-items: center; gap: 12px; }
.agencies { display: flex; background: rgba(0,0,0,.25); border: 1px solid var(--line); border-radius: 10px; padding: 3px; gap: 2px; }
.agencies button { padding: 6px 11px; border-radius: 7px; font-size: 12px; font-weight: 700; color: var(--muted); transition: .15s; }
.agencies button:hover { color: var(--text); }
.agencies button.on { background: var(--accent); color: #0b1220; }
.clock { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #a9b9d2; padding: 0 4px; }
.icon-btn { width: 34px; height: 34px; border-radius: 9px; background: rgba(255,255,255,.06); font-size: 15px; transition: .15s; }
.icon-btn:hover { background: var(--red); }

/* ---------- Body ---------- */
.body { flex: 1; display: grid; grid-template-columns: 236px 1fr 360px; min-height: 0; }

/* Kategorien */
.cats { border-right: 1px solid var(--line2); padding: 14px 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.cats .cat-title { font-size: 11px; font-weight: 700; color: var(--dim); text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px 8px; }
.cat-btn { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 9px; text-align: left;
  color: var(--muted); font-size: 13px; font-weight: 500; transition: .12s; border: 1px solid transparent; }
.cat-btn:hover { background: var(--panel); color: var(--text); }
.cat-btn.on { background: var(--panel2); color: var(--text); border-color: var(--line);
  box-shadow: inset 3px 0 0 var(--accent); }
.cat-btn .ic { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 7px; background: var(--bg2); font-size: 14px; flex-shrink: 0; }
.cat-btn .nm { flex: 1; line-height: 1.25; }
.cat-btn .ct { font-size: 11px; font-weight: 700; color: var(--dim); background: var(--bg2); padding: 2px 7px; border-radius: 10px; }
.cat-btn.on .ct { color: var(--accent); }

/* Liste */
.list { display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: 14px 16px 8px; gap: 10px; }
.toolbar { display: flex; gap: 10px; align-items: center; }
.search { flex: 1; position: relative; display: flex; align-items: center; }
.search input { padding-left: 34px; padding-right: 40px; }
.s-icon { position: absolute; left: 11px; color: var(--dim); font-size: 17px; pointer-events: none; }
kbd { position: absolute; right: 9px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--dim);
  border: 1px solid var(--line); border-radius: 5px; padding: 1px 6px; }
.seg { display: flex; background: var(--bg2); border: 1px solid var(--line); border-radius: 9px; padding: 3px; gap: 2px; }
.seg button { padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: var(--muted); transition: .12s; }
.seg button:hover { color: var(--text); }
.seg button.on { background: var(--panel2); color: var(--text); box-shadow: 0 1px 0 rgba(255,255,255,.05) inset; }
.seg button[data-cls="I"].on { color: #93c5fd; } .seg button[data-cls="M"].on { color: #fcd34d; } .seg button[data-cls="F"].on { color: #fca5a5; }

.list-head, .row { display: grid; grid-template-columns: 138px 1fr 92px 66px 56px 40px; gap: 10px; align-items: center; }
.list-head { font-size: 11px; font-weight: 700; color: var(--dim); text-transform: uppercase; letter-spacing: .8px; padding: 0 12px 0 16px; }
.r { text-align: right; }
#catalogTable { flex: 1; overflow-y: auto; padding-right: 4px; }
.cat-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 8px;
  background: linear-gradient(var(--bg) 80%, transparent); padding: 10px 2px 8px;
  font-size: 12px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: .8px; }
.cat-head::after { content: ''; flex: 1; height: 1px; background: var(--line2); }
.row { position: relative; padding: 9px 12px 9px 16px; margin-bottom: 4px; border-radius: 10px; cursor: pointer;
  background: var(--panel); border: 1px solid transparent; transition: background .12s, border-color .12s, transform .08s; }
.row::before { content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; }
.row.I::before { background: var(--cls-i); } .row.M::before { background: var(--cls-m); } .row.F::before { background: var(--cls-f); }
.row:hover { background: var(--panel2); border-color: var(--line); }
.row:active { transform: scale(.995); }
.row.sel { border-color: color-mix(in srgb, var(--accent) 55%, transparent); background: color-mix(in srgb, var(--accent) 9%, var(--panel)); }
.row .code { font-size: 12px; font-weight: 700; color: #9cc3ff; background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.18);
  padding: 3px 7px; border-radius: 6px; width: fit-content; white-space: nowrap; }
.row .t { min-width: 0; }
.row .t b { display: block; font-weight: 600; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row .t small { display: flex; gap: 8px; font-size: 11px; color: var(--muted); margin-top: 2px; }
.tag { font-weight: 700; }
.tag.I { color: #93c5fd; } .tag.M { color: #fcd34d; } .tag.F { color: #fca5a5; }
.tag.lw { color: #fda4af; }
.num { text-align: right; font-variant-numeric: tabular-nums; color: var(--muted); font-weight: 600; font-size: 13px; }
.num.fine { color: var(--green); }
.add { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; justify-self: end;
  background: var(--bg2); border: 1px solid var(--line); color: var(--muted); font-weight: 800; font-size: 13px; transition: .12s; }
.row:hover .add { background: var(--accent); color: #0b1220; border-color: var(--accent); }
.row.sel .add { background: var(--accent); color: #0b1220; border-color: var(--accent); }
.list-foot { font-size: 11px; color: var(--dim); text-align: right; padding: 2px 4px; }
.no-hit { padding: 40px; text-align: center; color: var(--muted); }
.flash { animation: flash .35s ease-out; }
@keyframes flash { from { box-shadow: 0 0 0 3px var(--accent); } to { box-shadow: 0 0 0 0 transparent; } }

/* ---------- Strafbescheid ---------- */
.ticket { border-left: 1px solid var(--line2); background: linear-gradient(180deg, var(--bg2), var(--bg));
  padding: 14px; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
.paper-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 14px;
  border-radius: var(--radius); background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, var(--panel)), var(--panel));
  border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line)); }
.ph-title { font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 1.5px; }
.ph-sub { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); margin-top: 3px; }
.ph-date { font-size: 11px; color: var(--muted); text-align: right; font-family: 'JetBrains Mono', monospace; }
.fields { display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px; }
.fields label span { display: block; font-size: 10.5px; font-weight: 700; color: var(--dim); text-transform: uppercase; letter-spacing: .8px; margin: 0 0 4px 2px; }
#plate { text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }
.ticket-items { flex: 1; overflow-y: auto; border-radius: var(--radius); background: var(--panel); border: 1px solid var(--line2); padding: 6px; min-height: 90px; }
.empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  color: var(--dim); font-size: 13px; text-align: center; padding: 16px; }
.empty .big { font-size: 30px; opacity: .6; }
.ti { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 8px; animation: slide .18s ease-out; }
.ti + .ti { border-top: 1px solid var(--line2); }
@keyframes slide { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
.ti .t { flex: 1; min-width: 0; }
.ti .t b { font-size: 12px; color: #9cc3ff; }
.ti .t small { display: block; color: var(--muted); font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ti .sum { font-size: 12px; color: var(--green); font-weight: 600; font-variant-numeric: tabular-nums; }
.qty { display: flex; align-items: center; background: var(--bg2); border: 1px solid var(--line); border-radius: 7px; }
.qty button { width: 24px; height: 24px; color: var(--muted); font-weight: 700; }
.qty button:hover { color: var(--text); }
.qty span { min-width: 18px; text-align: center; font-weight: 700; font-size: 12px; }
.stats { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 8px; }
.stat { background: var(--panel); border: 1px solid var(--line2); border-radius: 10px; padding: 9px 11px; }
.stat span { display: block; font-size: 10.5px; font-weight: 700; color: var(--dim); text-transform: uppercase; letter-spacing: .8px; }
.stat b { display: block; white-space: nowrap; font-size: 19px; font-weight: 800; margin-top: 2px; font-variant-numeric: tabular-nums; }
#totFine { color: var(--green); }
.lic { background: rgba(240,82,82,.12); border: 1px solid rgba(240,82,82,.35); color: #fca5a5; font-weight: 700;
  font-size: 12.5px; text-align: center; padding: 8px; border-radius: 9px; }
.btns { display: flex; gap: 8px; }
.btns button { padding: 11px; border-radius: 10px; font-weight: 700; transition: .15s; }
.primary { flex: 1; background: var(--accent); color: #0b1220; box-shadow: 0 6px 18px color-mix(in srgb, var(--accent) 30%, transparent); }
.primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
.danger { width: 46px; background: rgba(240,82,82,.12); border: 1px solid rgba(240,82,82,.35) !important; }
.danger:hover { background: var(--red); }

#toast { position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%);
  background: var(--accent); color: #0b1220; padding: 9px 20px; border-radius: 999px; font-weight: 700;
  box-shadow: 0 10px 30px rgba(0,0,0,.45); animation: pop .18s ease-out; }
::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: #33476a; }

/* ---------- Kleinere Auflösungen ---------- */
@media (max-width: 1500px) {
  .body { grid-template-columns: 200px 1fr 320px; }
  .list-head, .row { grid-template-columns: 116px 1fr 74px 52px 40px 32px; gap: 8px; }
  .seg button { padding: 6px 8px; }
  .seg button[data-cls="I"]::after { content: ''; }
}
@media (max-width: 1300px) {
  #tablet { inset: 2.5vh 2.5vw; }
  .body { grid-template-columns: 64px 1fr 300px; }
  .cats .cat-title, .cat-btn .nm, .cat-btn .ct { display: none; }
  .cat-btn { justify-content: center; padding: 8px 0; }
  .seg button { font-size: 11px; }
  .title { font-size: 16px; }
  .stat b { font-size: 16px; }
  .stats { grid-template-columns: 1.4fr 1fr .8fr; }
}
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
    id: 'traffic', icon: '🚦', name: 'Verkehrsverstöße (CVC)', items: [
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
      { code: 'CVC 22106',      title: 'Unsicheres Anfahren / Ausparken',                    cls: 'I', fine: 150,  jail: 0,  points: 1 },
      { code: 'CVC 21460(a)',   title: 'Doppelte durchgezogene Linie überfahren',            cls: 'I', fine: 250,  jail: 0,  points: 1 },
      { code: 'CVC 22526(a)',   title: 'Kreuzung blockiert (Anti-Gridlock)',                 cls: 'I', fine: 200,  jail: 0,  points: 0 },
      { code: 'CVC 21200.5',    title: 'Fahrradfahren unter Alkohol-/Drogeneinfluss',        cls: 'M', fine: 250,  jail: 0,  points: 0 },
    ]
  },
  {
    id: 'vehicle', icon: '🚗', name: 'Fahrzeug & Dokumente (CVC)', items: [
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
    id: 'dui', icon: '🍺', name: 'Alkohol, Unfall & Flucht (CVC)', items: [
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
    id: 'persons', icon: '👤', name: 'Straftaten gegen Personen (PC)', items: [
      { code: 'PC 187(a)', title: 'Mord', cls: 'F', fine: 30000, jail: 120, points: 0 },
      { code: 'PC 664/187(a)', title: 'Versuchter Mord', cls: 'F', fine: 20000, jail: 90, points: 0 },
      { code: 'PC 192(a)', title: 'Totschlag (Voluntary Manslaughter)', cls: 'F', fine: 15000, jail: 80, points: 0 },
      { code: 'PC 192(b)', title: 'Fahrlässige Tötung (Involuntary Manslaughter)', cls: 'F', fine: 10000, jail: 50, points: 0 },
      { code: 'PC 192(c)(1)', title: 'Fahrlässige Tötung mit Fahrzeug', cls: 'F', fine: 12000, jail: 60, points: 2, license: true },
      { code: 'PC 191.5(a)', title: 'Fahrlässige Tötung mit Fahrzeug unter Alkoholeinfluss', cls: 'F', fine: 18000, jail: 90, points: 2, license: true },
      { code: 'PC 203', title: 'Schwere Körperverletzung / Verstümmelung (Mayhem)', cls: 'F', fine: 12000, jail: 60, points: 0 },
      { code: 'PC 205', title: 'Schwere Verstümmelung (Aggravated Mayhem)', cls: 'F', fine: 18000, jail: 90, points: 0 },
      { code: 'PC 206', title: 'Folter', cls: 'F', fine: 20000, jail: 100, points: 0 },
      { code: 'PC 207(a)', title: 'Entführung (Kidnapping)', cls: 'F', fine: 15000, jail: 70, points: 0 },
      { code: 'PC 209(a)', title: 'Entführung mit Lösegeldforderung', cls: 'F', fine: 25000, jail: 110, points: 0 },
      { code: 'PC 209.5(a)', title: 'Entführung bei einem Fahrzeugraub', cls: 'F', fine: 22000, jail: 100, points: 0 },
      { code: 'PC 210.5', title: 'Geiselnahme (Freiheitsberaubung mit Schutzschild)', cls: 'F', fine: 12000, jail: 60, points: 0 },
      { code: 'PC 236', title: 'Freiheitsberaubung (False Imprisonment)', cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 236.1(a)', title: 'Menschenhandel', cls: 'F', fine: 20000, jail: 100, points: 0 },
      { code: 'PC 240', title: 'Tätlicher Angriff (Assault)', cls: 'M', fine: 1500, jail: 10, points: 0 },
      { code: 'PC 241(c)', title: 'Tätlicher Angriff auf einen Beamten', cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 242', title: 'Körperverletzung (Battery)', cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: 'PC 243(b)', title: 'Körperverletzung an einem Beamten', cls: 'M', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 243(c)(2)', title: 'Körperverletzung an einem Beamten mit Verletzung', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 243(d)', title: 'Schwere Körperverletzung (Serious Bodily Injury)', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 243(e)(1)', title: 'Körperverletzung an (Ex-)Partner', cls: 'M', fine: 2500, jail: 10, points: 0 },
      { code: 'PC 245(a)(1)', title: 'Angriff mit tödlicher Waffe (ADW)', cls: 'F', fine: 8000, jail: 40, points: 0 },
      { code: 'PC 245(a)(2)', title: 'Angriff mit einer Schusswaffe', cls: 'F', fine: 10000, jail: 50, points: 0 },
      { code: 'PC 245(a)(4)', title: 'Angriff mit potenziell schwer verletzender Gewalt', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 245(c)', title: 'Angriff mit tödlicher Waffe auf einen Beamten', cls: 'F', fine: 12000, jail: 60, points: 0 },
      { code: 'PC 245(d)(1)', title: 'Angriff mit Schusswaffe auf einen Beamten', cls: 'F', fine: 15000, jail: 75, points: 0 },
      { code: 'PC 246', title: 'Schießen auf bewohntes Gebäude / Fahrzeug', cls: 'F', fine: 10000, jail: 50, points: 0 },
      { code: 'PC 246.3(a)', title: 'Fahrlässiges Abfeuern einer Schusswaffe', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 247(b)', title: 'Schießen auf unbewohntes Gebäude / Fahrzeug', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 26100(c)', title: 'Schießen aus einem Fahrzeug (Drive-By)', cls: 'F', fine: 12000, jail: 60, points: 0 },
      { code: 'PC 273.5(a)', title: 'Häusliche Gewalt mit Verletzung', cls: 'F', fine: 5000, jail: 25, points: 0 },
      { code: 'PC 273a(a)', title: 'Gefährdung eines Kindes', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 273d(a)', title: 'Kindesmisshandlung', cls: 'F', fine: 8000, jail: 40, points: 0 },
      { code: 'PC 368(b)(1)', title: 'Misshandlung älterer / abhängiger Personen', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 422', title: 'Ernsthafte Bedrohung (Criminal Threats)', cls: 'F', fine: 2500, jail: 15, points: 0 },
      { code: 'PC 646.9(a)', title: 'Stalking', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 653m(a)', title: 'Belästigende / bedrohende Anrufe', cls: 'M', fine: 750, jail: 0, points: 0 },
    ]
  },
  {
    id: 'sexual', icon: '🚫', name: 'Sexualdelikte (PC)', items: [
      { code: 'PC 261(a)(2)', title: 'Vergewaltigung', cls: 'F', fine: 25000, jail: 110, points: 0 },
      { code: 'PC 243.4(a)', title: 'Sexuelle Nötigung (Sexual Battery)', cls: 'F', fine: 8000, jail: 40, points: 0 },
      { code: 'PC 314(1)', title: 'Exhibitionismus (Indecent Exposure)', cls: 'M', fine: 1500, jail: 5, points: 0 },
      { code: 'PC 647(j)(1)', title: 'Voyeurismus', cls: 'M', fine: 1500, jail: 5, points: 0 },
      { code: 'PC 647(b)(1)', title: 'Prostitution', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 266h(a)', title: 'Zuhälterei (Pimping)', cls: 'F', fine: 8000, jail: 35, points: 0 },
      { code: 'PC 266i(a)', title: 'Anwerbung zur Prostitution (Pandering)', cls: 'F', fine: 8000, jail: 35, points: 0 },
    ]
  },
  {
    id: 'property', icon: '💰', name: 'Eigentums- & Vermögensdelikte (PC)', items: [
      { code: 'PC 211', title: 'Raub (Robbery)', cls: 'F', fine: 7500, jail: 35, points: 0 },
      { code: 'PC 215(a)', title: 'Fahrzeugraub (Carjacking)', cls: 'F', fine: 9000, jail: 45, points: 0 },
      { code: 'PC 459/460(a)', title: 'Wohnungseinbruch (1st Degree Burglary)', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 459/460(b)', title: 'Einbruch in Gewerbe / Fahrzeug (2nd Degree)', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 459.5', title: 'Ladendiebstahl (Shoplifting, bis $950)', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 466', title: 'Besitz von Einbruchswerkzeug', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 484(a)', title: 'Diebstahl', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 488', title: 'Einfacher Diebstahl (Petty Theft)', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 487(a)', title: 'Schwerer Diebstahl (über $950)', cls: 'F', fine: 3500, jail: 20, points: 0 },
      { code: 'PC 487(c)', title: 'Diebstahl direkt von einer Person', cls: 'F', fine: 3500, jail: 20, points: 0 },
      { code: 'PC 487(d)(1)', title: 'Schwerer Diebstahl eines Fahrzeugs', cls: 'F', fine: 5000, jail: 25, points: 0 },
      { code: 'PC 496(a)', title: 'Hehlerei (Besitz gestohlener Ware)', cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: 'PC 496d(a)', title: 'Hehlerei mit gestohlenen Fahrzeugen', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 503', title: 'Unterschlagung (Embezzlement)', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 518', title: 'Erpressung', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 524', title: 'Versuchte Erpressung', cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 470(a)', title: 'Urkundenfälschung', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 475(a)', title: 'Besitz gefälschter Dokumente / Banknoten', cls: 'F', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 476', title: 'Ungedeckte / gefälschte Schecks', cls: 'F', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 484e(d)', title: 'Diebstahl von Kreditkartendaten', cls: 'F', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 484g', title: 'Kreditkartenbetrug', cls: 'F', fine: 3500, jail: 15, points: 0 },
      { code: 'PC 530.5(a)', title: 'Identitätsdiebstahl', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 532(a)', title: 'Betrug (False Pretenses)', cls: 'M', fine: 2500, jail: 10, points: 0 },
      { code: 'PC 537(a)', title: 'Zechprellerei / Hotelbetrug', cls: 'M', fine: 500, jail: 0, points: 0 },
      { code: 'PC 550(a)', title: 'Versicherungsbetrug', cls: 'F', fine: 6000, jail: 25, points: 0 },
      { code: 'PC 502(c)', title: 'Computerkriminalität / Hacking', cls: 'F', fine: 5000, jail: 20, points: 0 },
      { code: 'PC 594(a)', title: 'Sachbeschädigung / Vandalismus (unter $400)', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 594(b)(1)', title: 'Sachbeschädigung (ab $400)', cls: 'F', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 594.3(a)', title: 'Beschädigung einer Kirche / Gedenkstätte', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 451(a)', title: 'Brandstiftung mit schwerer Körperverletzung', cls: 'F', fine: 15000, jail: 70, points: 0 },
      { code: 'PC 451(b)', title: 'Brandstiftung an bewohntem Gebäude', cls: 'F', fine: 12000, jail: 60, points: 0 },
      { code: 'PC 451(d)', title: 'Brandstiftung (Eigentum)', cls: 'F', fine: 8000, jail: 35, points: 0 },
      { code: 'PC 452(d)', title: 'Fahrlässige Brandverursachung', cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: 'PC 602', title: 'Hausfriedensbruch / unbefugtes Betreten', cls: 'M', fine: 750, jail: 5, points: 0 },
      { code: 'PC 602.5(a)', title: 'Unbefugtes Betreten einer Wohnung', cls: 'M', fine: 1500, jail: 5, points: 0 },
      { code: 'PC 597(a)', title: 'Tierquälerei', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 597.5(a)', title: 'Organisierte Hundekämpfe', cls: 'F', fine: 5000, jail: 25, points: 0 },
    ]
  },
  {
    id: 'justice', icon: '🏛️', name: 'Delikte gegen Staat & Justiz (PC)', items: [
      { code: 'PC 67', title: 'Bestechung eines Beamten', cls: 'F', fine: 7500, jail: 25, points: 0 },
      { code: 'PC 68(a)', title: 'Bestechlichkeit (Beamter nimmt Bestechung an)', cls: 'F', fine: 10000, jail: 40, points: 0 },
      { code: 'PC 69', title: 'Widerstand gegen Vollstreckungsbeamte (Gewalt/Drohung)', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 71', title: 'Bedrohung eines Amtsträgers', cls: 'F', fine: 3500, jail: 15, points: 0 },
      { code: 'PC 92', title: 'Bestechung eines Richters / Geschworenen', cls: 'F', fine: 10000, jail: 40, points: 0 },
      { code: 'PC 118(a)', title: 'Meineid (Perjury)', cls: 'F', fine: 5000, jail: 25, points: 0 },
      { code: 'PC 127', title: 'Anstiftung zum Meineid', cls: 'F', fine: 5000, jail: 25, points: 0 },
      { code: 'PC 132', title: 'Vorlage gefälschter Beweise', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 135', title: 'Vernichtung von Beweismitteln', cls: 'M', fine: 2500, jail: 10, points: 0 },
      { code: 'PC 136.1(a)', title: 'Einschüchterung von Zeugen / Opfern', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 137(b)', title: 'Zeugenbeeinflussung durch Gewalt / Drohung', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 141(a)', title: 'Unterschieben von Beweisen', cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 148(a)(1)', title: 'Widerstand / Behinderung eines Beamten', cls: 'M', fine: 1500, jail: 10, points: 0 },
      { code: 'PC 148(c)', title: 'Entwenden der Dienstwaffe eines Beamten', cls: 'F', fine: 8000, jail: 40, points: 0 },
      { code: 'PC 148.1(a)', title: 'Falsche Bombendrohung', cls: 'F', fine: 5000, jail: 25, points: 0 },
      { code: 'PC 148.3(a)', title: 'Falscher Notruf (Swatting)', cls: 'M', fine: 2500, jail: 10, points: 0 },
      { code: 'PC 148.5(a)', title: 'Falschanzeige', cls: 'M', fine: 1500, jail: 5, points: 0 },
      { code: 'PC 148.9(a)', title: 'Falsche Identität gegenüber Beamten', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 148.10(a)', title: 'Widerstand mit Todesfolge / schwerer Verletzung eines Beamten', cls: 'F', fine: 15000, jail: 70, points: 0 },
      { code: 'PC 146a(a)', title: 'Vortäuschen eines Ermittlers / Beamten zur Täuschung', cls: 'M', fine: 2500, jail: 10, points: 0 },
      { code: 'PC 538d(a)', title: 'Amtsanmaßung (Vortäuschen Polizeibeamter)', cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 166(a)(4)', title: 'Missachtung einer gerichtlichen Anordnung', cls: 'M', fine: 1500, jail: 10, points: 0 },
      { code: 'PC 166(c)(1)', title: 'Verstoß gegen Schutzanordnung (Restraining Order)', cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: 'PC 182(a)(1)', title: 'Verabredung zu einer Straftat (Conspiracy)', cls: 'F', fine: 5000, jail: 20, points: 0 },
      { code: 'PC 32', title: 'Beihilfe nach der Tat (Accessory)', cls: 'F', fine: 2500, jail: 15, points: 0 },
      { code: 'PC 186.22(a)', title: 'Beteiligung an krimineller Straßengang', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 853.7', title: 'Nichterscheinen trotz Vorladung (FTA)', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 1320(b)', title: 'Nichterscheinen nach Freilassung (Felony)', cls: 'F', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 1320.5', title: 'Nichterscheinen trotz Kaution (Bail Jumping)', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 4530(a)', title: 'Ausbruch aus dem Staatsgefängnis', cls: 'F', fine: 8000, jail: 40, points: 0 },
      { code: 'PC 4532(b)(1)', title: 'Ausbruch aus dem County-Gefängnis', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 4573(a)', title: 'Schmuggel von Drogen ins Gefängnis', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 4574(a)', title: 'Schmuggel von Waffen ins Gefängnis', cls: 'F', fine: 8000, jail: 35, points: 0 },
      { code: 'PC 4600(a)', title: 'Beschädigung von Gefängniseigentum', cls: 'M', fine: 2000, jail: 10, points: 0 },
    ]
  },
  {
    id: 'order', icon: '📢', name: 'Öffentliche Ordnung (PC)', items: [
      { code: 'PC 404.6(a)', title: 'Anstiftung zum Aufruhr (Riot)', cls: 'M', fine: 2500, jail: 10, points: 0 },
      { code: 'PC 405', title: 'Teilnahme an einem Aufruhr', cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: 'PC 409', title: 'Verbleiben bei einer aufgelösten Versammlung', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 415(1)', title: 'Schlägerei in der Öffentlichkeit', cls: 'M', fine: 750, jail: 5, points: 0 },
      { code: 'PC 415(2)', title: 'Ruhestörung durch Lärm', cls: 'M', fine: 300, jail: 0, points: 0 },
      { code: 'PC 415(3)', title: 'Beleidigende Worte in der Öffentlichkeit', cls: 'M', fine: 300, jail: 0, points: 0 },
      { code: 'PC 647(e)', title: 'Unerlaubtes Übernachten / Lagern', cls: 'M', fine: 300, jail: 0, points: 0 },
      { code: 'PC 647(f)', title: 'Öffentliche Trunkenheit', cls: 'M', fine: 300, jail: 0, points: 0 },
      { code: 'PC 647(h)', title: 'Herumlungern mit Diebstahlabsicht', cls: 'M', fine: 500, jail: 0, points: 0 },
      { code: 'PC 370/372', title: 'Öffentliches Ärgernis (Public Nuisance)', cls: 'M', fine: 500, jail: 0, points: 0 },
      { code: 'PC 374.3(a)', title: 'Illegale Müllentsorgung', cls: 'I', fine: 500, jail: 0, points: 0 },
      { code: 'PC 640(b)', title: 'Schwarzfahren (Fare Evasion)', cls: 'I', fine: 150, jail: 0, points: 0 },
      { code: 'PC 330', title: 'Illegales Glücksspiel', cls: 'M', fine: 1000, jail: 0, points: 0 },
      { code: 'PC 337a', title: 'Illegale Sportwetten (Bookmaking)', cls: 'M', fine: 2500, jail: 10, points: 0 },
    ]
  },
  {
    id: 'weapons', icon: '🔫', name: 'Waffen & Sprengstoff (PC)', items: [
      { code: 'PC 417(a)(2)', title: 'Bedrohen mit einer Schusswaffe (Brandishing)', cls: 'M', fine: 2500, jail: 10, points: 0 },
      { code: 'PC 417(c)', title: 'Bedrohen eines Beamten mit einer Schusswaffe', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 417.4', title: 'Bedrohen mit einer Waffen-Attrappe', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 25400(a)', title: 'Verdecktes Tragen einer Schusswaffe ohne Lizenz', cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 25850(a)', title: 'Geladene Schusswaffe in der Öffentlichkeit', cls: 'M', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 26350(a)', title: 'Offenes Tragen einer Faustfeuerwaffe', cls: 'M', fine: 1500, jail: 5, points: 0 },
      { code: 'PC 26500', title: 'Waffenverkauf ohne Händlerlizenz', cls: 'M', fine: 4000, jail: 15, points: 0 },
      { code: 'PC 27500(a)', title: 'Waffenverkauf an verbotene Person', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 29800(a)', title: 'Waffenbesitz als vorbestrafte Person (Felon)', cls: 'F', fine: 6000, jail: 30, points: 0 },
      { code: 'PC 30305(a)', title: 'Munitionsbesitz als verbotene Person', cls: 'F', fine: 3000, jail: 15, points: 0 },
      { code: 'PC 30605(a)', title: 'Besitz einer Sturmwaffe (Assault Weapon)', cls: 'F', fine: 8000, jail: 35, points: 0 },
      { code: 'PC 32625(a)', title: 'Besitz eines Maschinengewehrs (vollautomatisch)', cls: 'F', fine: 12000, jail: 50, points: 0 },
      { code: 'PC 33215', title: 'Kurzläufiges Gewehr / Schrotflinte', cls: 'F', fine: 5000, jail: 20, points: 0 },
      { code: 'PC 33410', title: 'Besitz eines Schalldämpfers', cls: 'F', fine: 5000, jail: 20, points: 0 },
      { code: 'PC 32310(a)', title: 'Herstellung / Verkauf von Großmagazinen', cls: 'M', fine: 3000, jail: 10, points: 0 },
      { code: 'PC 23900', title: 'Entfernte / unkenntliche Seriennummer', cls: 'F', fine: 4000, jail: 20, points: 0 },
      { code: 'PC 17500', title: 'Besitz einer tödlichen Waffe mit Angriffsabsicht', cls: 'M', fine: 2000, jail: 10, points: 0 },
      { code: 'PC 21310', title: 'Verdecktes Tragen eines Dolches / Messers', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 21510', title: 'Besitz / Tragen eines Springmessers', cls: 'M', fine: 750, jail: 0, points: 0 },
      { code: 'PC 21810', title: 'Besitz eines Schlagrings', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 22210', title: 'Besitz eines Totschlägers / Schlagstocks', cls: 'M', fine: 1000, jail: 5, points: 0 },
      { code: 'PC 626.10(a)', title: 'Waffen auf Schulgelände', cls: 'M', fine: 2500, jail: 10, points: 0 },
      { code: 'PC 18710(a)', title: 'Besitz eines Sprengsatzes', cls: 'F', fine: 10000, jail: 45, points: 0 },
      { code: 'PC 18720', title: 'Sprengsatz mit Absicht zu Schaden', cls: 'F', fine: 15000, jail: 70, points: 0 },
      { code: 'PC 18740', title: 'Zünden eines Sprengsatzes mit Verletzungsabsicht', cls: 'F', fine: 20000, jail: 100, points: 0 },
    ]
  },
  {
    id: 'drugs', icon: '💊', name: 'Betäubungsmittel (Health & Safety Code)', items: [
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
    id: 'federal', icon: '🦅', name: 'Bundesrecht (U.S. Code)', items: [
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
      { code: '18 USC 1708',    title: 'Postdiebstahl',                                      cls: 'F', fine: 3000, jail: 15, points: 0 },
      { code: '18 USC 2113(a)', title: 'Bankraub',                                           cls: 'F', fine: 15000, jail: 70, points: 0 },
      { code: '18 USC 2119',    title: 'Fahrzeugraub (Bundesrecht)',                         cls: 'F', fine: 10000, jail: 50, points: 0 },
      { code: '21 USC 841(a)',  title: 'Drogenhandel (Bundesrecht)',                         cls: 'F', fine: 12000, jail: 60, points: 0 },
      { code: '18 USC 1956',    title: 'Geldwäsche',                                         cls: 'F', fine: 10000, jail: 45, points: 0 },
    ]
  },
];
```
