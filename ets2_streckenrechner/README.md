# ETS2 Streckenrechner

Rechnet aus, wie viele Kilometer eine Strecke im Euro Truck Simulator 2 lang ist.
Start und Ziel eingeben, optional Zwischenstopps, fertig. Dazu gibt es Fahrzeit im
Spiel, echte Zeit am PC und Dieselverbrauch.

Öffne `index.html` einfach im Browser. Die Seite braucht keinen Server und keine
Internetverbindung außer für die Schriftarten.

## Funktionen

- Suche nach Städten mit Spielnamen, deutschen und englischen Namen (München, Munich, Muenchen)
- Kürzeste Route über das Straßennetz, auch mit Zwischenstopps
- Fähren und Eurotunnel, getrennt ausgewiesen, optional ausschließbar
- DLC-Auswahl: Routen nur über Karten, die du besitzt
- Karte mit den echten Straßen des Spiels zum Ziehen und Zoomen; die Route folgt den Spielstraßen
- Klick auf eine Stadt setzt Start, Ziel oder Zwischenstopp
- Kalibrierung: Kilometer aus dem Spiel eintragen, alle Strecken werden angepasst
- Teilbarer Link, die Route steht in der Adresse (`#r-12-34`)
- Firmen und Lkw-Händler jeder Stadt aus den Spieldaten, per Klick auf die Karte
- „Nächste Firma finden“: die nächsten Standorte einer Firma ab deinem Start
- „Zufällige Tour“ für eine spontane Fahrt
- Karte im dunklen Spiel-Look, Autobahnen hervorgehoben, große Städte zuerst beschriftet

## Wie gerechnet wird

1. **Städte.** Alle 388 Städte des Grundspiels und der Karten-DLCs bis zum Island-DLC
   (November 2026), mit Position, Firmen und Händlern aus den Spieldaten.
2. **Echte Straßen.** Das Straßennetz kommt aus den Kartendaten des Spiels (TruckSim Maps,
   `ets2.pmtiles`): rund 230.000 Straßenstücke und alle 69 Fähr- und Zuglinien. Daraus
   entsteht ein Graph mit knapp zwei Millionen Knoten. Kreuzungen stehen in den Daten nicht
   als Fahrspuren, deshalb werden Straßenenden mit Straßen in bis zu 35 m Abstand verbunden.
3. **Städtenetz.** Von jeder Stadt läuft eine Wegsuche über dieses Netz. Zwei Städte sind
   Nachbarn, wenn der kürzeste Weg durch keine dritte Stadt führt. Jede Verbindung speichert
   die echte Straßenlänge, Fähranteile, benötigte DLCs und ihren Verlauf für die Karte.
4. **Kilometer.** Straßenlänge im Spiel mal Anzeigemaßstab. Der Maßstab ist an echten
   Spielaufträgen gemessen: rund 17,9 auf dem Festland, rund 13,4 in Großbritannien
   (das Spiel baut Großbritannien größer). Firmen liegen nicht genau in der Stadtmitte,
   deshalb zeigt das Spiel meist bis zu 10 % mehr oder weniger.

Die Details zu den Daten stehen in [data/REPORT.md](data/REPORT.md).

## Neu bauen

```bash
cd ets2_streckenrechner
python3 tools/make_game_cities.py path/to/ets2-search.geojson data/sources/game_cities.json
python3 tools/build_data.py data/sources data
python3 tools/roads_decode.py path/to/ets2.pmtiles /tmp/z9.pkl 9
python3 tools/roads_graph.py /tmp/z9.pkl /tmp/graph9.pkl
python3 tools/roads_network.py /tmp/graph9.pkl data/sources data
python3 tools/roads_display.py /tmp/z9.pkl data/roads_display.json
python3 tools/build_land.py path/to/world-atlas/countries-50m.json data/land.json data/network.json
python3 tools/build_page.py .
python3 tools/route.py Calais Duisburg
```

- `ets2-search.geojson` kommt aus dem Repository `truckermudgeon/truckermudgeon.github.io`,
  `ets2.pmtiles` von `maps.truckermudgeon.com` (rund 100 MB, nicht im Repository).
- `data/sources/regions/` enthält die ursprünglich recherchierten Regionsdaten, `patches.json`
  Korrekturen; daraus kommen Aliasnamen und Straßennummern.
- `build_data.py` baut die Städteliste, `roads_*.py` das Straßennetz, `build_page.py`
  setzt `src/head.html`, `src/body.html` und die Daten zu `index.html` zusammen.
- `route.py` rechnet Routen auf der Kommandozeile, genau wie die Seite.
- `tools/ets2proj.py` ist die Projektion, mit Selbsttest: `python3 tools/ets2proj.py`.

## Quellen

- Kartenprojektion: [truckermudgeon/maps](https://github.com/truckermudgeon/maps)
- Straßen, Fähren, Spielpositionen, Firmen, Händler: [TruckSim Maps](https://github.com/truckermudgeon/maps) von truckermudgeon (`ets2.pmtiles`, `ets2-search.geojson`)
- Spielkoordinaten der ersten Version: [ETS2 Local Radio](https://github.com/Koenvh1/ETS2-Local-Radio)
- Landkarte: Natural Earth über [world-atlas](https://github.com/topojson/world-atlas)
- Städte, Straßen, Fähren: Truck Simulator Wiki, SCS Software Blog, Steam

Fan-Projekt, nicht verbunden mit SCS Software.
