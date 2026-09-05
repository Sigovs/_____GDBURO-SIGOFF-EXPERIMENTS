#!/usr/bin/env python3
"""
build-frames.py — author the page's photographic frames from the source library.

Every frame that ships is derived here, from a declared source, by a declared crop.
Nothing is cropped by the browser: `visual-direction.md IM4` and `motion-dna.md I3`
both require crops to be authored per breakpoint, so each frame is emitted at a
landscape and a portrait aspect from *different* crop boxes, not from one box scaled.

Three rules this file exists to enforce:

  IM1  one grade across the whole library — one black point, one contrast curve,
       one temperature per register (cool for the compound, warm for the club).
  IM2  the black point is lifted to --void (#07080A), never to zero. Crushed blacks
       throw away the gradient of information the light behaviour depends on.
  --   no third-party trademark ships. The source renders carry manufacturer marks
       on their back walls; every crop box below is chosen to exclude them, and the
       exclusion is the first constraint on the crop, not an afterthought.

Crop boxes are fractions of the source frame: (left, top, right, bottom).
"""

import json
import pathlib

from PIL import Image, ImageEnhance

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "source"
OUT = ROOT / "assets" / "img"

VOID = (0x07, 0x08, 0x0A)  # --void, the black point of every photograph

# Registers. IM1: one temperature per register, applied identically to every frame in it.
# `exposure` pulls the whole frame down so a photograph sits *in* a --ground page
# rather than glowing out of it; `lift` then raises the black point back to --void so
# the shadows keep a gradient of information in them (IM2).
COOL = dict(mul=(0.93, 0.99, 1.08), sat=0.42, contrast=1.22, exposure=0.62, black=VOID, lift=0.030)
WARM = dict(mul=(1.07, 1.00, 0.88), sat=0.60, contrast=1.16, exposure=0.70, black=VOID, lift=0.042)

# Per-frame exposure trim. This is NOT a second grade and it does not weaken `IM1`:
# the look is one look, and a trim is what puts a differently-exposed source ONTO it.
# A colourist matches shots to a look; they do not apply identical numbers to
# differently-exposed negatives and call the result consistent. Only frames whose
# source sits far off the register's own curve get one, and each says why.
TRIM = {
    # A daylit white-panelled interior. At the register's own 0.62 it renders around
    # #67696b and sits ON TOP of a --ground page instead of inside it, which is the
    # one thing the exposure value exists to prevent.
    "act03/delivered": 0.58,
}

# name, source, register, landscape crop, portrait crop, caption, origin
#
# Every crop below is architecture-dominant. `A1`/`A2` bind hard here: the source
# library is a set of car-hero renders, and a car-hero crop of a car-hero render is
# the one thing this page may not ship. Where a render offers no architectural crop
# free of a manufacturer mark, the frame is not taken from it at all — it is listed
# in MISSING and authored as a declared stand-in instead.
FRAMES = [
    # ---- act 03 - THE SUITE - the peak. One locked camera, four states. ----------
    # GARAGE: the room with cars in it. Crop holds the ceiling, the wall plane and the
    # doors, and lets the cars sit low in frame as occupants. Excludes every badge.
    # The cars must be IN this frame - "what it holds, at true proportion" is the
    # state's whole truth, and a crop that loses them delivers nothing. Held wide and
    # high so the room stays dominant and the cars read as occupants (A1), and stopped
    # above the grille line so no badge is legible.
    ("act03/garage", "Scene-18_1-scaled.jpg", COOL,
     (0.16, 0.04, 0.94, 0.84), (0.34, 0.02, 0.92, 0.94),
     "SUITE INTERIOR, OCCUPIED - DEVELOPER RENDER", "render"),

    # LOUNGE: the suite's own mezzanine, finished out and occupied - so the frame has
    # to hold BOTH levels, or it reads as a clubhouse rather than as the second storey
    # of this room. The Ferrari banner and the Porsche shield both sit left of 0.42 in
    # the source and are cropped away entirely.
    ("act03/lounge", "Scene-12_1-scaled.jpg", COOL,
     (0.42, 0.02, 1.00, 1.00), (0.52, 0.00, 1.00, 1.00),
     "MEZZANINE, FINISHED - DEVELOPER RENDER", "render"),

    # PERSONALIZED: one owner's version. Staircase, mezzanine soffit, machines below.
    ("act03/personalized", "Scene-14_1-scaled.jpg", COOL,
     (0.00, 0.06, 0.62, 1.00), (0.04, 0.04, 0.52, 1.00),
     "OWNER FIT-OUT - DEVELOPER RENDER", "render"),

    # ---- act 04 - MACHINE / SPACE. Macro: material, not vehicle. -----------------
    # The one true material read in the library: a stone plane under a grazing LED.
    ("act04/graze", "Scene-18_1-scaled.jpg", COOL,
     (0.00, 0.22, 0.34, 0.56), (0.02, 0.20, 0.26, 0.62),
     "GRAZING LIGHT ACROSS A STONE PLANE", "render"),

    # ---- act 05 - THE CLUB. The only warm frames on the page. --------------------
    ("act05/lounge", "Scene-17_1-scaled.jpg", WARM,
     (0.00, 0.00, 0.86, 1.00), (0.14, 0.00, 0.66, 1.00),
     "CLUBHOUSE LOUNGE - DEVELOPER RENDER", "render"),
    ("act05/bar", "Scene-21-scaled.jpg", WARM,
     (0.00, 0.00, 0.72, 1.00), (0.04, 0.00, 0.56, 1.00),
     "ROOFTOP BAR AND LOUNGE - DEVELOPER RENDER", "render"),
    ("act05/business", "Scene-16_1-scaled.jpg", WARM,
     (0.10, 0.00, 1.00, 1.00), (0.30, 0.00, 0.86, 1.00),
     "BUSINESS AND EVENT SPACE - DEVELOPER RENDER", "render"),
]

