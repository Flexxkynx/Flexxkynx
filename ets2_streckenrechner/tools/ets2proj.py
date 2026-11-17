"""WGS84 -> ETS2 game coordinates.

Port of the projection in truckermudgeon/maps (packages/libs/map/projections.ts),
which uses the values from the game's def/climate.sii: Lambert conformal conic on a
sphere, plus the larger authoring scale of the UK.
"""
import math

R = 6_370_997.0
LEN_DEG = R * math.pi / 180
LAT1, LAT2 = math.radians(37), math.radians(65)
LAT0, LON0 = math.radians(50), math.radians(15)
OFFSET = (16660.0, 4150.0)
FACTOR = (-0.000171570875, 0.0001729241463)
UK_SCALE = 0.75
CALAIS = (-31100.0, -5500.0)

_n = math.log(math.cos(LAT1) / math.cos(LAT2)) / math.log(
    math.tan(math.pi / 4 + LAT2 / 2) / math.tan(math.pi / 4 + LAT1 / 2))
_F = math.cos(LAT1) * math.tan(math.pi / 4 + LAT1 / 2) ** _n / _n
_rho0 = R * _F / math.tan(math.pi / 4 + LAT0 / 2) ** _n


def _lcc(lon, lat):
    phi, lam = math.radians(lat), math.radians(lon)
    rho = R * _F / math.tan(math.pi / 4 + phi / 2) ** _n
    theta = _n * (lam - LON0)
    return rho * math.sin(theta), _rho0 - rho * math.cos(theta)


def to_game(lon, lat):
    """Return (x, z, is_uk) in game metres.

    Iceland (west of 12 degrees W) would fall into the UK sector rule; its in-game
    placement is unknown, so it is projected at the mainland scale instead.
    """
    ux, uy = _lcc(lon, lat)
    x = ux / FACTOR[1] / LEN_DEG
    y = uy / FACTOR[0] / LEN_DEG
    x_uk = x / UK_SCALE - CALAIS[0] / 2 + OFFSET[0]
    y_uk = y / UK_SCALE - CALAIS[1] / 2 + OFFSET[1]
    sx, sy = math.floor(x_uk / 4000), math.floor(y_uk / 4000)
    is_uk = sx <= -8 and sy <= -2 and not (sx == -8 and sy == -2) and lon > -12
    if is_uk:
        x = x / UK_SCALE - CALAIS[0] / 2
        y = y / UK_SCALE - CALAIS[1] / 2
    return x + OFFSET[0], y + OFFSET[1], is_uk


if __name__ == '__main__':
    tests = [((-0.5943602137854889, 51.29443960532431), (-40169, -10685)),
             ((24.63877984644102, 35.391305791648065), (62276, 84880)),
             ((2.2454398875049852, 48.96983557895307), (-30120, 5847))]
    for (lon, lat), exp in tests:
        x, z, uk = to_game(lon, lat)
        print(f'{x:.3f} {z:.3f} uk={uk} expected {exp}')
        assert abs(x - exp[0]) < 0.01 and abs(z - exp[1]) < 0.01
    print('projection ok')
