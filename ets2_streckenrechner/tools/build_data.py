"""Merge the researched region files into one road network for the calculator.

usage: python3 build_data.py SRC_DIR OUT_DIR [radio_arrays.json]

SRC_DIR holds regions/<key>.json (cities + roads per map region), ferries.json,
calibration.json and inventory.json. Writes OUT_DIR/network.json and
OUT_DIR/REPORT.md.
"""
import json
import math
import os
import re
import statistics
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ets2proj import to_game  # noqa: E402

DLCS = ['Base', 'Going East!', 'Scandinavia', 'Vive la France !', 'Italia', 'Beyond the Baltic Sea',
        'Road to the Black Sea', 'Iberia', 'West Balkans', 'Greece', 'Nordic Horizons', 'Iceland']
DEFAULT_WIND = 1.25          # road length / straight line when no road km is known
WIND_MIN, WIND_MAX = 1.0, 3.3     # mountain and fjord roads reach 2-3
UK_SCALE = 0.75             # UK game distances are 1/0.75 longer than mainland ones
RADIO_MAX_OFF = 4000.0       # accept in-game coordinates only this close to the projection (game m)

# ferry ports that are not cities of their own in the game -> the city that owns the port
PORTS = {
    ('seydisfjordur', 'IS'): ('egilsstadir', 'IS'), ('thorlakshofn', 'IS'): ('selfoss', 'IS'),
    ('igoumenitsa', 'GR'): ('ioannina', 'GR'), ('porto torres', 'IT'): ('sassari', 'IT'),
    ('folkestone', 'GB'): ('dover', 'GB'), ('harwich', 'GB'): ('felixstowe', 'GB'), ('hull', 'GB'): ('grimsby', 'GB'),
    ('ijmuiden', 'NL'): ('amsterdam', 'NL'), ('europoort', 'NL'): ('rotterdam', 'NL'), ('piraeus', 'GR'): ('athens', 'GR'),
    ('haparanda', 'SE'): ('tornio', 'FI'),
}

RADIO_CC = {
    'uk': 'GB', 'scotland': 'GB', 'wales': 'GB', 'germany': 'DE', 'netherlands': 'NL', 'belgium': 'BE',
    'luxembourg': 'LU', 'france': 'FR', 'switzerland': 'CH', 'austria': 'AT', 'liecht': 'LI', 'italy': 'IT',
    'spain': 'ES', 'catalonia': 'ES', 'basque': 'ES', 'galicia': 'ES', 'portugal': 'PT', 'poland': 'PL',
    'czech': 'CZ', 'slovakia': 'SK', 'hungary': 'HU', 'denmark': 'DK', 'sweden': 'SE', 'norway': 'NO',
    'finland': 'FI', 'estonia': 'EE', 'latvia': 'LV', 'lithuania': 'LT', 'russia': 'RU', 'romania': 'RO',
    'bulgaria': 'BG', 'turkey': 'TR', 'greece': 'GR', 'slovenia': 'SI', 'croatia': 'HR', 'bosnia': 'BA',
    'serbia': 'RS', 'montenegro': 'ME', 'albania': 'AL', 'macedonia': 'MK', 'kosovo': 'XK', 'iceland': 'IS',
}


def norm(s):
    s = s.lower().replace('ß', 'ss').replace('ø', 'o').replace('æ', 'ae').replace('œ', 'oe').replace('ł', 'l')
    s = s.replace('đ', 'd').replace('ð', 'd').replace('ı', 'i').replace('þ', 'th')
    s = unicodedata.normalize('NFD', s)
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


ROAD_RE = re.compile(r'(?<![\w-])((?:[A-Z][A-Za-z]{0,2})-?\s?\d{1,4}[a-z]?)(?![\w-])')


def road_numbers(text):
    """Keep only road numbers such as A7, E45, AP-7, D110, Rv50 from a free-text road field."""
    out = []
    for m in ROAD_RE.findall(text or ''):
        r = re.sub(r'^(E)\s(\d)', r'\1\2', m.strip())
        if r.upper().startswith(('EUR', 'KM')) or r in out:
            continue
        out.append(r)
    return ' / '.join(out[:3])


def hav(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(a))


def radio_cc(country):
    base = country.split('-')[0].split('_')[0]
    return RADIO_CC.get(base)