# ---------------------------------------------------------------------------------
# Frames the published library does not contain, authored as DECLARED STAND-INS.
#
# `GI1` origin declared before generation; `GI3` none of these depicts the real
# Luxe Corsa premises — each is neutral architecture matching the storyboard's
# composition, lighting direction and tonal mass, and nothing more; `GI4` no baked-in
# type or UI in any frame; `GI6` provenance travels with the file, in ASSETS.md and in
# frames.json. They carry the same grade as the rest of the library so the page reads
# as one compound, and every one of them is captioned as a stand-in in the render.
#
# These are stand-ins in exactly the sense visual-direction.md §4 already uses for the
# typefaces: a declared placeholder that the real article replaces without the page
# being restructured around it.
# The prompt is part of the provenance and travels with the file (`GI2`, `GI6`).
# Prompts are derived from keyframe-storyboard.md and scene-map.md, not written from
# taste. The four entries marked `not recorded` predate this table: they were generated
# on 2026-09-04 and their prompts were not captured at the time, which is a provenance
# gap rather than a missing nicety, and it is recorded as one in ASSETS.md.
PROMPTS = {
    "gen-perimeter.jpg": "not recorded (generated 2026-09-04)",
    "gen-frontage.jpg": "not recorded (generated 2026-09-04)",
    "gen-floor.jpg": "not recorded (generated 2026-09-04)",
    "gen-seal.jpg": "not recorded (generated 2026-09-04)",
    "gen-roadway.jpg": "not recorded (generated 2026-09-04)",
    "gen-delivered.jpg": "not recorded (generated 2026-09-04) - superseded by gen-delivered-mezz.jpg",

    "gen-delivered-mezz.jpg": (
        "Wide architectural interior photograph, eye level, tripod height, taken from "
        "just inside the doorway of an empty private vehicle suite. A tall "
        "commercial-grade insulated overhead sectional door is open at the left, "
        "daylight spilling across a sealed pale concrete floor. The room is deep and "
        "empty. Along the back third a mezzanine level spans the full width at about "
        "half the room's height, supported on blackened steel, with a solid wood "
        "staircase and simple wood railings rising to it against the right hand wall. "
        "Insulated white wall and ceiling panels, exposed linear LED fittings running "
        "the length of the ceiling, cool 4000K. One pedestrian door in the side wall. "
        "No vehicles, no furniture, no people, no text, no signage, no logos, no "
        "numbers. Deep shadow with detail retained under the mezzanine, black point "
        "lifted, no crushed blacks. Restrained, quiet, cinematic industrial, "
        "architectural. Photographic, 28mm, level horizon."
    ),
    "gen-community.jpg": (
        "Wide architectural interior photograph, eye level, tripod height, of a "
        "private members' clubhouse lounge inside an automotive compound. Four or five "
        "adults in unremarkable smart-casual clothing stand and sit in loose "
        "conversation in the middle distance, seen from behind and in three-quarter "
        "view, faces not readable, occupying the space naturally rather than posing. "
        "Warm 2700K interior lighting from concealed linear fittings and low table "
        "lamps, one identifiable key direction from the left. Full-height dark-framed "
        "glazing across the right of the frame looks out onto a cool blue-white lit row "
        "of closed insulated overhead vehicle doors in a covered roadway, so the "
        "storage building reads clearly through the glass. Materials: dark stained oak, "
        "blackened steel, brushed concrete, wool upholstery. Deep shadow with detail "
        "retained, black point lifted, no crushed blacks. No text, no signage, no "
        "logos, no brand marks, no screens showing content, no vehicles visible, no "
        "crowd, no event, no party, no stage. Restrained, quiet, cinematic industrial. "
        "Photographic, 35mm, natural depth of field."
    ),
}

