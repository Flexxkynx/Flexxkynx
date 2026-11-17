"""Compute a route on data/network.json the same way the page does.

usage: python3 route.py START ZIEL [VIA ...] [--no-ferry]
       python3 route.py --pairs pairs.txt      (one "A;B" per line, prints A;B;km)
"""
import heapq
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_data import norm  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NET = json.load(open(os.path.join(ROOT, 'data', 'network.json')))
CFG = json.load(open(os.path.join(ROOT, 'data', 'config.json')))
C = NET['cities']
ADJ = [[] for _ in C]
for i, e in enumerate(NET['edges']):
    ADJ[e[0]].append((e[1], i))
    ADJ[e[1]].append((e[0], i))


def find(name):
    n = norm(name)
    for i, c in enumerate(C):
        if norm(c[0]) == n:
            return i
    for i, c in enumerate(C):
        if n in [norm(a) for a in c[5].split('|') if a]:
            return i
    raise SystemExit(f'unknown city: {name}')


def path(a, b, no_ferry=False):
    dist, prev, pq = {a: 0.0}, {}, [(0.0, a)]
    while pq:
        d, u = heapq.heappop(pq)
        if u == b:
            break
        if d > dist[u]:
            continue
        for v, ei in ADJ[u]:
            e = NET['edges'][ei]
            if no_ferry and e[3]:
                continue
            nd = d + e[2] + (e[6] if len(e) > 6 else 0) * CFG['ferryCost']
            if nd < dist.get(v, 1e18):
                dist[v], prev[v] = nd, (u, ei)
                heapq.heappush(pq, (nd, v))
    if b not in dist:
        return None
    steps, v = [], b
    while v != a:
        u, ei = prev[v]
        steps.append((u, v, NET['edges'][ei]))
        v = u
    return steps[::-1]


def total(steps):
    road = sum(e[2] for _, _, e in steps)
    ferry = sum(e[6] for _, _, e in steps if len(e) > 6)
    return road + (ferry if CFG['ferryCounts'] else 0), road, ferry


def main(argv):
    no_ferry = '--no-ferry' in argv
    argv = [a for a in argv if a != '--no-ferry']
    if argv and argv[0] == '--pairs':
        for line in open(argv[1], encoding='utf-8'):
            if ';' not in line:
                continue
            a, b = [x.strip() for x in line.split(';')[:2]]
            s = path(find(a), find(b), no_ferry)
            print(f'{a};{b};{round(total(s)[0]) if s else "none"}')
        return
    stops = [find(x) for x in argv]
    all_steps = []
    for a, b in zip(stops, stops[1:]):
        s = path(a, b, no_ferry)
        if s is None:
            raise SystemExit(f'no route {C[a][0]} -> {C[b][0]}')
        all_steps += s
    cum = 0
    for u, v, e in all_steps:
        km = e[2] + (e[6] if CFG['ferryCounts'] and len(e) > 6 else 0)
        cum += km
        kind = ['', ' Fähre', ' Zug'][e[3]]
        print(f'{C[u][0]:>22} -> {C[v][0]:<22} {km:7.0f} km{kind:6} {e[4]:<18} Σ {cum:.0f}')
    t, road, ferry = total(all_steps)
    print(f'TOTAL {round(t)} km (road {round(road)}, ferry {round(ferry)})')


if __name__ == '__main__':
    main(sys.argv[1:])
