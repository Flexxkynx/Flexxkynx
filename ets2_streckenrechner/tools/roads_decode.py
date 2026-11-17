"""Step 1 of the real-road build: decode ETS2 map tiles into compact arrays.

Reads the vector tiles of TruckSim Maps (ets2.pmtiles, generated from the game files) at
one zoom level, clips every road exactly to its tile so pieces from neighbouring tiles
meet at the same border point, converts to game coordinates and stores:
  roads:   polylines with road type, hidden flag, dlc guard
  prefabs: junction footprints (polygons)
  ferries: ferry and train lines with their names

usage: python3 roads_decode.py ets2.pmtiles out.pkl [zoom]
"""
import gzip
import math
import os
import pickle
import sys
import time

import mapbox_vector_tile as mvt
from pmtiles.reader import MmapSource, all_tiles

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ets2proj import to_game  # noqa: E402

SKIP_ROADS = {'train', 'tram'}


def clip_line(pts, lo, hi):
    """Clip a polyline to the square [lo, hi]^2; returns a list of polylines."""
    out, cur = [], []

    def inside(p):
        return lo <= p[0] <= hi and lo <= p[1] <= hi

    def seg_clip(p, q):
        # Liang-Barsky
        x0, y0 = p
        dx, dy = q[0] - x0, q[1] - y0
        t0, t1 = 0.0, 1.0
        for pp, qq in ((-dx, x0 - lo), (dx, hi - x0), (-dy, y0 - lo), (dy, hi - y0)):
            if pp == 0:
                if qq < 0:
                    return None
            else:
                r = qq / pp
                if pp < 0:
                    if r > t1:
                        return None
                    t0 = max(t0, r)
                else:
                    if r < t0:
                        return None
                    t1 = min(t1, r)
        return (x0 + t0 * dx, y0 + t0 * dy), (x0 + t1 * dx, y0 + t1 * dy)

    pts = [tuple(p) for p in pts]
    for i in range(len(pts) - 1):
        s = seg_clip(pts[i], pts[i + 1])
        if s is None:
            if len(cur) > 1:
                out.append(cur)
            cur = []
            continue
        a, b = s
        if not cur:
            cur = [a]
        elif cur[-1] != a:
            if len(cur) > 1:
                out.append(cur)
            cur = [a]
        cur.append(b)
        if b != pts[i + 1]:  # left the box
            out.append(cur)
            cur = []
    if len(cur) > 1:
        out.append(cur)
    return out


def main(path, dst, zoom):
    src = MmapSource(open(path, 'rb'))
    t0 = time.time()
    roads, prefabs, ferries = [], [], []
    n = 2 ** zoom
    tiles = 0
    for (z, tx, ty), data in all_tiles(src):
        if z != zoom:
            continue
        tiles += 1
        dec = mvt.decode(gzip.decompress(data), default_options={'y_coord_down': True})

        def g(px, py, ext):
            lon = (tx + px / ext) / n * 360 - 180
            lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (ty + py / ext) / n))))
            x, zz, uk = to_game(lon, lat)
            return (x, zz, uk, lon, lat)

        for layer in dec.values():
            ext = layer.get('extent', 4096)
            for f in layer['features']:
                p, geom = f['properties'], f['geometry']
                typ = p.get('type')
                if typ == 'road' and p.get('roadType') not in SKIP_ROADS:
                    lines = geom['coordinates'] if geom['type'] == 'MultiLineString' else [geom['coordinates']]
                    for ln in lines:
                        for piece in clip_line(ln, 0, ext):
                            roads.append((p.get('roadType'), bool(p.get('hidden')), p.get('dlcGuard', 0),
                                          [g(a, b, ext)[:3] for a, b in piece]))
                elif typ == 'prefab':
                    polys = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
                    for poly in polys:
                        prefabs.append((p.get('dlcGuard', 0), [g(a, b, ext)[:2] for a, b in poly[0]]))
                elif typ in ('ferry', 'train'):
                    lines = geom['coordinates'] if geom['type'] == 'MultiLineString' else [geom['coordinates']]
                    for ln in lines:
                        for piece in clip_line(ln, 0, ext):
                            ferries.append((typ, p.get('name'), p.get('dlcGuard', 0), [g(a, b, ext) for a, b in piece]))
    pickle.dump({'roads': roads, 'prefabs': prefabs, 'ferries': ferries, 'zoom': zoom}, open(dst, 'wb'))
    print(f'zoom {zoom}: {tiles} tiles, {len(roads)} road pieces, {sum(len(r[3]) for r in roads)} vertices, '
          f'{len(prefabs)} prefab parts, {len(ferries)} ferry pieces, {time.time() - t0:.0f}s')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 9)
