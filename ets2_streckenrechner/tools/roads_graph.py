"""Step 2 of the real-road build: turn decoded tiles into a routable road graph.

- road vertices closer than SNAP metres become one node
- roads are densified to one node every DENSE metres
- junctions are not in the tiles as lanes: a road end is linked to the nearest point of
  every other road within LINK metres (crossings leave gaps of a few to ~35 m)
- ferry and train lines link the road nodes nearest to their two ports

usage: python3 roads_graph.py decoded.pkl graph.pkl
"""
import math
import os
import pickle
import sys
import time

import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from scipy.spatial import cKDTree

SNAP = 3.0          # game metres
DENSE = 20.0        # max spacing of nodes along a road
LINK = 35.0         # max gap bridged at a junction
PORT_TOL = 400.0    # max distance from a ferry end to a road node


def hav(lon1, lat1, lon2, lat2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(a))


def main(src, dst):
    t0 = time.time()
    D = pickle.load(open(src, 'rb'))
    roads = D['roads']
    # ---- vertices
    xs, zs, uks, piece_of = [], [], [], []
    starts = []
    for k, (rt, hidden, guard, pts) in enumerate(roads):
        starts.append(len(xs))
        for x, z, uk in pts:
            xs.append(x)
            zs.append(z)
            uks.append(uk)
    starts.append(len(xs))
    P = np.column_stack([xs, zs])
    n = len(P)
    pairs = cKDTree(P).query_pairs(SNAP, output_type='ndarray')
    m = coo_matrix((np.ones(len(pairs)), (pairs[:, 0], pairs[:, 1])), shape=(n, n))
    ncomp, label = connected_components(m, directed=False)
    node_xy = np.zeros((ncomp, 2))
    cnt = np.bincount(label, minlength=ncomp)
    np.add.at(node_xy, label, P)
    node_xy /= cnt[:, None]
    node_uk = np.zeros(ncomp, bool)
    node_uk[label] = np.array(uks)
    print(f'{n} vertices -> {ncomp} nodes ({time.time() - t0:.0f}s)')

    # ---- road edges, densified
    ea, eb, ew, eguard, ehidden, etype, epiece = [], [], [], [], [], [], []
    TYPES = {'freeway': 0, 'divided': 1, 'local': 2, 'unknown': 3}
    extra_xy, extra_uk = [], []
    nxt = ncomp
    for k, (rt, hidden, guard, pts) in enumerate(roads):
        s0, e0 = starts[k], starts[k + 1]
        ty = TYPES.get(rt, 3)
        for i in range(s0, e0 - 1):
            a, b = label[i], label[i + 1]
            if a == b:
                continue
            L = float(np.hypot(*(P[i + 1] - P[i])))
            parts = max(1, int(math.ceil(L / DENSE)))
            chain = [a]
            for t in range(1, parts):
                f = t / parts
                extra_xy.append(P[i] + f * (P[i + 1] - P[i]))
                extra_uk.append(uks[i])
                chain.append(nxt)
                nxt += 1
            chain.append(b)
            for u, v in zip(chain, chain[1:]):
                ea.append(u)
                eb.append(v)
                ew.append(L / parts)
                eguard.append(guard)
                ehidden.append(hidden)
                etype.append(ty)
                epiece.append(k)
    node_xy = np.vstack([node_xy, np.array(extra_xy).reshape(-1, 2)])
    node_uk = np.concatenate([node_uk, np.array(extra_uk, bool)])
    # piece of every densified node: take it from its edges
    node_piece = np.full(len(node_xy), -1)
    node_piece[np.array(ea)] = epiece
    node_piece[np.array(eb)] = epiece
    nn = len(node_xy)
    deg = np.bincount(np.concatenate([ea, eb]), minlength=nn)
    print(f'{len(ea)} road edges, {nn} nodes, {int((deg == 1).sum())} dead ends ({time.time() - t0:.0f}s)')

    # ---- junction gaps
    tree = cKDTree(node_xy)
    ends = np.where(deg == 1)[0]
    links = 0
    for nd, cand in zip(ends, tree.query_ball_point(node_xy[ends], LINK)):
        best = {}
        own = node_piece[nd]
        for c in cand:
            pc = node_piece[c]
            if c == nd or pc == own:
                continue
            d = float(np.hypot(*(node_xy[c] - node_xy[nd])))
            if pc not in best or d < best[pc][0]:
                best[pc] = (d, c)
        for d, c in sorted(best.values())[:4]:
            ea.append(nd)
            eb.append(c)
            ew.append(d)
            eguard.append(0)
            ehidden.append(False)
            etype.append(4)
            links += 1
    print(f'{links} junction links ({time.time() - t0:.0f}s)')

    # ---- ferries and trains: one edge between the road nodes nearest to the two ports
    roadnodes = np.unique(np.concatenate([ea, eb]))
    rtree = cKDTree(node_xy[roadnodes])
    byname = {}
    for typ, name, guard, pts in D['ferries']:
        byname.setdefault(name, (typ, guard, []))[2].extend(pts)
    ferries = []
    for name, (typ, guard, pts) in byname.items():
        arr = np.array([(p[0], p[1]) for p in pts])
        # ports = the two vertices farthest apart
        i0 = int(np.argmax(np.hypot(*(arr - arr[0]).T)))
        i1 = int(np.argmax(np.hypot(*(arr - arr[i0]).T)))
        ports = []
        for i in (i0, i1):
            d, j = rtree.query(arr[i])
            ports.append((int(roadnodes[j]), float(d), pts[i][3], pts[i][4]))
        if max(ports[0][1], ports[1][1]) > PORT_TOL:
            print('ferry port far from road:', name, [round(p[1]) for p in ports])
        sea_km = hav(ports[0][2], ports[0][3], ports[1][2], ports[1][3]) * 1.12
        ferries.append({'name': name, 'kind': 2 if typ == 'train' else 1, 'guard': guard,
                        'a': ports[0][0], 'b': ports[1][0], 'km': sea_km})
    print(f'{len(ferries)} ferry/train lines ({time.time() - t0:.0f}s)')

    pickle.dump({'node_xy': node_xy, 'node_uk': node_uk, 'ea': np.array(ea), 'eb': np.array(eb), 'ew': np.array(ew),
                 'eguard': np.array(eguard), 'ehidden': np.array(ehidden), 'etype': np.array(etype),
                 'ferries': ferries}, open(dst, 'wb'))
    # connectivity report (roads + junctions + ferries)
    fa = [f['a'] for f in ferries]
    fb = [f['b'] for f in ferries]
    A = np.concatenate([ea, fa])
    B = np.concatenate([eb, fb])
    g = coo_matrix((np.ones(len(A)), (A, B)), shape=(nn, nn))
    nc, lab = connected_components(g, directed=False)
    sizes = np.bincount(lab)
    order = np.argsort(-sizes)
    print(f'components: {nc}, largest {sizes[order[0]]} of {nn} nodes ({sizes[order[0]] / nn:.1%}), next {sizes[order[1:6]].tolist()}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
