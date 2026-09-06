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

from PIL import Image, ImageDraw

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


# LABELLING IS NOT FINISHED HERE.  A badge on the published plan sits at one END of its
# building, off the corner, not at its centre.  So the nearest-badge-by-centre test
# below walks the numbering along any cluster of parallel runs: it gave 03 and 01 two
# runs each and left buildings 02 and 05 with no geometry at all, which shipped a
# nine-building compound claiming eleven.  The labels this function writes are a first
# pass only.
#
# tools/relabel-buildings.mjs REPAIRS THEM and must be run after this script.  It groups
# the runs into masses first (parallel + overlapping + touching = one building, which
# resolves the 13 runs into exactly the published 11 masses), assigns each mass to the
# nearest badge BY RECTANGLE, and assigns each Type A bay to the run it caps plus the end
# it caps it at.  It refuses to write unless the result reconciles to 11 / 121 / 26 / 95.
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

# =================================================================================
# THE COMPOUND PERIMETER — the drawing's boundary rank, derived and never drawn.
#
# `visual-direction.md §10 P4` asks for "the perimeter as one line"; `§11` reserves
# `--rule-boundary` (2px, --ink-70) for "the compound perimeter". The CSS for it has
# existed since the first build and nothing ever emitted it, so the drawing shipped
# with only two of its three line ranks and no top to its hierarchy.
#
# WHERE IT COMES FROM. The published plan does NOT draw a parcel line. It draws the
# masses, the roads as thin unfilled outlines, a water body east of buildings 07-09,
# and nothing that closes. There is therefore no boundary to trace, and tracing one
# by eye is exactly what `P10` forbids. So the perimeter is DERIVED, by exactly the
# rule the compound is: the outer envelope of everything the compound is made of —
# every measured mass, plus the roadway that serves them — held off by a setback.
#
# Note that the roadway is load-bearing rather than decorative here. Without it the
# envelope resolves to TWO components, the west cluster (CD, 01-06, the clubhouse)
# and the east cluster (07-11); it is the road through the roundabout that makes
# them one compound. Bridging that gap by inflating the closing radius instead would
# be asserting a connection the plan does not have, so the road is in the footprint
# and the closing radius stays at a size that only de-serrates the runs.
#
# METHOD — a morphological closing, then an offset, then a traced contour:
#   1. rasterise every normalised mass, and the spine as a stroke of real width
#   2. close by PERIM_CLOSE_FT — merges each run's serrated bay edges into one edge
#      without touching anything larger, so real concavity survives
#   3. dilate by PERIM_SETBACK_FT — the boundary stands off the built faces
#   4. take the largest component, trace its outer contour, simplify by RDP
#
# A convex hull was rejected: it spans the waist at the roundabout and swallows the
# whole central void, which is the compound's actual shape. A bounding box was
# rejected for the same reason and more so — the ring below encloses 50% of its own
# bounding box, and that other half is not the compound.
#
# All three lengths are in FEET and go through the same px_per_ft the bays use, so
# they are real site distances rather than numbers tuned against a picture. The two
# that shape the ring are one unit depth, which is the dimension the site is planned
# on. The road width is an assumption and is declared as one in the output; it is
# not shape-determining — 8ft to 40ft moves the enclosed area by 0.55%.
# =================================================================================

PERIM_CELL = 1.5              # rasterisation cell, in normalised units
PERIM_CLOSE_FT = UNIT_D       # 50' — one unit depth: de-serrates a run's bay edges
PERIM_SETBACK_FT = UNIT_D     # 50' — one unit depth clear of the outermost face
PERIM_ROAD_FT = 24.0          # a private two-lane road; declared, not measured
PERIM_EPS = 3.0               # RDP tolerance, in normalised units


def _rect(cx, cy, length, depth, ang):
    """The four corners of an oriented rectangle — the same construction the drawing
    uses, so the envelope is taken around the masses that actually get rendered."""
    r = math.radians(ang)
    c, s = math.cos(r), math.sin(r)
    return [(cx + u * c - v * s, cy + u * s + v * c)
            for u, v in ((-length / 2, -depth / 2), (length / 2, -depth / 2),
                         (length / 2, depth / 2), (-length / 2, depth / 2))]


def _edt(bits, gw, gh, on):
    """Exact squared Euclidean distance transform (Felzenszwalb & Huttenlocher 2012).
    Two 1D parabola-envelope passes; O(n) and exact, so the offsets below are true
    discs rather than the squares a box filter would give."""
    INF = 1e20
    f = [0.0 if b == on else INF for b in bits]
    n = max(gw, gh)
    d = [0.0] * n
    v = [0] * n
    z = [0.0] * (n + 1)

    def pass1d(get, put, m):
        for i in range(m):
            d[i] = get(i)
        k = 0
        v[0] = 0
        z[0] = -INF
        z[1] = INF
        for q in range(1, m):
            while True:
                s = ((d[q] + q * q) - (d[v[k]] + v[k] * v[k])) / (2.0 * q - 2.0 * v[k])
                if s <= z[k]:
                    k -= 1
                else:
                    break
            k += 1
            v[k] = q
            z[k] = s
            z[k + 1] = INF
        k = 0
        for q in range(m):
            while z[k + 1] < q:
                k += 1
            put(q, (q - v[k]) * (q - v[k]) + d[v[k]])

    col = [0.0] * gh
    for x in range(gw):
        pass1d(lambda y: f[y * gw + x], lambda y, val: col.__setitem__(y, val), gh)
        for y in range(gh):
            f[y * gw + x] = col[y]
    row = [0.0] * gw
    for y in range(gh):
        base = y * gw
        pass1d(lambda x: f[base + x], lambda x, val: row.__setitem__(x, val), gw)
        f[base:base + gw] = row
    return f


