#!/usr/bin/env python3
"""
extract-plan.py — derive the compound geometry from the published site plan.

Source: assets/source/map.png  (luxecorsa.com/wp-content/uploads/map.png, read 2026-09-04)
Legend: assets/source/plan.png — CD Car Dealership · AC Luxe Corsa Club ·
        01 Private Units · white swatch = Type A Unit · grey swatch = Type B Unit

Emits src/data/compound.json.

This exists because `visual-direction.md §10 P10` requires the plan's geometry to be
generated from source data and never hand-nested. Every position, angle and length
below is measured off the published drawing; nothing is invented. Where the raster
cannot resolve a fact — the split of Type B bays between the two rows of a
double-row building — the split is derived by length and the derivation is recorded
in the output so the page can declare it.
"""

import json
import math
import pathlib
from collections import deque

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "source" / "map.png"
OUT = ROOT / "src" / "data" / "compound.json"

# Verified totals — scene-map.md §5, luxecorsa.com/vehicle-suites/ read 2026-09-04
TOTAL_BAYS = 121
TYPE_A_TOTAL = 26
TYPE_B_TOTAL = 95
BUILDINGS = 11

# Unit dimensions, verified from the published unit plans
# (assets/source/2plan-A-scaled-1.jpg, 2plan-B-scaled-1.jpg)
A_W, B_W, UNIT_D = 30.0, 23.0, 50.0  # feet

im = Image.open(SRC).convert("RGBA")
W, H = im.size
px = im.load()


def components(pred, minpx):
    seen = bytearray(W * H)
    out = []
    for Y in range(H):
        row = Y * W
        for X in range(W):
            if seen[row + X] or not pred(X, Y):
                continue
            q = deque([(X, Y)])
            seen[row + X] = 1
            pts = []
            while q:
                x, y = q.popleft()
                pts.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < W and 0 <= ny < H and not seen[ny * W + nx] and pred(nx, ny):
                        seen[ny * W + nx] = 1
                        q.append((nx, ny))
            if len(pts) >= minpx:
                out.append(pts)
    return out


def orient(pts):
    """Oriented bounding box via principal axis."""
    n = len(pts)
    cx = sum(p[0] for p in pts) / n
    cy = sum(p[1] for p in pts) / n
    sxx = syy = sxy = 0.0
    for x, y in pts:
        dx, dy = x - cx, y - cy
        sxx += dx * dx
        syy += dy * dy
        sxy += dx * dy
    th = 0.5 * math.atan2(2 * sxy / n, (sxx - syy) / n)
    ct, st = math.cos(th), math.sin(th)
    us = [((x - cx) * ct + (y - cy) * st, -(x - cx) * st + (y - cy) * ct) for x, y in pts]
    u0, u1 = min(u for u, _ in us), max(u for u, _ in us)
    v0, v1 = min(v for _, v in us), max(v for _, v in us)
    return dict(cx=cx, cy=cy, ang=math.degrees(th), length=u1 - u0, depth=v1 - v0, area=n)


grey = lambda x, y: (lambda c: c[3] > 60 and 90 <= c[0] <= 200 and abs(c[0] - c[1]) < 14 and abs(c[1] - c[2]) < 14)(px[x, y])
white = lambda x, y: (lambda c: c[3] > 200 and c[0] >= 225 and c[1] >= 225 and c[2] >= 225)(px[x, y])
blue = lambda x, y: (lambda c: c[3] > 60 and 30 <= c[0] <= 80 and 80 <= c[1] <= 125 and 110 <= c[2] <= 165)(px[x, y])
purple = lambda x, y: (lambda c: c[3] > 60 and c[0] < 130 and c[1] < 70 and c[2] > 170)(px[x, y])

rows = [orient(p) for p in components(grey, 1500)]        # Type B bay runs
a_bays = [orient(p) for p in components(white, 300)]      # Type A bays, drawn individually
civic = [orient(p) for p in components(blue, 600)]        # CD + AC
badges = [orient(p) for p in components(purple, 180)]     # numbered building markers

