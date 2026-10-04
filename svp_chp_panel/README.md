# Sunset Valley+ – Behörden-MDT & Strafenkatalog

Standalone FiveM resource (no ESX/QBCore needed) for the CHP and the other agencies on **Sunset Valley+**.

## Features
- **Strafenkatalog**: about 95 offences with **real California code sections**
  (California Vehicle Code, Penal Code, Health & Safety Code), each with a class
  (Infraction / Misdemeanor / Felony), fine, jail units (HE) and license points.
  - Search by section or offence, filter by category and class
  - Calculator: click offences, the totals (fine / jail / points) are computed automatically, license suspension warning
  - "Kopieren" button: produces a complete penalty notice to paste into Discord or a file
  - "Akte speichern": saves the record on the server (`records.json`)
- **Akten**: search saved records by name or license plate
- **Einheiten**: live board of every officer on duty, with agency, callsign, status (CHP codes) and location
- **Funkcodes**: real CHP 10-codes, 11-codes, Code 1–7/33 and common terms
- **Funk-Log**: text radio to all units; status 11-99 triggers a panic alert for everyone

## Installation
1. Copy the `svp_chp_panel` folder into `resources/`
2. In `server.cfg`:
   ```cfg
   ensure svp_chp_panel

   # Permissions per agency (example)
   add_ace group.chp  svp.mdt.chp  allow
   add_ace group.lspd svp.mdt.lspd allow
   add_ace group.lssd svp.mdt.lssd allow
   add_ace group.doj  svp.mdt.doj  allow
   add_principal identifier.license:XXXXXXXX group.chp
   ```
3. In game: `/chp` or **F6** (players can rebind the key in the game settings)

For testing without permissions: set `Config.UseAce = false` in `config.lua`.

## Customising
| What | Where |
|---|---|
| Agencies, colors, permissions | `config.lua` → `Config.Agencies` |
| Unit statuses | `config.lua` → `Config.Statuses` |
| Max jail time | `config.lua` → `Config.MaxJail` |
| **Fines / jail / offences** | `html/data.js` → `SVP_CATALOG` |
| Radio codes | `html/data.js` → `SVP_CODES` |

> The sections and titles follow real California law. The fines and jail units are
> server values for roleplay and can be changed freely in `data.js`.

## Preview
Open `html/index.html` in a browser: the panel runs in demo mode without FiveM.