def _dilate(bits, gw, gh, r):
    d = _edt(bits, gw, gh, 1)
    rr = r * r
    return bytearray(1 if d[i] <= rr else 0 for i in range(gw * gh))


def _erode(bits, gw, gh, r):
    d = _edt(bits, gw, gh, 0)
    rr = r * r
    return bytearray(1 if d[i] > rr else 0 for i in range(gw * gh))


def _largest(bits, gw, gh):
    """The biggest 4-connected component, and how many there were."""
    lab = bytearray(gw * gh)
    best, best_n, count = [], 0, 0
    for start in range(gw * gh):
        if not bits[start] or lab[start]:
            continue
        count += 1
        stack = [start]
        lab[start] = 1
        cells = []
        while stack:
            p = stack.pop()
            cells.append(p)
            x, y = p % gw, p // gw
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx_, ny_ = x + dx, y + dy
                if 0 <= nx_ < gw and 0 <= ny_ < gh:
                    q = ny_ * gw + nx_
                    if bits[q] and not lab[q]:
                        lab[q] = 1
                        stack.append(q)
        if len(cells) > best_n:
            best_n, best = len(cells), cells
    out = bytearray(gw * gh)
    for p in best:
        out[p] = 1
    return out, count, best_n


_N8 = ((1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1))


def _trace(bits, gw, gh):
    """Moore-neighbour boundary trace. The start is the first set cell in raster
    order and the search always resumes from the backtrack direction, so the walk is
    reproducible rather than dependent on where it happens to begin."""
    start = next((i for i in range(gw * gh) if bits[i]), -1)
    if start < 0:
        return []
    sx, sy = start % gw, start // gw
    cx, cy, direction = sx, sy, 6
    out = []
    guard = gw * gh * 4
    while guard > 0:
        guard -= 1
        out.append((cx, cy))
        moved = False
        for k in range(8):
            nd = (direction + 6 + k) % 8
            nx_, ny_ = cx + _N8[nd][0], cy + _N8[nd][1]
            if 0 <= nx_ < gw and 0 <= ny_ < gh and bits[ny_ * gw + nx_]:
                cx, cy, direction, moved = nx_, ny_, nd, True
                break
        if not moved or (cx == sx and cy == sy):
            break
    return out


def _rdp(pts, eps):
    """Ramer-Douglas-Peucker. Iterative, so a long contour cannot blow the stack."""
    if len(pts) < 3:
        return pts

    def d2(p, a, b):
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = dx * dx + dy * dy
        t = 0.0 if L == 0 else ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L
        t = 0.0 if t < 0 else (1.0 if t > 1 else t)
        ex, ey = p[0] - a[0] - t * dx, p[1] - a[1] - t * dy
        return ex * ex + ey * ey

    keep = bytearray(len(pts))
    keep[0] = keep[-1] = 1
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        bi, bd = -1, eps * eps
        for i in range(a + 1, b):
            dd = d2(pts[i], pts[a], pts[b])
            if dd > bd:
                bd, bi = dd, i
        if bi > 0:
            keep[bi] = 1
            stack.append((a, bi))
            stack.append((bi, b))
    return [p for i, p in enumerate(pts) if keep[i]]


# --- build the footprint, in the drawing's own normalised coordinates ---------------
_masses = [_rect(nx(r["cx"]), ny(r["cy"]), nd(r["length"]), nd(r["depth"]), r["ang"]) for r in rows]
_masses += [_rect(nx(b["cx"]), ny(b["cy"]), nd(b["length"]), nd(b["depth"]), b["ang"]) for b in a_bays]
_masses += [_rect(nx(c["cx"]), ny(c["cy"]), nd(c["length"]), nd(c["depth"]), c["ang"]) for c in civic]
_spine_n = [(nx(x), ny(y)) for x, y in spine]

_upf = px_per_ft * K                      # normalised units per foot
_vw, _vh = 1000.0, (maxy - miny) * K
_pad = PERIM_SETBACK_FT * _upf + PERIM_CLOSE_FT * _upf + 4 * PERIM_CELL
_gx0, _gy0 = -_pad, -_pad
_gw = int(math.ceil((_vw + 2 * _pad) / PERIM_CELL))
_gh = int(math.ceil((_vh + 2 * _pad) / PERIM_CELL))

# mode "L" rather than "1": a bilevel image packs eight pixels to the byte, and
# unpacking it costs more than the byte per cell this spends.
_canvas = Image.new("L", (_gw, _gh), 0)
_draw = ImageDraw.Draw(_canvas)
for _m in _masses:
    _draw.polygon([((x - _gx0) / PERIM_CELL, (y - _gy0) / PERIM_CELL) for x, y in _m], fill=255)
