"""Assemble the calculator page from src/ and data/.

usage: python3 build_page.py ROOT [ARTIFACT_OUT]
Writes ROOT/index.html (standalone page). With ARTIFACT_OUT also writes the same page
without the <html>/<head>/<body> wrapper, for publishing as a claude.ai artifact.
"""
import json
import os
import sys

root = os.path.abspath(sys.argv[1])
art_out = sys.argv[2] if len(sys.argv) > 2 else None
cfg = json.load(open(os.path.join(root, 'data', 'config.json')))
net = json.load(open(os.path.join(root, 'data', 'network.json')))
land = json.load(open(os.path.join(root, 'data', 'land.json')))

n_c, n_e = len(net['cities']), len(net['edges'])
n_f = sum(1 for e in net['edges'] if e[3] > 0)
fmt = lambda v: f'{v:.1f}'.replace('.', ',')
about = [p.format(cities=n_c, roads=n_e - n_f, ferries=n_f, scale=fmt(net['scale']), scale_uk=fmt(net['scaleUk']),
                  ts=cfg['timeScale'], date=cfg['dataDate'])
         for p in cfg['about']]
data = {
    'dlcs': net['dlcs'], 'cities': net['cities'], 'edges': net['edges'],
    'timeScale': cfg['timeScale'], 'ferryCost': cfg['ferryCost'], 'ferryCounts': cfg['ferryCounts'],
    'example': cfg['example'], 'land': land, 'about': about,
    'footer': cfg['footer'].format(cities=n_c, date=cfg['dataDate']),
}
blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
head = open(os.path.join(root, 'src', 'head.html'), encoding='utf-8').read()
body = open(os.path.join(root, 'src', 'body.html'), encoding='utf-8').read().replace('__DATA_JSON__', blob)

page = ('<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        + head + '\n</head>\n<body>\n' + body + '\n</body>\n</html>\n')
open(os.path.join(root, 'index.html'), 'w', encoding='utf-8').write(page)
print('index.html', len(page.encode()) // 1024, 'KB')
if art_out:
    open(art_out, 'w', encoding='utf-8').write(head + '\n' + body + '\n')
    print(art_out, 'written')