def load_radio(path):
    if not path or not os.path.exists(path):
        return {}
    arrays = json.load(open(path))
    out = {}
    for key in ('cities', 'cities_fr', 'cities_btbs', 'cities_balkan_e'):
        for c in arrays.get(key, []):
            cc = radio_cc(c['country'])
            if not cc:
                continue
            try:
                x, z = float(c['x']), float(c['z'])
            except (TypeError, ValueError):
                continue
            for nm in {c['realName'], c['gameName']}:
                out.setdefault((norm(nm), cc), []).append((x, z))
    return out


def main(src, out_dir, radio_path=None):
    log = []
    regions = {}
    rdir = os.path.join(src, 'regions')
    for fn in sorted(os.listdir(rdir)):
        if fn.endswith('.json'):
            regions[fn[:-5]] = json.load(open(os.path.join(rdir, fn)))
    ferries = json.load(open(os.path.join(src, 'ferries.json'))) if os.path.exists(os.path.join(src, 'ferries.json')) else {'connections': []}
    calib = json.load(open(os.path.join(src, 'calibration.json'))) if os.path.exists(os.path.join(src, 'calibration.json')) else {'pairs': []}
    radio = load_radio(radio_path)

    # ---- cities
    cities, by_key, by_alias = [], {}, {}
    for rk, reg in regions.items():
        for c in reg['cities']:
            cc = c['cc'].upper().replace('UK', 'GB')
            key = (norm(c['name']), cc)
            if key in by_key:
                old = cities[by_key[key]]
                d = hav(old['lat'], old['lon'], c['lat'], c['lon'])
                if d > 15:
                    log.append(f'duplicate city {c["name"]} ({cc}) from {rk} is {d:.0f} km away from the {old["region"]} entry; kept the first')
                continue
            if c['dlc'] not in DLCS:
                log.append(f'unknown DLC {c["dlc"]} for {c["name"]}; set to Base')
                c['dlc'] = 'Base'
            entry = {'name': c['name'].strip(), 'cc': cc, 'lat': c['lat'], 'lon': c['lon'], 'dlc': c['dlc'],
                     'aliases': sorted({a.strip() for a in c.get('aliases', []) if a.strip() and norm(a) != norm(c['name'])}),
                     'conf': c.get('conf', 'medium'), 'region': rk, 'note': c.get('note', '')}
            by_key[key] = len(cities)
            cities.append(entry)
    for i, c in enumerate(cities):
        for a in c['aliases']:
            by_alias.setdefault((norm(a), c['cc']), set()).add(i)
            by_alias.setdefault((norm(a), None), set()).add(i)
        by_alias.setdefault((norm(c['name']), None), set()).add(i)

    def resolve(name, cc):
        cc = (cc or '').upper().replace('UK', 'GB')
        n = norm(name)
        if (n, cc) in by_key:
            return by_key[(n, cc)]
        hit = by_alias.get((n, cc))
        if hit and len(hit) == 1:
            return next(iter(hit))
        hit = by_alias.get((n, None))
        if hit and len(hit) == 1:
            return next(iter(hit))
        if (n, cc) in PORTS and PORTS[(n, cc)] in by_key:
            return by_key[PORTS[(n, cc)]]
        # prefix match for names like "Frankfurt" vs "Frankfurt am Main"
        cand = [i for (k, kcc), i in by_key.items() if kcc == cc and (k.startswith(n + ' ') or n.startswith(k + ' '))]
        if len(cand) == 1:
            return cand[0]
        return None

    # ---- game coordinates
    used_radio = 0
    for c in cities:
        x, z, uk = to_game(c['lon'], c['lat'])
        c['uk'] = uk
        best = None
        for nm in [c['name']] + c['aliases']:
            for gx, gz in radio.get((norm(nm), c['cc']), []):
                d = math.hypot(gx - x, gz - z)
                if d < RADIO_MAX_OFF and (best is None or d < best[0]):
                    best = (d, gx, gz)
        if best:
            x, z = best[1], best[2]
            used_radio += 1
        c['x'], c['z'] = round(x), round(z)
        c['src'] = 'game' if best else 'proj'

    # ---- edges
    edges = {}
    unresolved = []

    def add_edge(a, b, km, kind, road, conf, origin, dlc=None):
        if a == b:
            return
        key = (min(a, b), max(a, b), kind)
        e = edges.get(key)
        if e:
            if km:
                e['kms'].append(km)
            if road and not e['road']:
                e['road'] = road
            e['origins'].add(origin)
            return
        edges[key] = {'a': key[0], 'b': key[1], 'kind': kind, 'kms': [km] if km else [], 'road': road or '',
                      'conf': conf, 'origins': {origin}, 'dlc': dlc}

    for rk, reg in regions.items():
        for r in reg['roads']:
            a, b = resolve(r['a'], r.get('acc')), resolve(r['b'], r.get('bcc'))
            if a is None or b is None:
                unresolved.append(f'{rk}: {r["a"]} ({r.get("acc")}) - {r["b"]} ({r.get("bcc")})')
                continue
            kind = 1 if r.get('ferry') else 0
            if kind and re.search(r'tunnel|train|shuttle|rail', (r.get('note', '') + ' ' + r.get('road', '')).lower()):
                kind = 2
            add_edge(a, b, r.get('km'), kind, (r.get('road') or '').strip(), r.get('conf', 'medium'), rk)
    for f in ferries.get('connections', []):
        # the region files carry their own web-checked ferries; from the global list only
        # take routes marked high, so routes the region checks removed do not come back
        if f.get('confidence') != 'high':
            continue
        a, b = resolve(f['a'], f.get('acc')), resolve(f['b'], f.get('bcc'))
        if a is None or b is None:
            unresolved.append(f'ferries: {f["a"]} ({f.get("acc")}) - {f["b"]} ({f.get("bcc")})')
            continue
        add_edge(a, b, f.get('sea_km'), 2 if f.get('kind') == 'train' else 1, '', f.get('confidence'), 'ferries',
                 f.get('dlc') if f.get('dlc') in DLCS else None)

    # ---- edge lengths (raw = scale 1)
    for e in edges.values():
        A, B = cities[e['a']], cities[e['b']]
        e['game_km'] = math.hypot(A['x'] - B['x'], A['z'] - B['z']) / 1000
        e['air_km'] = hav(A['lat'], A['lon'], B['lat'], B['lon'])
        if e['kind'] == 0:
            km = statistics.median(e['kms']) if e['kms'] else None
            w = km / e['air_km'] if km and e['air_km'] > 1 else None
            if w is None or not (0.9 <= w <= 3.5):
                if km:
                    log.append(f'road km {km} implausible for {A["name"]} - {B["name"]} (air {e["air_km"]:.0f} km); default winding used')
                w = DEFAULT_WIND
            e['wind'] = min(max(w, WIND_MIN), WIND_MAX)
            e['real_km'] = km
        else:
            e['sea_km'] = statistics.median(e['kms']) if e['kms'] else e['air_km'] * 1.15

    # ---- calibration: displayed km = game_km * wind * SCALE
    def path_raw(src_i, dst_i, uk_only=None):
        import heapq
        dist = {src_i: 0.0}
        prev = {}
        pq = [(0.0, src_i)]
        adj = {}
        for e in edges.values():
            if e['kind']:
                continue
            w = e['game_km'] * e['wind']
            adj.setdefault(e['a'], []).append((e['b'], w))
            adj.setdefault(e['b'], []).append((e['a'], w))
        while pq:
            d, u = heapq.heappop(pq)
            if u == dst_i:
                return d
            if d > dist.get(u, 1e18):
                continue
            for v, w in adj.get(u, []):
                if d + w < dist.get(v, 1e18):
                    dist[v] = d + w
                    prev[v] = u
                    heapq.heappush(pq, (d + w, v))
        return None

    ratios, ratios_uk, calib_rows = [], [], []
    for p in calib.get('pairs', []):
        if p.get('uses_ferry') or p.get('confidence') == 'low':
            continue
        a, b = resolve(p['from'], p.get('from_cc')), resolve(p['to'], p.get('to_cc'))
        if a is None or b is None:
            calib_rows.append((p, None, 'unresolved'))
            continue
        raw = path_raw(a, b)
        if not raw:
            calib_rows.append((p, None, 'no path'))
            continue
        ratio = p['ingame_km'] / raw
        calib_rows.append((p, ratio, ''))
        (ratios_uk if cities[a]['uk'] and cities[b]['uk'] else ratios).append(ratio)
    # drop outliers (>25 % from median) before taking the final median
    def robust(rs):
        if not rs:
            return None
        m = statistics.median(rs)
        keep = [r for r in rs if abs(r / m - 1) < 0.25]
        return statistics.median(keep) if keep else m
    scale = robust(ratios) or 19.0
    # the UK is built at about 1:15 instead of 1:19 and shows roughly real km, so its game
    # distances need a smaller factor; without UK samples assume the ratio of the two scales
    scale_uk = robust(ratios_uk) if len(ratios_uk) >= 2 else scale * UK_SCALE
    if not ratios:
        log.append('no usable calibration pairs; scale 19 assumed')

    for e in edges.values():
        if e['kind'] == 0:
            A, B = cities[e['a']], cities[e['b']]
            s = scale_uk if (A['uk'] and B['uk']) else scale
            e['km'] = e['game_km'] * e['wind'] * s

    # ---- connectivity
    parent = list(range(len(cities)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for e in edges.values():
        parent[find(e['a'])] = find(e['b'])
    comps = {}
    for i in range(len(cities)):
        comps.setdefault(find(i), []).append(cities[i]['name'])
    comps = sorted(comps.values(), key=len, reverse=True)
    degree = [0] * len(cities)
    for e in edges.values():
        degree[e['a']] += 1
        degree[e['b']] += 1

    # ---- output (cities sorted by name for stable ids)
    order = sorted(range(len(cities)), key=lambda i: (norm(cities[i]['name']), cities[i]['cc']))
    new_id = {old: new for new, old in enumerate(order)}
    out_c = []
    for old in order:
        c = cities[old]
        out_c.append([c['name'], c['cc'], c['x'], c['z'], DLCS.index(c['dlc']), '|'.join(c['aliases']), 1 if c['uk'] else 0])
    out_e = []
    for e in sorted(edges.values(), key=lambda e: (new_id[e['a']], new_id[e['b']])):
        km = round(e['km']) if e['kind'] == 0 else round(e['sea_km'])
        dlc = DLCS.index(e['dlc']) if e.get('dlc') else -1
        out_e.append([new_id[e['a']], new_id[e['b']], max(km, 1), e['kind'], road_numbers(e['road']) if e['kind'] == 0 else '', dlc])
    net = {'dlcs': DLCS, 'cities': out_c, 'edges': out_e, 'scale': round(scale, 3), 'scaleUk': round(scale_uk, 3)}
    os.makedirs(out_dir, exist_ok=True)
    json.dump(net, open(os.path.join(out_dir, 'network.json'), 'w'), ensure_ascii=False, separators=(',', ':'))

    # ---- report
    R = []
    R.append('# Datenbericht ETS2 Streckenrechner\n')
    R.append(f'- Städte: {len(cities)} (davon {used_radio} mit echten Spielkoordinaten, Rest per Projektion)')
    R.append(f'- Verbindungen: {sum(1 for e in edges.values() if e["kind"] == 0)} Straßen, '
             f'{sum(1 for e in edges.values() if e["kind"] == 1)} Fähren, {sum(1 for e in edges.values() if e["kind"] == 2)} Zug')
    R.append(f'- Maßstab aus Kalibrierung: {scale:.2f} (Festland, {len(ratios)} Paare), {scale_uk:.2f} (UK, {len(ratios_uk)} Paare)')
    R.append(f'- Zusammenhangskomponenten: {len(comps)}')
    R.append('\n## Städte pro DLC\n')
    for d in DLCS:
        R.append(f'- {d}: {sum(1 for c in cities if c["dlc"] == d)}')
    if len(comps) > 1:
        R.append('\n## Nicht verbundene Teile\n')
        for comp in comps[1:]:
            R.append('- ' + ', '.join(comp))
    iso = [cities[i]['name'] for i in range(len(cities)) if degree[i] == 0]
    if iso:
        R.append('\n## Städte ohne Verbindung\n\n' + ', '.join(iso))
    if unresolved:
        R.append('\n## Nicht zugeordnete Verbindungen\n')
        R += ['- ' + u for u in unresolved]
    R.append('\n## Kalibrierung\n')
    for p, ratio, why in calib_rows:
        R.append(f'- {p["from"]} → {p["to"]}: Spiel {p["ingame_km"]} km, Faktor {ratio:.2f}' if ratio else f'- {p["from"]} → {p["to"]}: {why}')
    low = [f'{c["name"]} ({c["cc"]}, {c["dlc"]}): {c["note"]}' for c in cities if c['conf'] == 'low']
    if low:
        R.append('\n## Unsichere Städte\n')
        R += ['- ' + x for x in low]
    if log:
        R.append('\n## Hinweise\n')
        R += ['- ' + x for x in log]
    open(os.path.join(out_dir, 'REPORT.md'), 'w').write('\n'.join(R) + '\n')
    print('\n'.join(R[:8]))
    print(f'components={len(comps)} isolated={len(iso)} unresolved={len(unresolved)}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