MODEL = "fal-ai/nano-banana-pro"   # one model for the whole stand-in library (IM1)

STANDINS = [
    ("act00/perimeter", "gen-perimeter.jpg", COOL,
     (0.00, 0.00, 1.00, 1.00), (0.30, 0.00, 1.00, 1.00),
     "PERIMETER AT NIGHT - STAND-IN, NOT THE PROPERTY", "standin"),
    ("act01/frontage", "gen-frontage.jpg", COOL,
     (0.00, 0.00, 1.00, 1.00), (0.22, 0.00, 0.86, 1.00),
     "INTERNAL FRONTAGE - STAND-IN, NOT THE PROPERTY", "standin"),
    # DELIVERED, regenerated 2026-09-05. The first pass showed a plain empty bay with
    # no second level in it, which left the peak without the secondary mass Frame E
    # names — and left the 1,863 / 2,430 sq ft figures, which are mezzanine-inclusive,
    # unsupported by anything on screen. This frame carries the mezzanine band, the
    # blackened-steel structure under it and the wood staircase and railings, all of
    # which are VERIFIED features of the product (spec-08). Nothing architectural is
    # invented; what is generated is the room, not the facts.
    ("act03/delivered", "gen-delivered-mezz.jpg", COOL,
     (0.00, 0.00, 1.00, 1.00), (0.22, 0.00, 0.86, 1.00),
     "SUITE AS DELIVERED - STAND-IN, NOT THE PROPERTY", "standin"),
    ("act04/floor", "gen-floor.jpg", COOL,
     (0.00, 0.00, 1.00, 1.00), (0.24, 0.00, 0.80, 1.00),
     "SEALED FLOOR - STAND-IN, NOT THE PROPERTY", "standin"),
    ("act04/seal", "gen-seal.jpg", COOL,
     (0.00, 0.00, 1.00, 1.00), (0.24, 0.00, 0.80, 1.00),
     "DOOR SEAL AT FLOOR - STAND-IN, NOT THE PROPERTY", "standin"),
    # act 05's lead frame. The published club renders are unoccupied, so the act's own
    # argument - "the paddock has people in it" - had nothing on screen supporting it,
    # and the adjacency the act depends on (the machines are through the glass) was
    # not composed anywhere in the library either. This frame carries both: figures at
    # conversational distance occupying the room, and the compound's closed overhead
    # doors reading cool through full-height glazing on the right. WARM register, so
    # the temperature change at the 04 -> 05 seam still lands.
    #
    # GI3: the figures are synthetic and depict no real person; the architecture is
    # neutral and depicts no real premises. GI4: no type, signage, logo or screen
    # content in frame.
    ("act05/community", "gen-community.jpg", WARM,
     (0.00, 0.00, 1.00, 1.00), (0.26, 0.00, 0.90, 1.00),
     "CLUB INTERIOR, THE COMPOUND BEYOND - STAND-IN, NOT THE PROPERTY", "standin"),
    ("act07/roadway", "gen-roadway.jpg", COOL,
     (0.00, 0.00, 1.00, 1.00), (0.24, 0.00, 0.88, 1.00),
     "ONE DOOR OPEN - STAND-IN, NOT THE PROPERTY", "standin"),
]
FRAMES = FRAMES + STANDINS

