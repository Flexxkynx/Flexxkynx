# 🌅 UI-Prompt – Sunset Valley+ HUD

Diesen Prompt komplett in ein KI-Tool (z. B. Claude, v0, Lovable) kopieren oder einem Designer geben.
Er beschreibt ein Premium-HUD im Stil moderner FiveM-HUDs wie **RLO HUD** oder **Codem BlackHUD V2**:
dunkel, clean, mit Glow-Akzenten und flüssigen Animationen, aber mit eigenem Sunset-Valley+-Look.

---

## PROMPT

Erstelle ein **Premium-HUD für den FiveM-Roleplay-Server „Sunset Valley+“** als NUI
(HTML + CSS + JavaScript, gerne mit Vue 3 oder Vanilla JS, ohne Build-Schritt lauffähig).
Sprache der Oberfläche: Deutsch. Das HUD liegt über dem Spiel, der Seitenhintergrund ist
transparent, es darf **keine Mausinteraktion** blockieren (außer im Einstellungsmenü).

### 🎨 Design-Stil

- **Look:** dunkel, edel, minimalistisch, „Glassmorphism light“. Halbtransparente dunkle
  Flächen (`rgba(10, 12, 20, 0.55)`), feine 1-px-Ränder (`rgba(255,255,255,0.08)`),
  weiche Schatten, abgerundete Ecken (10–14 px).
- **Markenfarbe „Sunset“:** Verlauf `#ff7a18` (Orange) → `#ff3d77` (Pink) → `#7b2ff7` (Lila).
  Wird für Akzente, Glows, aktive Elemente und das Logo genutzt, **nicht** flächig.
- **Status-Farben:** Leben `#ff4d6d`, Rüstung `#4dabf7`, Hunger `#ffa94d`, Durst `#3bc9db`,
  Ausdauer `#ffd43b`, Stress `#b197fc`, Sauerstoff `#74c0fc`, Sprache `#69db7c`.
- **Schriften:** „Poppins“ oder „Inter“ für Text, „Rajdhani“ oder „Orbitron“ für Zahlen
  (Tacho, Geld, Uhrzeit), über Google Fonts mit System-Fallback.
- **Glow:** Aktive Ringe und Zahlen bekommen einen dezenten `drop-shadow` in ihrer Farbe.
- **Animationen:** Werte ändern sich weich (Transition 300–400 ms), Elemente blenden ein und
  aus (Fade + leichtes Slide). Niedrige Werte (unter 20 %) **pulsieren** rot. Keine ruckeligen Sprünge.

### 🧩 Bausteine

**1. Status-Leiste (unten links, neben der Minimap)**
- Runde **Kreis-Anzeigen** (Ringe, SVG `stroke-dasharray`) mit Icon in der Mitte für:
  Leben, Rüstung, Hunger, Durst, Ausdauer, Stress, Sauerstoff (nur unter Wasser sichtbar).
- Größe ca. 44 px, leichter Abstand, darunter optional der Prozentwert.
- **Auto-Hide:** Rüstung nur bei Rüstung > 0, Sauerstoff nur unter Wasser,
  Ausdauer nur beim Sprinten. Volle Werte dürfen ausgeblendet werden (Einstellung).
- **Sprach-Indikator:** Mikrofon-Icon mit 3 Balken für die Reichweite
  (Flüstern / Normal / Schreien). Beim Sprechen leuchtet es grün und pulsiert. Funk-Kanal
  daneben, z. B. „📻 1.0“, falls aktiv.

**2. Minimap-Rahmen (unten links)**
- Die GTA-Minimap bekommt einen **eigenen Rahmen**: rund oder eckig (umschaltbar),
  feiner Sunset-Verlauf als Rand, leichter Schatten.
- Darüber eine kleine **Straßen- und Kompassleiste:** Himmelsrichtung (N / NO / O …) groß,
  daneben Straßenname, Kreuzung und Zone, z. B. „NO | Route 68 · Harmony“.

**3. Info-Panel (oben rechts)**
- **Server-Logo „Sunset Valley+“** (Text-Logo mit Sunset-Verlauf und kleiner Sonne ☀).
- Darunter kompakte Zeilen mit Icon:
  - 🆔 Spieler-ID
  - 💵 Bargeld (grün)
  - 🏦 Bank (blau)
  - 💼 Job + Rang (z. B. „CHP · Officer II“)
  - ⏰ Ingame-Uhrzeit, 👥 Spieler online (optional)