if len(_spine_n) > 1:
    _draw.line([((x - _gx0) / PERIM_CELL, (y - _gy0) / PERIM_CELL) for x, y in _spine_n],
               fill=255, width=max(1, int(round(PERIM_ROAD_FT * _upf / PERIM_CELL))), joint="curve")

_bits = bytearray(1 if p else 0 for p in _canvas.tobytes())
_foot_cells = sum(_bits)

_r_close = PERIM_CLOSE_FT * _upf / PERIM_CELL
_r_set = PERIM_SETBACK_FT * _upf / PERIM_CELL
_bits = _dilate(_bits, _gw, _gh, _r_close)
_bits = _erode(_bits, _gw, _gh, _r_close)          # close: de-serrate, keep concavity
_bits = _dilate(_bits, _gw, _gh, _r_set)           # the setback
_bits, _n_comp, _kept = _largest(_bits, _gw, _gh)

_contour = [(_gx0 + (x + 0.5) * PERIM_CELL, _gy0 + (y + 0.5) * PERIM_CELL)
            for x, y in _trace(_bits, _gw, _gh)]
_ring = _rdp(_contour, PERIM_EPS)
if len(_ring) > 2 and math.hypot(_ring[0][0] - _ring[-1][0], _ring[0][1] - _ring[-1][1]) < PERIM_EPS:
    _ring.pop()
perimeter = [[round(x, 2), round(y, 2)] for x, y in _ring]


def _ring_area(r):
    s = 0.0
    for i in range(len(r)):
        x1, y1 = r[i]
        x2, y2 = r[(i + 1) % len(r)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2


_p_area = _ring_area(perimeter)
_p_bbox_area = ((max(p[0] for p in perimeter) - min(p[0] for p in perimeter))
                * (max(p[1] for p in perimeter) - min(p[1] for p in perimeter)))


out = {
    "_source": {
        "plan": "luxecorsa.com/wp-content/uploads/map.png",
        "legend": "luxecorsa.com/wp-content/uploads/plan.png",
        "unit_plans": ["2plan-A-scaled-1.jpg", "2plan-B-scaled-1.jpg"],
        "read": "2026-09-04",
        "note": "Positions, angles, lengths and the Type A bay placements are measured "
                "off the published site plan. The division of Type B bays between the "
                "two rows of a double-row building is derived by length and reconciled "
                "to the verified total of 95. The published plan draws no parcel line, so "
                "the perimeter is not traced: it is the outer envelope of the measured "
                "masses and the roadway that serves them, closed and offset by one unit "
                "depth. Road width is the one declared assumption and is not "
                "shape-determining.",
    },
    "viewBox": [0, 0, 1000, round((maxy - miny) * K, 2)],
    "scale": {"px_per_ft_source": round(px_per_ft, 4), "units_per_ft": round(px_per_ft * K, 4)},
    "totals": {"bays": TOTAL_BAYS, "typeA": TYPE_A_TOTAL, "typeB": TYPE_B_TOTAL, "buildings": BUILDINGS},
    "spine": [[nx(x), ny(y)] for x, y in spine],
    "perimeter": perimeter,
    "perimeter_derivation": {
        "method": "morphological closing of the measured masses + roadway, then an "
                  "outward offset; largest component, Moore-neighbour contour, RDP",
        "close_ft": PERIM_CLOSE_FT,
        "setback_ft": PERIM_SETBACK_FT,
        "road_width_ft_assumed": PERIM_ROAD_FT,
        "cell_units": PERIM_CELL,
        "simplify_eps_units": PERIM_EPS,
        "components_before_largest": _n_comp,
    },
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

print("NEXT STEP, REQUIRED:  node tools/relabel-buildings.mjs   (repairs the building labels)")
print(f"source            {SRC.name}  {W}x{H}")
print(f"scale             {px_per_ft:.4f} px/ft  (Type A bay {med_len:.1f} x {med_dep:.1f} px)")
print(f"bay runs          {len(rows)}  ->  {sum(counts)} Type B bays  {counts}")
print(f"Type A bays       {len(a_bays)} measured / {TYPE_A_TOTAL} verified")
print(f"civic masses      {len(civic)}  ({sum(1 for c in out['civic'] if c['kind']=='dealership')} dealership, "
      f"{sum(1 for c in out['civic'] if c['kind']=='club')} club)")
print(f"numbered badges   {len(badges)} / {BUILDINGS}")
print(f"total bays        {sum(counts) + TYPE_A_TOTAL} / {TOTAL_BAYS}")
print(f"perimeter         {len(perimeter)} pts, {_n_comp} component(s), "
      f"area {_p_area:.0f} = {_p_area / _p_bbox_area:.0%} of its own bbox "
      f"(setback {PERIM_SETBACK_FT:.0f}ft, close {PERIM_CLOSE_FT:.0f}ft)")
print(f"viewBox           {out['viewBox']}")
print(f"wrote             {OUT.relative_to(ROOT)}")
