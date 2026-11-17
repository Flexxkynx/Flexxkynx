"""Step 3 of the real-road build: derive the city network from the in-game roads.

For every city a shortest-path search runs over the real road graph (roads, junction
gaps, ferries). Two cities are neighbours when the shortest road path between them does
not pass through a third city. Each neighbour pair becomes an edge with the real road
length (split into mainland and UK game metres), the ferry kilometres, the DLCs the path
needs and the simplified path geometry. The display scale is then refitted on in-game job
distances.

usage: python3 roads_network.py graph.pkl SRC_DIR NET_DIR
  SRC_DIR: data/sources (game_ports.json, calibration.json)
  NET_DIR: data (network.json from build_data.py is read and rewritten, REPORT.md extended)
"""
import json
import math
import os
import pickle
import statistics
import sys
import time

import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components, dijkstra
from scipy.spatial import cKDTree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_data import DLCS, GUARD_DLC, hav, norm, road_numbers  # noqa: E402,F401
from polyline import encode  # noqa: E402

S_MAIN, S_UK = 19.35, 14.94   # nominal display scales for the search; refitted at the end
FERRY_COST = 1.0
ATTACH = 900.0       # game m: road nodes a city centre is linked to
CITY_R = 450.0       # game m: road nodes that count as "inside" a city
CANDIDATES = 30      # nearest cities checked for adjacency
LIMIT = 1600.0       # display km search radius
BATCH = 6
SIMPLIFY = 35.0      # game m
PRUNE = 1.015        # drop an edge when another path is at most 1.5 % longer


def dp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        s, e = stack.pop()
        (ax, az), (bx, bz) = pts[s], pts[e]
        L = math.hypot(bx - ax, bz - az) or 1e-9
        best, bi = 0.0, -1
        for i in range(s + 1, e):
            px, pz = pts[i]
            d = abs((bx - ax) * (az - pz) - (ax - px) * (bz - az)) / L
            if d > best:
                best, bi = d, i
        if best > tol:
            keep[bi] = True
            stack += [(s, bi), (bi, e)]
    return [p for p, k in zip(pts, keep) if k]


