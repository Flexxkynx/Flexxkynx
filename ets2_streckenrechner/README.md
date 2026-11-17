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
- Karte zum Ziehen und Zoomen, Klick auf eine Stadt setzt Start, Ziel oder Zwischenstopp
- Kalibrierung: Kilometer aus dem Spiel eintragen, alle Strecken werden angepasst
- Teilbarer Link, die Route steht in der Adresse (`#r-12-34`)
- Firmen und Lkw-Händler jeder Stadt aus den Spieldaten, per Klick auf die Karte
- „Nächste Firma finden“: die nächsten Standorte einer Firma ab deinem Start
- „Zufällige Tour“ für eine spontane Fahrt
- Karte im dunklen Spiel-Look, große Städte zuerst beschriftet

## Wie gerechnet wird

1. **Städte.** Alle 388 Städte des Grundspiels und der Karten-DLCs bis zum Island-DLC
   (November 2026), mit Position, Firmen und Händlern aus den Spieldaten. Die Umrechnung
   zwischen Spiel- und Erdkoordinaten nutzt die Kartenprojektion des Spiels
   (Lambert-Kegelprojektion aus `def/climate.sii`, Großbritannien im Maßstab 1:15 statt 1:19).
2. **Straßennetz.** Verbindungen zwischen benachbarten Städten, recherchiert pro Region
   und im Netz gegengeprüft (Truck Simulator Wiki, SCS-Blog, Steam).
3. **Kilometer.** Etappe = Luftlinie im Spiel × Kurvenfaktor der echten Straße ×
   Anzeigemaßstab. Den Maßstab ermittelt das Build-Skript aus Kilometerangaben echter
   Spielaufträge (World of Trucks, VTC-Logs). Ergebnis: rund 19 auf dem Festland und
   rund 15 in Großbritannien, passend zu den bekannten Spielmaßstäben.
4. **Genauigkeit.** Richtwert, typisch 10 bis 15 % Abweichung, weil Firmenstandorte in
   der Stadt und Umwege fehlen.

Die Details zu den Daten stehen in [data/REPORT.md](data/REPORT.md).

## Neu bauen

```bash
cd ets2_streckenrechner
python3 tools/make_game_cities.py path/to/ets2-search.geojson data/sources/game_cities.json
python3 tools/build_data.py data/sources data
python3 tools/build_land.py path/to/world-atlas/countries-50m.json data/land.json data/network.json
python3 tools/build_page.py .
python3 tools/route.py Calais Duisburg
```

- `data/sources/regions/` enthält die recherchierten Regionsdaten (Städte und Straßen als JSON),
  `patches.json` die Korrekturen danach.
- `make_game_cities.py` zieht Spielpositionen, Firmen und Händler aus `ets2-search.geojson`
  (TruckSim-Maps-Demo, aus den Spieldateien erzeugt) nach `data/sources/game_cities.json`.
- `build_land.py` braucht `countries-50m.json` aus dem npm-Paket `world-atlas@2.0.2`.
- `build_page.py` setzt `src/head.html`, `src/body.html` und die Daten zu `index.html` zusammen.
- `route.py` rechnet Routen auf der Kommandozeile, genau wie die Seite.
- `tools/ets2proj.py` ist die Projektion, mit Selbsttest: `python3 tools/ets2proj.py`.

## Quellen

- Kartenprojektion: [truckermudgeon/maps](https://github.com/truckermudgeon/maps)
- Spielpositionen, Firmen, Händler: [TruckSim Maps](https://github.com/truckermudgeon/truckermudgeon.github.io) (`ets2-search.geojson`)
- Spielkoordinaten der ersten Version: [ETS2 Local Radio](https://github.com/Koenvh1/ETS2-Local-Radio)
- Landkarte: Natural Earth über [world-atlas](https://github.com/topojson/world-atlas)
- Städte, Straßen, Fähren: Truck Simulator Wiki, SCS Software Blog, Steam

Fan-Projekt, nicht verbunden mit SCS Software.
