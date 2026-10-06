<div align="center">

# ⚖️ Sunset Valley+ · Strafenkatalog

**Ein moderner Strafenkatalog im Tablet-Look für alle Behörden auf Sunset Valley+**

`FiveM` · `Standalone` · `Kein ESX / QBCore nötig` · `159 Tatbestände` · `5 Behörden`

</div>

---

## 📋 Inhalt

- [Features](#-features)
- [Vorschau](#-vorschau)
- [Installation](#-installation)
- [Rechte (ACE-Permissions)](#-rechte-ace-permissions)
- [Bedienung](#-bedienung)
- [Konfiguration](#%EF%B8%8F-konfiguration)
- [Tatbestände bearbeiten](#-tatbestände-bearbeiten)
- [Behörden hinzufügen](#-behörden-hinzufügen)
- [Ordnerstruktur](#-ordnerstruktur)
- [NUI-Schnittstelle](#-nui-schnittstelle-für-entwickler)
- [Fehlerbehebung](#-fehlerbehebung)

---

## ✨ Features

| | |
|---|---|
| 📚 **159 Tatbestände** | Echte Paragraphen aus California Vehicle Code (CVC), Penal Code (PC), Health & Safety Code (HS) und U.S. Code |
| 🗂️ **11 Kategorien** | Verkehr, Fahrzeug & Dokumente, Alkohol & Flucht, Personen, Sexualdelikte, Eigentum, Staat & Justiz, Öffentliche Ordnung, Waffen, Drogen, Bundesrecht |
| 🚓 **5 Behörden** | CHP, LSPD, LSSD, USMS, DOJ, jede mit eigener Farbe, eigenem Wappen und eigener Berechtigung |
| 🧮 **Strafrechner** | Geldstrafe, Haft (HE) und Punkte werden automatisch zusammengerechnet, mit Haft-Obergrenze |
| 🪪 **Führerschein-Warnung** | Hinweis, sobald ein Tatbestand mit Führerscheinentzug ausgewählt ist |
| 🔎 **Suche & Filter** | Nach Paragraph oder Tatbestand suchen, nach Klasse filtern (Infraction / Misdemeanor / Felony) |
| 📋 **Strafbescheid kopieren** | Erstellt einen fertigen Bescheid mit Nummer, Datum, Beamter, Person, Kennzeichen und Bemerkungen, ideal für Discord |
| 🎨 **Modernes Design** | Dunkles Tablet-Design, Farben passen sich der Behörde an, Animationen, für kleine Auflösungen angepasst |
| ⌨️ **Tastenkürzel** | `/` springt in die Suche, `ESC` schließt das Tablet |
| 🖥️ **Browser-Vorschau** | `html/index.html` lässt sich direkt im Browser öffnen (Demo-Modus) |

---

## 🖼️ Vorschau

> Tipp: Öffne `html/index.html` im Browser, um den Katalog ohne FiveM anzusehen.
> Für das README kannst du hier einen Screenshot einfügen:
>
> `![Vorschau](docs/preview.png)`

**Aufbau:**

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🛡 CHP  California Highway Patrol         [CHP|LSPD|LSSD|USMS|DOJ] ⏰ ✕ │
├────────────┬──────────────────────────────────────┬──────────────────┤
│ KATEGORIEN │ 🔎 Suchen…      [Alle|I|M|F]          │ STRAFBESCHEID    │
│ ⚖️ Alle    │ ── VERKEHRSVERSTÖSSE (CVC) ────────   │ Nr. SV-123456    │
│ 🚦 Verkehr │ ▌CVC 22350  Unangep. Geschw.  $250  + │ Person │ Kennz.  │
│ 🚗 Fahrzeug│ ▌CVC 23103  Rücksichtslos  $1.200 ×1 │ • CVC 23103  − 1 + │
│ 🍺 Alkohol │ ▌…                                    │ $6.200 │ 45 HE │ 5│
│ …          │                     159 von 159       │ [📋 Kopieren] [🗑] │
└────────────┴──────────────────────────────────────┴──────────────────┘
```

---

## 📦 Installation

1. Den Ordner **`svp_strafenkatalog`** in den `resources`-Ordner deines Servers kopieren.
2. In der **`server.cfg`** eintragen:
   ```cfg
   ensure svp_strafenkatalog
   ```
3. Rechte vergeben (siehe unten) und den Server neu starten.
4. Im Spiel mit **`/strafen`** oder **F6** öffnen.

> Der Ordnername darf geändert werden, die NUI erkennt den Resource-Namen automatisch.

---

## 🔐 Rechte (ACE-Permissions)

Jede Behörde hat eine eigene Berechtigung. Ein Spieler sieht nur die Behörden, für die er Rechte hat.
Hat er für keine Behörde Rechte, kann er den Katalog nicht öffnen.

```cfg
# Rechte pro Behörde
add_ace group.chp  svp.mdt.chp  allow
add_ace group.lspd svp.mdt.lspd allow
add_ace group.lssd svp.mdt.lssd allow
add_ace group.usms svp.mdt.usms allow
add_ace group.doj  svp.mdt.doj  allow

# Spieler einer Gruppe zuweisen (Beispiel)
add_principal identifier.license:DEINE_LICENSE group.chp

# Admins dürfen alles
add_ace group.admin svp.mdt.chp  allow
add_ace group.admin svp.mdt.lspd allow
add_ace group.admin svp.mdt.lssd allow
add_ace group.admin svp.mdt.usms allow
add_ace group.admin svp.mdt.doj  allow
```

> **Zum Testen:** In `config.lua` den Wert `Config.UseAce = false` setzen. Dann darf jeder den Katalog öffnen.

---

## 🎮 Bedienung

| Aktion | So geht's |
|---|---|
| Katalog öffnen / schließen | `/strafen`, **F6** oder **ESC** |
| Behörde wechseln | Oben rechts auf CHP / LSPD / LSSD / USMS / DOJ klicken |
| Kategorie wählen | Links in der Seitenleiste |
| Suchen | Ins Suchfeld tippen oder **`/`** drücken (z. B. `23152`, `Raub`) |
| Nach Schwere filtern | Alle · Infraction · Misdemeanor · Felony |
| Tatbestand hinzufügen | Zeile anklicken (mehrfach klicken = mehrfach zählen) |
| Anzahl ändern | Im Strafbescheid mit **−** / **+** |
| Bescheid kopieren | **📋 Strafbescheid kopieren** → in Discord oder eine Akte einfügen |
| Alles zurücksetzen | **🗑** (erzeugt auch eine neue Bescheid-Nummer) |

Die Taste F6 kann jeder Spieler selbst ändern: *Einstellungen → Tastenbelegung → FiveM*.

**Beispiel für einen kopierten Strafbescheid:**

```
STRAFBESCHEID Nr. SV-815197
CHP – California Highway Patrol · Sunset Valley+
────────────────────────────
Datum:    06.10.2026, 16:16 Uhr
Beamter:  Ofc. J. Miller #1427
Person:   John Doe
Kennz.:   8SVP123
────────────────────────────
Tatbestände:
 • 1× CVC 2800.2 [Felony] Flucht mit rücksichtsloser Fahrweise – $5,000 / 35 HE / 3 P
 • 1× CVC 23103 [Misdemeanor] Rücksichtsloses Fahren – $1,200 / 10 HE / 2 P
────────────────────────────
Geldstrafe: $6,200
Haft:       45 HE
Punkte:     5
Führerscheinentzug empfohlen
```

---

## ⚙️ Konfiguration

Alles Wichtige steht in **`config.lua`**:

| Einstellung | Standard | Beschreibung |
|---|---|---|
| `Config.ServerName` | `'Sunset Valley+'` | Name im Kopf und im Strafbescheid |
| `Config.Agencies` | 5 Behörden | Behörden mit Kürzel, Name, Farbe und ACE-Recht |
| `Config.MaxJail` | `120` | Obergrenze für Haft in HE (darüber erscheint ⚠) |
| `Config.Command` | `'strafen'` | Chat-Befehl zum Öffnen |
| `Config.DefaultKey` | `'F6'` | Standard-Taste (Spieler können sie ändern) |
| `Config.UseAce` | `true` | `false` = jeder darf öffnen |

---

## 📝 Tatbestände bearbeiten

Alle Tatbestände stehen in **`html/data.js`**. Jeder Eintrag ist eine Zeile:

```js
// [Paragraph,     Titel,                          Klasse, Geld, Haft, Punkte, Führerschein]
['CVC 23152(a)', 'Fahren unter Alkoholeinfluss', 'M',    3000, 15,   2,      1],
```

| Feld | Bedeutung |
|---|---|
| **Paragraph** | z. B. `CVC 23152(a)`, `PC 211`, `18 U.S.C. 1073` |
| **Titel** | Kurzbeschreibung auf Deutsch |
| **Klasse** | `'I'` = Infraction (Ordnungswidrigkeit), `'M'` = Misdemeanor (Vergehen), `'F'` = Felony (Verbrechen) |
| **Geld** | Geldstrafe in $ (`0` = keine) |
| **Haft** | Hafteinheiten (HE) für euer Gefängnis-Script (`0` = keine) |
| **Punkte** | Führerscheinpunkte (`0` = keine) |
| **Führerschein** | `1` = Führerscheinentzug empfohlen, `0` = nein |

**Neue Kategorie anlegen:**

```js
{ id: 'boote', icon: '🚤', name: 'Wasserfahrzeuge', items: [
  ['HNC 655(b)', 'Boot fahren unter Alkoholeinfluss', 'M', 2000, 10, 0, 0],
]},
```

> Die Paragraphen und Titel orientieren sich am echten kalifornischen Recht bzw. am U.S. Code.
> **Geld-, Haft- und Punktewerte sind Server-Werte fürs Roleplay** und können frei angepasst werden.

---

## 🏛️ Behörden hinzufügen

Eine neue Behörde muss an **zwei Stellen** eingetragen werden:

1. **`config.lua`**, damit Rechte und Name stimmen:
   ```lua
   { id = 'fib', short = 'FIB', name = 'Federal Investigation Bureau', ace = 'svp.mdt.fib', color = '#1f2937' },
   ```
2. **`html/script.js`** in der Liste `AGENCIES` (Standardwerte für die Browser-Vorschau):
   ```js
   { id: 'fib', short: 'FIB', name: 'Federal Investigation Bureau', color: '#1f2937' },
   ```

Danach `add_ace group.fib svp.mdt.fib allow` in der `server.cfg` ergänzen.

---

## 📁 Ordnerstruktur

```
svp_strafenkatalog/
├── fxmanifest.lua      # Resource-Definition
├── config.lua          # Einstellungen & Behörden
├── client.lua          # Befehl, Taste, Öffnen/Schließen der NUI
├── server.lua          # Rechte-Prüfung (ACE)
├── README.md
└── html/
    ├── index.html      # Aufbau des Tablets
    ├── style.css       # Design
    ├── script.js       # Logik (Suche, Filter, Rechner, Kopieren)
    └── data.js         # Alle Tatbestände
```

---

## 🧩 NUI-Schnittstelle (für Entwickler)

**Öffnen** (Client → NUI):

```lua
SendNUIMessage({
    action     = 'open',
    officer    = 'Ofc. J. Miller #1427',   -- erscheint im Bescheid
    serverName = 'Sunset Valley+',
    maxJail    = 120,
    agencies   = { { id = 'chp', short = 'CHP', name = 'California Highway Patrol', color = '#c9a227' } }
    -- agencies darf auch nur IDs enthalten: { 'chp', 'lspd' }
})
```

**Schließen** (Client → NUI): `SendNUIMessage({ action = 'close' })`

**Callback** (NUI → Client): `close`, wird bei ESC oder ✕ aufgerufen.

> **Tipp:** Statt des Spielernamens kann `officer` auch den Charakternamen und die Dienstnummer
> aus eurem Framework enthalten (z. B. `xPlayer.getName()` oder `PlayerData.charinfo`).

---

## 🛠️ Fehlerbehebung

| Problem | Lösung |
|---|---|
| „Kein Zugriff“ beim Öffnen | ACE-Rechte prüfen oder testweise `Config.UseAce = false` |
| Tablet öffnet nicht | F8-Konsole auf Fehler prüfen, `ensure svp_strafenkatalog` in der `server.cfg`? |
| Maus hängt nach dem Schließen | `ESC` drücken, sonst Resource neu starten (`restart svp_strafenkatalog`) |
| Schrift sieht anders aus | Google Fonts wird geladen, ohne Internet greift automatisch eine Standardschrift |
| Taste F6 geht nicht | Taste ist evtl. belegt, unter *Einstellungen → Tastenbelegung → FiveM* ändern |

---

<div align="center">

**Sunset Valley+** · Made for Roleplay 🌅

</div>