- Geldänderungen werden **animiert hochgezählt**, mit kurzem „+$500“ (grün)
  oder „−$200“ (rot), das neben dem Betrag aufpoppt und verschwindet.

**4. Tacho (unten rechts, nur im Fahrzeug)**
- Großer **Bogen-Tacho** (ca. 270°-Bogen, SVG) mit Sunset-Verlauf als Füllung.
- In der Mitte **Geschwindigkeit groß** (z. B. „128“), darunter Einheit „KM/H“ oder „MPH“ (umschaltbar).
- Kleiner **Drehzahl-Bogen** innen oder als Leiste, wird ab 85 % rot.
- **Gang-Anzeige** („N“, „R“, „1“ … „6“) in einem kleinen Kreis.
- **Tankanzeige** (Balken mit ⛽) und **Motorschaden** (Balken mit 🔧), beide färben sich bei
  niedrigen Werten orange bzw. rot.
- **Status-Icons** in einer Reihe, aktiv = leuchtend, inaktiv = grau:
  🔒 abgeschlossen · 💡 Licht (Abblend/Fernlicht) · 🔗 **Gurt** (blinkt rot, wenn nicht angeschnallt
  und Fahrt > 20 km/h) · 🛞 Tempomat · 🚨 Sirene (bei Einsatzfahrzeugen).
- Optional: **Kilometerstand**.
- **Flugzeug und Heli:** Statt km/h zeigt der Tacho Höhe (ft) und Geschwindigkeit (kts).

**5. Waffen-Anzeige (rechts, über dem Tacho, nur mit Waffe)**
- Waffenname, kleines Waffen-Icon, Munition groß „24 / 120“ (Magazin / Gesamt).
- Wird ausgeblendet, sobald man unbewaffnet ist.

**6. Benachrichtigungen (rechts mittig)**
- Toasts mit Icon, Titel, Text und farbigem Rand links: Info (blau), Erfolg (grün),
  Warnung (orange), Fehler (rot). Sie sliden von rechts herein, bleiben 5 s mit
  Fortschrittsbalken und stapeln sich bis maximal 5.

**7. Hilfe-/Interaktions-Hinweis**
- Unten mittig, z. B. eine Taste in einem Kasten **[E]** plus „Fahrzeug abschließen“.
  Erscheint weich und verschwindet weich.

**8. Einstellungsmenü (Befehl `/hud`)**
- Zentrales Glas-Panel mit Tabs: **Allgemein · Status · Fahrzeug · Farben · Position**.
- Schalter (Toggles) für jedes Element (ein/aus), Stil der Status-Anzeige
  (Ringe / Balken / Waben), Minimap rund oder eckig, km/h oder mph, Tacho-Stil
  (Bogen / digital), Auto-Hide voller Werte.
- **Farb-Presets:** „Sunset“ (Standard), „Ocean“ (Blau/Türkis), „Neon“ (Pink/Cyan),
  „Monochrom“ (Weiß/Grau), dazu ein eigener Farbwähler für die Akzentfarbe.
- **HUD-Größe** (Regler 80–120 %) und **Kinomodus** (blendet alles aus, schwarze Balken oben und unten).
- „Zurücksetzen“-Button. Einstellungen werden im `localStorage` gespeichert.
- Schließen mit ESC oder ✕, nur hier ist die Maus aktiv.

### 🖥️ Layout & Responsive

- Abstände zum Bildschirmrand ca. 20–24 px, alle Größen in `vh`/`vw` oder mit `clamp()`,
  damit es auf 1080p, 1440p und 4K und auch in 21:9 gut aussieht.
- Nichts darf wichtige GTA-Elemente verdecken (Minimap-Position beachten).

### ⚡ Performance (wichtig für FiveM)

- Nur `transform` und `opacity` animieren, **kein** `backdrop-filter: blur` auf großen Flächen
  (kostet FPS), keine Dauer-Animationen ohne Grund.