def main(graph_path, src, net_dir):
    t0 = time.time()
    G = pickle.load(open(graph_path, 'rb'))
    net = json.load(open(os.path.join(net_dir, 'network.json'), encoding='utf-8'))
    ports = json.load(open(os.path.join(src, 'game_ports.json'), encoding='utf-8'))
    calib = json.load(open(os.path.join(src, 'calibration.json'), encoding='utf-8'))
    xy, uk = G['node_xy'], G['node_uk']
    ea, eb, ew, eg, et = G['ea'], G['eb'], G['ew'], G['eguard'], G['etype']
    N = len(xy)
    cities = net['cities']
    C = len(cities)

    # main road component (without ferries)
    g0 = coo_matrix((np.ones(len(ea)), (ea, eb)), shape=(N, N))
    _, lab = connected_components(g0, directed=False)
    sizes = np.bincount(lab)
    roadnode = np.zeros(N, bool)
    roadnode[ea] = True
    roadnode[eb] = True
    big = sizes[lab] >= 2000     # main network plus islands such as Iceland, Sicily, Crete
    usable = np.where(roadnode & big)[0]
    utree = cKDTree(xy[usable])

    node_guard = np.zeros(N, int)
    node_guard[ea] = eg
    node_guard[eb] = eg

    w = ew / 1000.0 * np.where(uk[ea] & uk[eb], S_UK, S_MAIN)

    # ferries and trains: link the road nodes nearest to the two terminals
    by_label = {}
    for p in ports:
        by_label.setdefault((p['label'], p['cc']), []).append(p)
    fa, fb, fw, fkind, fguard, fname = [], [], [], [], [], []
    for f in G['ferries']:
        ends = [s.strip() for s in f['name'].split('–')]
        tp = []
        for e in ends:
            lbl, cc = [x.strip() for x in e.rsplit(',', 1)]
            cand = by_label.get((lbl, cc)) or [p for (l2, c2), ps in by_label.items() if l2 == lbl for p in ps]
            tp.append(cand[0] if cand else None)
        if None in tp:
            print('ferry without terminal:', f['name'])
            continue
        nodes = []
        for p in tp:
            d, j = utree.query((p['x'], p['z']))
            nodes.append(int(usable[j]))
        km = hav(tp[0]['lat'], tp[0]['lon'], tp[1]['lat'], tp[1]['lon']) * 1.12
        fa.append(nodes[0])
        fb.append(nodes[1])
        fw.append(km * FERRY_COST)
        fkind.append(f['kind'])
        fguard.append(f['guard'])
        fname.append(f['name'])
    ferry_of = {}
    for i, (a, b) in enumerate(zip(fa, fb)):
        ferry_of[(a, b)] = ferry_of[(b, a)] = i

    # city nodes
    ca, cb, cw = [], [], []
    for i, c in enumerate(cities):
        idx = utree.query_ball_point((c[2], c[3]), ATTACH)
        if not idx:
            d, j = utree.query((c[2], c[3]))
            idx = [j]
        dd = np.hypot(*(xy[usable[idx]] - np.array([c[2], c[3]])).T)
        for j in np.argsort(dd)[:8]:
            ca.append(N + i)
            cb.append(int(usable[idx[j]]))
            cw.append(dd[j] / 1000.0 * (S_UK if c[6] else S_MAIN))
    M = N + C
    A = np.concatenate([ea, fa, ca]).astype(np.int64)
    B = np.concatenate([eb, fb, cb]).astype(np.int64)
    W = np.concatenate([w, fw, cw])
    W = np.maximum(W, 1e-6)
    graph = coo_matrix((W, (A, B)), shape=(M, M)).tocsr()
    graph = graph.maximum(graph.T)  # undirected, keep one weight per pair
    print(f'graph ready: {M} nodes, {graph.nnz // 2} edges, {len(fa)} ferries ({time.time() - t0:.0f}s)')

    # which road nodes lie inside a city
    tag = np.full(M, -1)
    ctree = cKDTree(np.array([[c[2], c[3]] for c in cities]))
    d, j = ctree.query(xy[usable], distance_upper_bound=CITY_R)
    ok = np.isfinite(d)
    tag[usable[ok]] = j[ok]
    tag[N:] = np.arange(C)

    edges = {}
    for s in range(0, C, BATCH):
        idx = list(range(s, min(C, s + BATCH)))
        dist, pred = dijkstra(graph, directed=False, indices=[N + i for i in idx], return_predecessors=True, limit=LIMIT)
        for r, a in enumerate(idx):
            dd = dist[r, N:N + C].copy()
            dd[a] = np.inf
            order = np.argsort(dd)[:CANDIDATES]
            for b in order:
                if not np.isfinite(dd[b]) or (min(a, b), max(a, b)) in edges:
                    continue
                path = [N + b]
                v = N + b
                okp = True
                while v != N + a:
                    v = pred[r, v]
                    if v < 0:
                        okp = False
                        break
                    t = tag[v]
                    if t >= 0 and t != a and t != b:
                        okp = False
                        break
                    path.append(v)
                if not okp:
                    continue
                path.reverse()
                main_m = uk_m = ferry_km = 0.0
                kind = 0
                guards = set()
                fused = []
                parts = [[0, []]]
                for u, v in zip(path, path[1:]):
                    if (u, v) in ferry_of:
                        fi = ferry_of[(u, v)]
                        ferry_km += fw[fi] / FERRY_COST
                        kind = max(kind, int(fkind[fi]))
                        guards.add(fguard[fi])
                        fused.append(fname[fi])
                        parts.append([fkind[fi], [xy[u].tolist(), xy[v].tolist()]])
                        parts.append([0, []])
                        continue
                    pu = xy[u] if u < N else np.array(cities[u - N][2:4], float)
                    pv = xy[v] if v < N else np.array(cities[v - N][2:4], float)
                    L = float(np.hypot(*(pv - pu)))
                    if (u < N and uk[u]) or (u >= N and cities[u - N][6]):
                        uk_m += L
                    else:
                        main_m += L
                    if u < N:
                        guards.add(int(node_guard[u]))
                    parts[-1][1].append(pu.tolist())
                last = path[-1]
                parts[-1][1].append(list(cities[last - N][2:4]) if last >= N else xy[last].tolist())
                parts = [[k, [[round(x), round(z)] for x, z in dp(pts, SIMPLIFY)]] for k, pts in parts if len(pts) >= 2]
                mask = 0
                for gd in guards:
                    dl = GUARD_DLC.get(gd)
                    if dl and dl != 'Base':
                        mask |= 1 << DLCS.index(dl)
                a, b = int(a), int(b)
                edges[(min(a, b), max(a, b))] = {
                    'a': min(a, b), 'b': max(a, b), 'main_m': main_m, 'uk_m': uk_m, 'ferry_km': ferry_km, 'kind': kind,
                    'mask': int(mask), 'ferries': fused,
                    'parts': parts if a < b else [[k, pts[::-1]] for k, pts in parts[::-1]]}
        print(f'  {min(C, s + BATCH)}/{C} cities, {len(edges)} edges ({time.time() - t0:.0f}s)', flush=True)

    # ---- connectivity of the city graph
    ga = [e['a'] for e in edges.values()]
    gb = [e['b'] for e in edges.values()]
    nc, clab = connected_components(coo_matrix((np.ones(len(ga)), (ga, gb)), shape=(C, C)), directed=False)
    comp_sizes = np.bincount(clab)
    lonely = [cities[i][0] for i in range(C) if comp_sizes[clab[i]] < comp_sizes.max()]

    # ---- refit display scales on in-game job distances (road-only pairs)
    def cg_dist(sm, su):
        rows, cols, vals = [], [], []
        for e in edges.values():
            rows.append(e['a'])
            cols.append(e['b'])
            vals.append(e['main_m'] / 1000 * sm + e['uk_m'] / 1000 * su + e['ferry_km'] * FERRY_COST * 1e3)
        return coo_matrix((vals, (rows, cols)), shape=(C, C)).tocsr()
    name_idx = {}
    for i, c in enumerate(cities):
        for k in [c[0]] + [a for a in c[5].split('|') if a]:
            name_idx.setdefault(norm(k), i)
    pairs = []
    for p in calib.get('pairs', []):
        if p.get('uses_ferry') or p.get('confidence') == 'low':
            continue
        a, b = name_idx.get(norm(p['from'])), name_idx.get(norm(p['to']))
        if a is not None and b is not None:
            pairs.append((a, b, p['ingame_km'], p['from'], p['to']))
    gm = cg_dist(1.0, 1.0)
    dist_m, pred_m = dijkstra(gm, directed=False, indices=[a for a, *_ in pairs], return_predecessors=True)
    rat_main, rat_uk, rows = [], [], []
    for r, (a, b, km, fa_, fb_) in enumerate(pairs):
        if not np.isfinite(dist_m[r, b]):
            continue
        v, main_k, uk_k = b, 0.0, 0.0
        while v != a:
            u = pred_m[r, v]
            e = edges[(min(u, v), max(u, v))]
            main_k += e['main_m'] / 1000
            uk_k += e['uk_m'] / 1000
            v = u
        if uk_k < 0.05 * (main_k + uk_k):
            rat_main.append(km / main_k)
            rows.append((fa_, fb_, km, km / main_k, 'Festland'))
        elif main_k < 0.05 * (main_k + uk_k):
            rat_uk.append(km / uk_k)
            rows.append((fa_, fb_, km, km / uk_k, 'UK'))

    def robust(rs, default):
        if not rs:
            return default
        m = statistics.median(rs)
        keep = [x for x in rs if abs(x / m - 1) < 0.2]
        return statistics.median(keep) if keep else m
    s_main, s_uk = robust(rat_main, S_MAIN), robust(rat_uk, S_UK)

    # ---- drop redundant long edges (another path through cities is almost as short)
    import heapq

    def cost(e):
        return e['main_m'] / 1000 * s_main + e['uk_m'] / 1000 * s_uk + e['ferry_km'] * FERRY_COST
    adj = {i: {} for i in range(C)}
    for k, e in edges.items():
        adj[e['a']][e['b']] = adj[e['b']][e['a']] = cost(e)

    def sp(a, b, limit):
        dist = {a: 0.0}
        pq = [(0.0, a)]
        while pq:
            d, u = heapq.heappop(pq)
            if u == b:
                return d
            if d > dist.get(u, 1e18) or d > limit:
                continue
            for v, wv in adj[u].items():
                nd = d + wv
                if nd < dist.get(v, 1e18):
                    dist[v] = nd
                    heapq.heappush(pq, (nd, v))
        return 1e18
    before = len(edges)
    for k in sorted(edges, key=lambda k: -cost(edges[k])):
        e = edges[k]
        wv = adj[e['a']].pop(e['b'])
        adj[e['b']].pop(e['a'])
        if sp(e['a'], e['b'], wv * PRUNE) <= wv * PRUNE:
            del edges[k]
        else:
            adj[e['a']][e['b']] = adj[e['b']][e['a']] = wv
    print(f'pruned {before - len(edges)} redundant edges, {len(edges)} left')

    # ---- write network.json with the real-road edges
    old = {}
    for e in net['edges']:
        if e[3] == 0 and e[4]:
            old[(min(e[0], e[1]), max(e[0], e[1]))] = e[4]
    out_e, geom = [], []
    for e in sorted(edges.values(), key=lambda e: (e['a'], e['b'])):
        road_km = e['main_m'] / 1000 * s_main + e['uk_m'] / 1000 * s_uk
        out_e.append([e['a'], e['b'], round(float(road_km), 1), int(e['kind']), old.get((e['a'], e['b']), ''), int(e['mask']), round(float(e['ferry_km']))])
        geom.append([[k, encode(pts)] for k, pts in e['parts']])
    net['edges'] = out_e
    net['geom'] = geom
    net['scale'], net['scaleUk'] = round(s_main, 3), round(s_uk, 3)
    net['roadsFromGame'] = True
    json.dump(net, open(os.path.join(net_dir, 'network.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

    R = ['\n## Straßennetz aus den Spieldaten\n',
         f'- Straßengraph: {N} Knoten, {len(ea)} Kanten, {len(fa)} Fähr- und Zuglinien',
         f'- Städteverbindungen: {len(out_e)}, davon {sum(1 for e in out_e if e[3])} mit Fähre oder Zug',
         f'- Anzeigemaßstab neu angepasst: {s_main:.2f} Festland ({len(rat_main)} Paare), {s_uk:.2f} UK ({len(rat_uk)} Paare)',
         f'- Zusammenhang: {nc} Teile' + (f'; abgetrennt: {", ".join(lonely)}' if lonely else '')]
    R += [f'- {a} → {b}: Spiel {km} km, Faktor {r:.2f} ({kind})' for a, b, km, r, kind in rows]
    rep = open(os.path.join(net_dir, 'REPORT.md'), encoding='utf-8').read()
    rep = rep.split('\n## Straßennetz aus den Spieldaten')[0].rstrip() + '\n' + '\n'.join(R) + '\n'
    open(os.path.join(net_dir, 'REPORT.md'), 'w', encoding='utf-8').write(rep)
    print('\n'.join(R))
    print(f'done ({time.time() - t0:.0f}s)')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
