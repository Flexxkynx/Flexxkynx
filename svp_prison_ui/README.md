# Prison UI – drei überarbeitete Varianten

Überarbeitete Versionen der Prison-NUI (Haft-Timer + Gefängnisverwaltung).
Jede Variante ist ein **Drop-in-Ersatz**: `index.html`, `style.css` und `script.js` aus dem Ordner
in den `html/`-Ordner der Prison-Resource kopieren. Die Lua-Seite muss nicht angepasst werden.
Die NUI-Messages (`showPrisonHUD`, `updatePrisonTime`, `openManagementUI`, `closeManagementUI`) und die
Callbacks (`closeUI`, `releasePrisoner`) sind dieselben wie vorher.

| Ordner | Stil |
| --- | --- |
| `original/` | Deine Vorlage, unverändert (zum Vergleichen) |
| `v1_kompakt/` | Dunkel, Tabellenzeilen statt Karten, Fortschrittsbalken pro Häftling. IBM Plex Sans/Mono |
| `v2_akte/` | Helles Papier-Panel mit Reitern wie bei einer Akte, Stempel statt Badges. Archivo + Plex Mono |
| `v3_zweispaltig/` | Liste links, Details rechts, gelber Akzent wie im GTA-HUD, Navigation mit ↑/↓. Barlow |

## Vorschau ohne FiveM

```bash
cd svp_prison_ui
python3 -m http.server 8000
```

Dann `http://localhost:8000/preview.html` öffnen. Unten links kannst du zwischen den Varianten wechseln
und HUD oben/unten, die letzte Minute und die Verwaltung mit Testdaten anzeigen.
Screenshots liegen in `screenshots/`.

## Was sich gegenüber dem Original geändert hat

- Ein Suchfeld für beide Reiter statt zwei. Die Zahl der Einträge steht direkt am Reiter.
- „Entlassen“ braucht zwei Klicks: Der erste fragt „Wirklich?“, nach 3 Sekunden springt der Button zurück.
- Wenn ein Häftling nur noch 5 Minuten oder weniger hat, wird seine Restzeit rot.
- Bei relativen Zeiten („vor 36 Min.“) zeigt der Tooltip das genaue Datum.
- Texte sind standardmäßig deutsch. Was du über `locale` mitschickst, hat weiterhin Vorrang.
  Neue optionale Keys sind unter anderem `search_placeholder`, `no_results`, `release_confirm` und `served`.
- Behoben: Die Such-Listener wurden bei jedem Öffnen erneut registriert.
  Außerdem lief `escapeHtml` bei leeren Feldern auf einen Fehler.