WIDTHS_LS = [2200, 1600, 1100, 760]
WIDTHS_PT = [900, 640]
AR_LS, AR_PT = 16 / 9, 3 / 4


def grade(im, reg):
    """One curve, applied identically inside a register."""
    r, g, b = im.split()[:3]
    mr, mg, mb = reg["mul"]
    im = Image.merge("RGB", (
        r.point(lambda v: min(255, int(v * mr))),
        g.point(lambda v: min(255, int(v * mg))),
        b.point(lambda v: min(255, int(v * mb))),
    ))
    im = ImageEnhance.Brightness(im).enhance(reg["exposure"] * reg.get("_trim", 1.0))
    im = ImageEnhance.Color(im).enhance(reg["sat"])
    im = ImageEnhance.Contrast(im).enhance(reg["contrast"])

    # IM2 — lift the black point to --void and pull the top end down a touch, so the
    # darkness keeps a gradient of information in it instead of clipping to nothing.
    lift = reg["lift"]
    bp = reg["black"]

    def curve(v, floor):
        v = v / 255.0
        v = v * (1.0 - lift) + lift          # compress into the lifted range
        return int(max(floor, min(255, v * 255)))

    ch = []
    for i, chan in enumerate(im.split()):
        ch.append(chan.point(lambda v, f=bp[i]: curve(v, f)))
    return Image.merge("RGB", ch)


def cut(im, box, ar, width):
    """Crop to a declared box, then trim that box to the target aspect from its centre."""
    W, H = im.size
    l, t, r, b = box
    c = im.crop((int(l * W), int(t * H), int(r * W), int(b * H)))
    cw, chh = c.size
    if cw / chh > ar:
        nw = int(chh * ar)
        c = c.crop(((cw - nw) // 2, 0, (cw - nw) // 2 + nw, chh))
    else:
        nh = int(cw / ar)
        c = c.crop((0, (chh - nh) // 2, cw, (chh - nh) // 2 + nh))
    return c.resize((width, int(width / ar)), Image.LANCZOS)


def avg_hex(im):
    s = im.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    return "#%02x%02x%02x" % s[:3]


manifest = {}
for name, src, reg, box_ls, box_pt, caption, origin in FRAMES:
    p = SRC / src
    if not p.exists():
        print(f"  MISSING SOURCE  {src}")
        continue
    base = Image.open(p).convert("RGB")
    g = grade(base, {**reg, "_trim": TRIM.get(name, 1.0)})
    (OUT / name).parent.mkdir(parents=True, exist_ok=True)

    entry = {"caption": caption, "origin": origin, "source": src,
             "register": "warm" if reg is WARM else "cool",
             "crop_landscape": box_ls, "crop_portrait": box_pt,
             "landscape": [], "portrait": []}

    for w in WIDTHS_LS:
        im = cut(g, box_ls, AR_LS, w)
        f = OUT / f"{name}-{w}.jpg"
        im.save(f, quality=82, optimize=True, progressive=True)
        entry["landscape"].append({"w": w, "file": str(f.relative_to(ROOT)),
                                   "kb": round(f.stat().st_size / 1024, 1)})
        if w == WIDTHS_LS[0]:
            entry["tone"] = avg_hex(im)
    for w in WIDTHS_PT:
        im = cut(g, box_pt, AR_PT, w)
        f = OUT / f"{name}-p{w}.jpg"
        im.save(f, quality=82, optimize=True, progressive=True)
        entry["portrait"].append({"w": w, "file": str(f.relative_to(ROOT)),
                                  "kb": round(f.stat().st_size / 1024, 1)})
    manifest[name] = entry
    big = max(e["kb"] for e in entry["landscape"])
    print(f"  {name:24s} {entry['register']:5s} tone {entry['tone']}  largest {big:6.1f}KB")

(ROOT / "src" / "data").mkdir(parents=True, exist_ok=True)
(ROOT / "src" / "data" / "frames.json").write_text(json.dumps(manifest, indent=1))
allkb = [e["kb"] for v in manifest.values() for e in v["landscape"] + v["portrait"]]
print(f"\n{len(manifest)} frames · {sum(allkb)/1024:.2f}MB total · largest single {max(allkb):.1f}KB "
      f"(budget: 700KB)")
