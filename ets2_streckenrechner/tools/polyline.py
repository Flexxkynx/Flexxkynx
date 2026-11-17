"""Compact polyline encoding (Google polyline algorithm) for game coordinates.

Coordinates are rounded to UNIT game metres; the page decodes them with the same unit.
The alphabet (ASCII 63-126) contains no '<', so the strings are safe inside HTML.
"""
UNIT = 4.0


def _enc(v, out):
    v = ~(v << 1) if v < 0 else (v << 1)
    while v >= 0x20:
        out.append(chr((0x20 | (v & 0x1f)) + 63))
        v >>= 5
    out.append(chr(v + 63))


def encode(pts, unit=UNIT):
    out, px, pz = [], 0, 0
    for x, z in pts:
        ix, iz = int(round(x / unit)), int(round(z / unit))
        _enc(ix - px, out)
        _enc(iz - pz, out)
        px, pz = ix, iz
    return ''.join(out)


def decode(s, unit=UNIT):
    pts, i, x, z = [], 0, 0, 0
    while i < len(s):
        vals = []
        for _ in range(2):
            shift = res = 0
            while True:
                b = ord(s[i]) - 63
                i += 1
                res |= (b & 0x1f) << shift
                shift += 5
                if b < 0x20:
                    break
            vals.append(~(res >> 1) if res & 1 else res >> 1)
        x += vals[0]
        z += vals[1]
        pts.append((x * unit, z * unit))
    return pts


if __name__ == '__main__':
    t = [(0, 0), (-40169, -10685), (62276, 84880), (62276.4, 84870)]
    r = decode(encode(t))
    assert all(abs(a - c) <= UNIT / 2 and abs(b - d) <= UNIT / 2 for (a, b), (c, d) in zip(t, r)), r
    print('polyline ok', encode(t))
