"""Build the map background: Natural Earth 1:50m countries (world-atlas npm package)
clipped to Europe, projected into ETS2 game coordinates and simplified.

usage: python3 build_land.py path/to/countries-50m.json out/land.json
"""
import json
import math
import sys

sys.path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
from ets2proj import to_game  # noqa: E402

LON_MIN, LON_MAX, LAT_MIN, LAT_MAX = -25.0, 44.0, 33.5, 72.0
SKIP = {'Ireland', 'Faeroe Is.', 'Greenland', 'Isle of Man', 'Jersey', 'Guernsey'}
TOL = 180.0          # simplification tolerance in game metres (~3.5 km real)
MIN_AREA = 2.0e6     # drop islands smaller than this (game m^2)


def decode(topo):
    sx, sy = topo['transform']['scale']
    tx, ty = topo['transform']['translate']
    arcs = []
    for arc in topo['arcs']:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    return arcs


def ring(arcs, idxs):
    out = []
    for i in idxs:
        pts = arcs[i] if i >= 0 else arcs[~i][::-1]
        out.extend(pts if not out else pts[1:])
    return out


def clip(poly):
    """Sutherland-Hodgman against the lon/lat box."""
    edges = [(lambda p: p[0] >= LON_MIN, lambda a, b: _ix(a, b, 0, LON_MIN)),
             (lambda p: p[0] <= LON_MAX, lambda a, b: _ix(a, b, 0, LON_MAX)),
             (lambda p: p[1] >= LAT_MIN, lambda a, b: _ix(a, b, 1, LAT_MIN)),
             (lambda p: p[1] <= LAT_MAX, lambda a, b: _ix(a, b, 1, LAT_MAX))]
    for inside, inter in edges:
        if not poly:
            break
        out = []
        prev = poly[-1]
        for cur in poly:
            if inside(cur):
                if not inside(prev):
                    out.append(inter(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(inter(prev, cur))
            prev = cur
        poly = out
    return poly


def _ix(a, b, axis, v):
    t = (v - a[axis]) / (b[axis] - a[axis])
    return (a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]))


def dp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        s, e = stack.pop()
        ax, ay = pts[s]
        bx, by = pts[e]
        L = math.hypot(bx - ax, by - ay) or 1e-9
        best, bi = 0.0, -1
        for i in range(s + 1, e):
            px, py = pts[i]
            d = abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / L
            if d > best:
                best, bi = d, i
        if best > tol:
            keep[bi] = True
            stack += [(s, bi), (bi, e)]
    return [p for p, k in zip(pts, keep) if k]


def dp_ring(pts, tol):
    """Simplify a closed ring: split at the vertex farthest from the first one."""
    x0, y0 = pts[0]
    m = max(range(len(pts)), key=lambda i: (pts[i][0] - x0) ** 2 + (pts[i][1] - y0) ** 2)
    a = dp(pts[:m + 1], tol)
    b = dp(pts[m:] + [pts[0]], tol)
    return a[:-1] + b[:-1]


def area(pts):
    return abs(sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1] for i in range(len(pts)))) / 2


def main(src, dst):
    topo = json.load(open(src))
    arcs = decode(topo)
    out = []
    for g in topo['objects']['countries']['geometries']:
        name = g.get('properties', {}).get('name', '')
        if name in SKIP or g['type'] not in ('Polygon', 'MultiPolygon'):
            continue
        polys = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
        parts = []
        for poly in polys:
            for k, r in enumerate(poly):
                pts = clip(ring(arcs, r))
                if len(pts) < 3:
                    continue
                gp = [to_game(lon, lat)[:2] for lon, lat in pts]
                # split rings that straddle the UK scaling seam would be distorted; GB is
                # handled as a whole by to_game, nothing else crosses it in this box
                if k == 0 and area(gp) < MIN_AREA:
                    break
                gp = dp_ring(gp, TOL)
                if len(gp) < 3:
                    continue
                parts.append('M' + 'L'.join(f'{round(x)} {round(z)}' for x, z in gp) + 'Z')
        if parts:
            out.append({'n': name, 'd': ''.join(parts)})
    json.dump(out, open(dst, 'w'), separators=(',', ':'))
    print(len(out), 'countries', sum(len(c['d']) for c in out), 'bytes of path data')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
