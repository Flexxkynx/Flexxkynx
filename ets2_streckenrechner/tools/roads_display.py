"""Step 4 of the real-road build: the visible road layer for the map.

Joins the decoded road pieces (non-hidden freeways, divided roads and local roads) into
long polylines, simplifies them and stores them as encoded strings per road class.

usage: python3 roads_display.py decoded.pkl ../data/roads_display.json
"""
import json
import os
import pickle
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from polyline import encode  # noqa: E402
from roads_network import dp  # noqa: E402

CLASSES = {'freeway': 30.0, 'divided': 35.0, 'local': 45.0}   # simplification tolerance (game m)
SNAP = 4.0


def chains(pieces):
    """Join pieces that meet end to end where exactly two pieces meet."""
    key = lambda p: (round(p[0] / SNAP), round(p[1] / SNAP))  # noqa: E731
    ends = {}
    for i, pts in enumerate(pieces):
        ends.setdefault(key(pts[0]), []).append(i)
        ends.setdefault(key(pts[-1]), []).append(i)
    used = [False] * len(pieces)
    out = []
    for i in range(len(pieces)):
        if used[i]:
            continue
        used[i] = True
        line = list(pieces[i])
        # grow at the end, then at the start
        for at_end in (True, False):
            while True:
                k = key(line[-1] if at_end else line[0])
                at = ends.get(k, [])
                nxt = [j for j in at if not used[j]]
                if len(at) != 2 or not nxt:
                    break
                j = nxt[0]
                used[j] = True
                pts = pieces[j]
                if at_end:
                    if key(pts[0]) != k:
                        pts = pts[::-1]
                    line.extend(pts[1:])
                else:
                    if key(pts[-1]) != k:
                        pts = pts[::-1]
                    line = list(pts[:-1]) + line
        out.append(line)
    return out


def main(src, dst):
    D = pickle.load(open(src, 'rb'))
    res = {}
    for cls, tol in CLASSES.items():
        pieces = [[(x, z) for x, z, u in pts] for rt, hidden, g, pts in D['roads'] if rt == cls and not hidden]
        lines = chains(pieces)
        enc = [encode(dp(l, tol)) for l in lines]
        res[cls] = enc
        print(cls, len(pieces), 'pieces ->', len(lines), 'lines,', sum(len(e) for e in enc) // 1024, 'KB')
    json.dump(res, open(dst, 'w'), separators=(',', ':'))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
