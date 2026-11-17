"""Extract in-game city positions, companies and truck dealers from ets2-search.geojson.

The file comes from the TruckSim Maps demo (github.com/truckermudgeon/truckermudgeon.github.io)
and is generated from the game files; positions are lon/lat in that project's projection,
which ets2proj.to_game turns back into exact game coordinates.

usage: python3 make_game_cities.py ets2-search.geojson ../data/sources/game_cities.json
Also writes game_ports.json (ferry and train terminals) next to the output.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ets2proj import to_game  # noqa: E402


def main(src, dst):
    feats = json.load(open(src, encoding='utf-8'))['features']
    cities = {}
    for f in feats:
        p = f['properties']
        if p['type'] == 'city':
            lon, lat = f['geometry']['coordinates']
            x, z, uk = to_game(lon, lat)
            cities[(p['label'], p['stateCode'])] = {
                'label': p['label'], 'cc': p['stateCode'], 'lon': lon, 'lat': lat,
                'x': round(x), 'z': round(z), 'guard': p['dlcGuard'], 'companies': set(), 'dealers': set()}
    for f in feats:
        p = f['properties']
        if p['type'] not in ('company', 'dealer') or not p.get('city'):
            continue
        c = cities.get((p['city']['name'], p['city']['stateCode']))
        if c:
            c['companies' if p['type'] == 'company' else 'dealers'].add(p['label'])
    out = []
    for c in sorted(cities.values(), key=lambda c: (c['cc'], c['label'])):
        c['companies'] = sorted(c['companies'], key=str.lower)
        c['dealers'] = sorted(c['dealers'], key=str.lower)
        out.append(c)
    json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    ports = []
    for f in feats:
        p = f['properties']
        if p['type'] in ('ferry', 'train'):
            lon, lat = f['geometry']['coordinates']
            x, z, uk = to_game(lon, lat)
            ports.append({'label': p['label'], 'cc': p['stateCode'], 'kind': p['type'], 'lon': lon, 'lat': lat, 'x': round(x), 'z': round(z)})
    json.dump(ports, open(os.path.join(os.path.dirname(dst), 'game_ports.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(len(ports), 'ferry and train terminals')
    print(len(out), 'cities,', sum(len(c['companies']) for c in out), 'company sites,',
          sum(len(c['dealers']) for c in out), 'dealers')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
