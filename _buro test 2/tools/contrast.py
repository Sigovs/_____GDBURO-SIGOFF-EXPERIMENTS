#!/usr/bin/env python3
"""Measure AA on the COMPOSITED render, not on the tokens.

`color I1`/`I6` require the ratio to be taken from what actually reaches the eye. Type
over photography is the case where a token table says one thing and the render says
another, so this samples the real pixels under each text run and reports the WORST
region it finds, not the average — an average hides the bright patch that fails.
"""
import json, sys
from PIL import Image

def lum(c):
    def f(v):
        v /= 255.0
        return v/12.92 if v <= 0.03928 else ((v+0.055)/1.055)**2.4
    return 0.2126*f(c[0]) + 0.7152*f(c[1]) + 0.0722*f(c[2])

def ratio(a, b):
    l1, l2 = sorted((lum(a), lum(b)), reverse=True)
    return (l1+0.05)/(l2+0.05)

def parse(css):
    n = css[css.index('(')+1:css.index(')')].replace('/', ',').split(',')
    v = [float(x.strip()) for x in n if x.strip()]
    return (v[0], v[1], v[2]), (v[3] if len(v) > 3 else 1.0)

img = Image.open(sys.argv[1]).convert('RGB')
boxes = json.load(open(sys.argv[2]))
SW, SH = img.size
print(f"render {SW}x{SH}\n")
print(f"{'element':22s} {'size':>6s} {'worst bg':>9s} {'ratio':>7s}  {'need':>5s}  verdict")
print("-"*72)
fails = []
for b in boxes:
    if b['y'] < 0 or b['y']+b['h'] > SH/ (SH/ b.get('_vh', SH)) : pass
    sx = SW / 1440.0
    x0, y0 = int(b['x']*sx), int(b['y']*sx)
    x1, y1 = int((b['x']+b['w'])*sx), int((b['y']+b['h'])*sx)
    x0, y0 = max(0,x0), max(0,y0); x1, y1 = min(SW,x1), min(SH,y1)
    if x1-x0 < 2 or y1-y0 < 2: continue
    fg, alpha = parse(b['color'])
    crop = img.crop((x0,y0,x1,y1))
    # worst region: brightest 8x8 tile under the run (text is thin; the eye needs the
    # worst patch to pass, not the mean)
    tiles = []
    tw = max(2,(x1-x0)//12)
    for tx in range(0, x1-x0-tw+1, max(1,tw)):
        t = crop.crop((tx,0,tx+tw,y1-y0)).resize((1,1), Image.LANCZOS).getpixel((0,0))
        tiles.append(t)
    worst = max(tiles, key=lum) if tiles else crop.resize((1,1)).getpixel((0,0))
    eff = tuple(fg[i]*alpha + worst[i]*(1-alpha) for i in range(3))
    r = ratio(eff, worst)
    size = float(b['size'].replace('px',''))
    need = 3.0 if size >= 24 else 4.5
    ok = r >= need
    if not ok: fails.append((b['label'], r, need))
    print(f"{b['label']:22s} {size:5.0f}px  #{worst[0]:02x}{worst[1]:02x}{worst[2]:02x}  {r:6.2f}  {need:5.1f}  {'PASS' if ok else 'FAIL'}")
print()
print(f"{len(fails)} failing" if fails else "all pass")
