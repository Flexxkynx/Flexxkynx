# UI prompt – Sunset Valley+ Strafenkatalog

Copy this prompt into an AI tool (e.g. Claude, v0, Lovable) or hand it to a designer:

---

Create a modern NUI interface for the FiveM roleplay server **"Sunset Valley+"**: a
**penalty catalog (Strafenkatalog)** for the agencies CHP, LSPD, LSSD, USMS and DOJ.
Technology: plain HTML, CSS and JavaScript (no framework), UI language German.

**Overall look**
- A police tablet floating over the game: centred window (approx. 4.5 % top/bottom, 5 % left/right margin),
  22 px rounded corners, dark bezel (several box-shadow rings) and a large drop shadow; the page background stays transparent.
- Dark navy theme: background `#0b1220` with a soft radial glow in the agency color at the top left,
  panels `#131e33` / `#1a2740`, lines `#24344f`, text `#e8eef7`, muted text `#8396b2`.
- Fonts: **Inter** (UI) and **JetBrains Mono** (section numbers, numbers, ticket number).
- Accent color per agency (header line, active elements, main button, emblem):
  CHP gold `#c9a227`, LSPD blue `#2f6fdb`, LSSD green `#3c8d4a`, USMS silver `#a8b2c1`, DOJ purple `#8e44ad`.
- Class colors: Infraction blue `#3b82f6`, Misdemeanor amber `#f59e0b`, Felony red `#ef4444`.
- Subtle animations: tablet pops in (scale + fade), items slide into the notice, a clicked row flashes briefly.

**Header**
- Dark blue gradient (`#0a1a36` → `#10264d` → `#0a1a36`), at the bottom a 2 px line in the
  accent color that fades out at both ends.
- Left: SVG shield emblem in the accent color with the agency short name in it,
  next to it the agency name (bold, 18 px) and below it "Sunset Valley+ • Strafenkatalog".
- Right: segmented control to switch agency (CHP | LSPD | LSSD | USMS | DOJ, active one filled with the accent color),
  a clock (HH:MM), and a round close button "✕" (turns red on hover, ESC also closes).

**Three-column layout**

1. **Category sidebar (236 px)**: title "KATEGORIEN"; buttons with an emoji icon in a small tile,
   name and a count badge. Active category: lighter background + 3 px accent line on the left.
   Categories: Alle Tatbestände, Verkehrsverstöße (CVC), Fahrzeug & Dokumente (CVC), Alkohol, Unfall & Flucht (CVC),
   Straftaten gegen Personen (PC), Sexualdelikte (PC), Eigentums- & Vermögensdelikte (PC),
   Delikte gegen Staat & Justiz (PC), Öffentliche Ordnung (PC), Waffen & Sprengstoff (PC),
   Betäubungsmittel (Health & Safety Code), Bundesrecht (U.S. Code).

2. **Catalog list (flexible)**:
   - Toolbar: search field with a magnifier icon and a `/` keyboard hint (pressing "/" focuses the search),
     next to it a segmented control "Alle | Infraction | Misdemeanor | Felony".
   - Column headings: PARAGRAPH, TATBESTAND, GELDSTRAFE, HAFT, PUNKTE.
   - Sticky category headings in the accent color (uppercase, with a thin line to the right).
   - Each offence is a card (rounded corners, 4 px gap) with a colored stripe on the left in the class color:
     section as a monospace pill (light blue) | title (bold) with a small line underneath showing the class
     in the class color and, if applicable, "🪪 Führerscheinentzug" | fine in green | jail "xx HE" | points |
     round "+" button (shows "×2" etc. once added; turns accent-colored on hover).
   - Selected rows get an accent border and a light tint. Footer: "31 von 231 Tatbeständen".

3. **Penalty notice (360 px)**, slightly lighter background:
   - Header card with an accent gradient: "STRAFBESCHEID" (uppercase, letter-spaced),
     ticket number "Nr. SV-123456" (monospace) and date/time on the right.
   - Two labeled fields side by side: PERSON (name), KENNZEICHEN (plate, uppercase, monospace).
   - List of offences: section, short title, subtotal in green, quantity stepper "− 1 +".
     Empty state: large ⚖️ icon with "Tatbestände links anklicken, um sie hinzuzufügen."
   - Three stat tiles: GELDSTRAFE (large, green), HAFT (HE, capped at a maximum with ⚠),
     PUNKTE.
   - Red notice box "🪪 Führerscheinentzug empfohlen" if needed.
   - Notes field, button "📋 Strafbescheid kopieren" (accent color, glow) and a red trash-can button.
   - Toast at the bottom centre, e.g. "✓ Strafbescheid kopiert".

**Responsive**: below 1500 px narrower columns; below 1300 px the category sidebar shows icons only.

**Behaviour**
- Opened via `window.postMessage({ action: 'open', officer, agencies, serverName, maxJail })`,
  closed via `{ action: 'close' }` or ESC/✕ → `fetch('https://<resource>/close')`.
- Data from `data.js` → `window.SVP_CATALOG` (categories with `id, icon, name, items[]`,
  items with `code, title, cls, fine, jail, points, license`).
- The copy button produces a formatted text notice (number, agency, date, officer, person,
  offences, totals, notes).
- In a normal browser (without FiveM) the UI opens automatically in demo mode.

---
