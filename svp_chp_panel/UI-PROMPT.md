# UI prompt – Sunset Valley+ Strafenkatalog

Copy this prompt into an AI tool (e.g. Claude, v0, Lovable) or hand it to a designer:

---

Create a NUI interface for a FiveM roleplay server called **"Sunset Valley+"**:
a **penalty catalog (Strafenkatalog)** for the server's agencies (California Highway Patrol,
LSPD, LSSD, U.S. Marshals Service, DOJ). Technology: plain HTML, CSS and JavaScript (no framework), language German.

**Look & layout**
- Looks like a police tablet: centred window (approx. 5 % top/bottom, 6 % left/right margin),
  rounded corners (18 px), dark frame with drop shadow, transparent page background
  (it is laid over the game).
- Dark theme: background `#0f1621`, panels `#162131` / `#1c2a3d`, lines `#2a3b52`,
  text `#e6edf5`, muted text `#8ea1b8`.
- An accent color per agency, used for the header line, headings and the main button:
  CHP gold `#c9a227`, LSPD blue `#2f6fdb`, LSSD green `#3c8d4a`, USMS silver `#a8b2c1`, DOJ purple `#8e44ad`.
- Font: Segoe UI / Roboto; section numbers in a monospace font (Consolas) in light blue `#9fc3ff`.

**Header**
- Dark blue gradient (`#0b2447` → `#19376d`) with a 3 px accent line underneath.
- Left: round badge with the agency short name (e.g. "CHP") on the accent color,
  next to it the full agency name in bold and below it "Sunset Valley+ · Strafenkatalog".
- Right: a dropdown to switch agency and a close button "✕" (ESC also closes).

**Main area (two columns)**

Left column – catalog:
- Toolbar: search field ("Paragraph oder Tatbestand suchen… (z.B. 23152, Raub)"),
  a dropdown for category, a dropdown for class (Infraction / Misdemeanor / Felony).
- Scrollable list, grouped by categories with a sticky heading in the accent color:
  Verkehrsverstöße (CVC), Fahrzeug & Dokumente (CVC), Alkohol, Unfall & Flucht (CVC),
  Straftaten (Penal Code), Waffen (Penal Code), Betäubungsmittel (Health & Safety Code),
  Bundesrecht (U.S. Code) for the USMS.
- Each row is a grid of: section (e.g. "CVC 23152(a)") | offence (🪪 icon if license
  suspension applies) | class badge (I = blue `#24466b`, M = brown/gold `#7a5b12`,
  F = red `#7a1f1f`) | fine in green ($) | jail in "HE" | points ("2 P"); "–" when empty.
- Hover highlights the row; offences already selected get a light accent tint.
  Clicking adds the offence to the penalty notice.

Right column (330 px wide) – "Strafbescheid" (penalty notice):
- Fields: name of the person, license plate (optional).
- List of selected offences (dashed border), each with section, short title and
  − / count / + buttons. Empty state: "Tatbestände links anklicken."
- Totals box: Geldstrafe (green, large), Haft in HE (capped at a maximum, "(max)" shown
  when the cap applies), Punkte, and a red warning "⚠ Führerscheinentzug empfohlen" if needed.
- Text field "Bemerkungen / Sachverhalt".
- Buttons: "📋 Kopieren" (accent color, full width) copies a formatted penalty notice
  to the clipboard, and a red trash-can button resets everything.
- Small toast notification at the bottom centre (e.g. "In Zwischenablage kopiert").

**Behaviour**
- Opened via `window.postMessage({ action: 'open', officer, agencies, serverName, maxJail })`,
  closed via `{ action: 'close' }` or ESC/✕ → `fetch('https://<resource>/close')`.
- The data comes from a `data.js` file with `window.SVP_CATALOG`
  (categories with `code, title, cls, fine, jail, points, license`).
- In a normal browser (without FiveM) the UI opens automatically in demo mode.

---