- DOM nur ändern, wenn sich ein Wert wirklich geändert hat.
- Der Lua-Client schickt Updates gebündelt: Status ca. alle 500 ms, Tacho ca. alle 100 ms
  (nur im Fahrzeug), Geld/Job nur bei Änderung.

### 🔌 Daten-Schnittstelle (NUI-Nachrichten)

Das HUD hört auf `window.addEventListener('message', …)` mit diesen Nachrichten:

```js
{ action: 'status',  health: 0-100, armor: 0-100, hunger: 0-100, thirst: 0-100,
                     stamina: 0-100, stress: 0-100, oxygen: 0-100, underwater: bool }
{ action: 'voice',   talking: bool, range: 1|2|3, radio: '1.0' | null }
{ action: 'player',  id: 12, cash: 2500, bank: 48200, job: 'CHP', grade: 'Officer II' }
{ action: 'vehicle', show: bool, speed: 128, rpm: 0-1, gear: 'N'|'R'|1..8, fuel: 0-100,
                     engine: 0-100, seatbelt: bool, lights: 0|1|2, locked: bool,
                     cruise: bool, siren: bool, type: 'car'|'bike'|'air'|'boat', altitude: 0 }
{ action: 'street',  heading: 'NO', street: 'Route 68', cross: 'Joshua Rd', zone: 'Harmony' }
{ action: 'weapon',  show: bool, name: 'Pistol', clip: 12, ammo: 48 }
{ action: 'notify',  type: 'info'|'success'|'warning'|'error', title: 'Titel', text: 'Text', time: 5000 }
{ action: 'help',    show: bool, key: 'E', text: 'Fahrzeug abschließen' }
{ action: 'toggle',  show: bool }          // HUD komplett ein/aus (z. B. Pausenmenü, Kamera)
{ action: 'settings', open: bool }        // Einstellungsmenü
```

NUI → Lua (per `fetch('https://<resource>/…')`): `closeSettings`, `saveSettings` (mit den Einstellungen als JSON).

### 🧪 Demo-Modus

Wenn die Seite im normalen Browser geöffnet wird (kein `GetParentResourceName`), zeigt das HUD
**Beispieldaten** über einem dunklen GTA-artigen Hintergrundbild bzw. Verlauf. Werte ändern sich
automatisch (Tacho beschleunigt und bremst, Hunger sinkt, alle paar Sekunden eine
Benachrichtigung), damit man alle Animationen sehen kann. Mit der Taste **H** öffnet sich das
Einstellungsmenü.

### 📦 Ausgabe

Liefere: `index.html`, `style.css`, `script.js` (und Icons als Inline-SVG, keine externen
Bilder außer Google Fonts). Code sauber kommentiert, Farben und Größen als CSS-Variablen
in `:root`, damit man das Design leicht anpassen kann.

---

## Optional: Lua-Teil (zweiter Prompt)

Wenn auch der Lua-Code erstellt werden soll, diesen Zusatz verwenden:

> Schreibe zusätzlich die FiveM-Resource `svp_hud` (`fxmanifest.lua`, `config.lua`, `client.lua`)
> für das obige HUD. Unterstütze **ESX, QBCore/Qbox und Standalone** (automatisch erkennen),
> Hunger/Durst/Stress aus dem jeweiligen Framework, Sprache über **pma-voice** oder **SaltyChat**,
> Tank über **LegacyFuel / ox_fuel / cdn-fuel** (konfigurierbar). Blende die Standard-GTA-HUD-Elemente
> aus (Geld, Waffenrad-Stats, Straßennamen), forme die Minimap passend zum Rahmen,
> blende das HUD im Pausenmenü aus, schicke Updates gebündelt und nur bei Änderung,
> und sorge dafür, dass der Client im Leerlauf unter **0,02 ms** bleibt.
> Gurt-System mit Taste **B** (Gurt an/aus, Herausfliegen bei Unfall ohne Gurt),
> Tempomat mit Taste **Y**, Befehl `/hud` für die Einstellungen.

---

> **Hinweis:** RLO HUD und Codem BlackHUD V2 sind kostenpflichtige Scripts anderer Entwickler.
> Dieser Prompt beschreibt nur einen **ähnlichen Stil**. Das Ergebnis ist ein eigenes Design für
> Sunset Valley+ und keine Kopie dieser Scripts.