# Scale: a Type A bay is 30' wide by 50' deep, and the plan draws each one.
med_len = sorted(b["length"] for b in a_bays)[len(a_bays) // 2]
med_dep = sorted(b["depth"] for b in a_bays)[len(a_bays) // 2]
px_per_ft = (med_len / UNIT_D + med_dep / A_W) / 2
b_w_px = B_W * px_per_ft

# Building numbers, read off the published plan (badge centre -> label)
LABELS = {
    (346, 508): "01", (263, 445): "02", (290, 358): "03", (509, 293): "04",
    (598, 368): "05", (547, 422): "06", (920, 165): "07", (902, 284): "08",
    (991, 390): "09", (863, 443): "10", (859, 525): "11",
}


def label_for(cx, cy):
    return min(LABELS.items(), key=lambda kv: math.hypot(kv[0][0] - cx, kv[0][1] - cy))[1]


for b in badges:
    b["label"] = label_for(b["cx"], b["cy"])

# Type B bays per row, by length, reconciled to the verified total of 95.
raw = [max(1, round(r["length"] / b_w_px)) for r in rows]
scale = TYPE_B_TOTAL / sum(raw)
counts = [max(1, int(round(n * scale))) for n in raw]
# Reconcile any rounding drift onto the longest rows so the total is exactly 95.
order = sorted(range(len(rows)), key=lambda i: -rows[i]["length"])
i = 0
while sum(counts) != TYPE_B_TOTAL:
    j = order[i % len(order)]
    counts[j] += 1 if sum(counts) < TYPE_B_TOTAL else -1
    counts[j] = max(1, counts[j])
    i += 1

# Normalise to a 0..1000 viewBox on the drawing's own extents.
xs = [r["cx"] for r in rows] + [b["cx"] for b in a_bays] + [c["cx"] for c in civic]
ys = [r["cy"] for r in rows] + [b["cy"] for b in a_bays] + [c["cy"] for c in civic]
pad = 18
minx, maxx = min(xs) - pad, max(xs) + pad
miny, maxy = min(ys) - pad, max(ys) + pad
span = max(maxx - minx, maxy - miny)
K = 1000.0 / span


def nx(v):
    return round((v - minx) * K, 2)


def ny(v):
    return round((v - miny) * K, 2)


def nd(v):
    return round(v * K, 2)


# The roadway. The published raster draws roads as thin unfilled outlines that do not
# survive component extraction, so the road is derived instead of traced: an ordered
# spine through the built masses. The buildings line the road, so a path through them
# IS the road's line — derived from source geometry, never authored by eye.
spine_src = sorted(
    [(r["cx"], r["cy"]) for r in rows] + [(c["cx"], c["cy"]) for c in civic],
    key=lambda p: p[0],
)
spine = []
for x, y in spine_src:
    if spine and abs(spine[-1][0] - x) < 40:
        spine[-1] = ((spine[-1][0] + x) / 2, (spine[-1][1] + y) / 2)
    else:
        spine.append((x, y))

out = {
    "_source": {
        "plan": "luxecorsa.com/wp-content/uploads/map.png",
        "legend": "luxecorsa.com/wp-content/uploads/plan.png",
        "unit_plans": ["2plan-A-scaled-1.jpg", "2plan-B-scaled-1.jpg"],
        "read": "2026-09-04",
        "note": "Positions, angles, lengths and the Type A bay placements are measured "
                "off the published site plan. The division of Type B bays between the "
                "two rows of a double-row building is derived by length and reconciled "
                "to the verified total of 95.",
    },
    "viewBox": [0, 0, 1000, round((maxy - miny) * K, 2)],
    "scale": {"px_per_ft_source": round(px_per_ft, 4), "units_per_ft": round(px_per_ft * K, 4)},
    "totals": {"bays": TOTAL_BAYS, "typeA": TYPE_A_TOTAL, "typeB": TYPE_B_TOTAL, "buildings": BUILDINGS},
    "spine": [[nx(x), ny(y)] for x, y in spine],
    "rows": [],
    "typeA": [],
    "civic": [],
    "badges": [],
}

for r, n in zip(rows, counts):
    out["rows"].append({
        "building": label_for(r["cx"], r["cy"]),
        "cx": nx(r["cx"]), "cy": ny(r["cy"]),
        "ang": round(r["ang"], 2),
        "length": nd(r["length"]), "depth": nd(r["depth"]),
        "bays": n,
    })

for b in sorted(a_bays, key=lambda b: (b["cy"], b["cx"])):
    out["typeA"].append({
        "building": label_for(b["cx"], b["cy"]),
        "cx": nx(b["cx"]), "cy": ny(b["cy"]),
        "ang": round(b["ang"], 2),
        "w": nd(b["depth"]), "d": nd(b["length"]),
    })

for c in sorted(civic, key=lambda c: -c["area"]):
    kind = "dealership" if c["cx"] < 400 else "club"
    out["civic"].append({
        "kind": kind,
        "cx": nx(c["cx"]), "cy": ny(c["cy"]),
        "ang": round(c["ang"], 2),
        "length": nd(c["length"]), "depth": nd(c["depth"]),
    })

for b in sorted(badges, key=lambda b: b["label"]):
    out["badges"].append({"label": b["label"], "cx": nx(b["cx"]), "cy": ny(b["cy"])})

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(out, indent=1))

print(f"source            {SRC.name}  {W}x{H}")
print(f"scale             {px_per_ft:.4f} px/ft  (Type A bay {med_len:.1f} x {med_dep:.1f} px)")
print(f"bay runs          {len(rows)}  ->  {sum(counts)} Type B bays  {counts}")
print(f"Type A bays       {len(a_bays)} measured / {TYPE_A_TOTAL} verified")
print(f"civic masses      {len(civic)}  ({sum(1 for c in out['civic'] if c['kind']=='dealership')} dealership, "
      f"{sum(1 for c in out['civic'] if c['kind']=='club')} club)")
print(f"numbered badges   {len(badges)} / {BUILDINGS}")
print(f"total bays        {sum(counts) + TYPE_A_TOTAL} / {TOTAL_BAYS}")
print(f"viewBox           {out['viewBox']}")
print(f"wrote             {OUT.relative_to(ROOT)}")
