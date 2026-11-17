"""Convert web/cities/cities-ets2.js from ETS2 Local Radio into JSON for build_data.py.

usage: python3 convert_radio.py cities-ets2.js radio_arrays.json
"""
import re, json, sys, collections
src = open(sys.argv[1], encoding='utf-8').read()
arrays = {}
for m in re.finditer(r'^var (cities\w*) = \[', src, re.M):
    start = m.end()-1
    # find matching bracket
    depth=0; i=start
    while True:
        c=src[i]
        if c=='[': depth+=1
        elif c==']':
            depth-=1
            if depth==0: break
        i+=1
    body = src[start:i+1]
    body = re.sub(r'/\*.*?\*/', '', body, flags=re.S)
    body = re.sub(r'^\s*//.*$', '', body, flags=re.M)
    body = re.sub(r',\s*([\]}])', r'\1', body)
    try:
        arrays[m.group(1)] = json.loads(body)
    except Exception as e:
        print('fail', m.group(1), e)
json.dump(arrays, open(sys.argv[2], 'w'), ensure_ascii=False)
print({k: len(v) for k, v in arrays.items()})
