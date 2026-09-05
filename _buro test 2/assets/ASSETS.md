# ASSETS — provenance ledger

Every image that ships on this page, where it came from, and what may be claimed about
it. Governed by `generated-imagery` (`GI1`–`GI8`), `content-provenance` (`CP1`–`CP7`)
and `visual-direction.md §9` (`IM1`–`IM7`).

**The rule this file exists to enforce:** a render is never presented as a photograph,
and a stand-in is never presented as the property. Both are labelled in the rendered
page, not only here — `CP5`/`IM7` make the render the reader's evidence, not the ledger.

Captured **2026-09-04** from `luxecorsa.com`. Rebuild everything with:

```
python3 tools/extract-plan.py     # compound geometry  -> src/data/compound.json
python3 tools/build-frames.py     # photographic frames -> assets/img/, src/data/frames.json
```

---

## 1. Origin classes

| Class | What it means | How the page labels it |
|---|---|---|
| `render` | A developer visualisation published by Luxe Corsa. Depicts the real proposition, but it is a render and not a photograph. | Caption ends `DEVELOPER RENDER` |
| `standin` | Generated here. Neutral architecture matching the storyboard's composition, light direction and tonal mass. **Depicts no real place.** | Caption ends `STAND-IN, NOT THE PROPERTY` |
| `drawing` | Measured from published architectural artwork. | Cited in the record |

There is **no `photo` class on this page yet**, and that is the honest state: Luxe Corsa
publishes no photography of the built compound. Tier 1 of
[scene-map.md §8](../docs/scene-map.md) still stands unmet.

---

## 2. Reused Luxe Corsa material

Source files are kept unmodified in `assets/source/`. Every shipped frame is derived
from one of them by a declared crop in `tools/build-frames.py`.

| Frame | Source file | Origin | Act | Crop chosen to exclude |
|---|---|---|---|---|
| `act03/garage` | `Scene-18_1-scaled.jpg` | render | 03 · GARAGE | manufacturer badges below the grille line |
| `act03/lounge` | `Scene-12_1-scaled.jpg` | render | 03 · LOUNGE | Ferrari banner and Porsche shield, both left of 0.42 |
| `act03/personalized` | `Scene-14_1-scaled.jpg` | render | 03 · PERSONALIZED | Porsche wall graphic, right of 0.62 |
| `act04/graze` | `Scene-18_1-scaled.jpg` | render | 04 | — (stone plane and LED graze only) |
| `act05/lounge` | `Scene-17_1-scaled.jpg` | render | 05 | — |
| `act05/bar` | `Scene-21-scaled.jpg` | render | 05 | — |
| `act05/business` | `Scene-16_1-scaled.jpg` | render | — | **Built but no longer on the page** since 2026-09-05: act 05 recomposed to one dominant frame and two subordinates, and the meeting room was the least community-bearing of the three. The amenity is still named in act 05's list and in act 06. The frame is kept built so restoring it is a markup change |

**No third-party trademark ships.** The source renders carry Porsche, Ferrari,
Lamborghini, Tesla and Bugatti marks on their back walls and on the vehicles. Excluding
them was the **first** constraint on every crop above, ahead of composition — a crop
that composed well and kept a shield was rejected.

Sources downloaded but **not** shipped, with the reason:

| File | Why not |
|---|---|
| `Scene-5_1-scaled.jpg`, `Scene-8_1-scaled.jpg`, `Scene-9_1-scaled.jpg`, `inter2-scaled.jpg` | Manufacturer shields occupy the back wall across the full width; no architectural crop survives without one |
| `inter1.png` | Near-duplicate of `Scene-17`, which crops better |
| `site-plan.png`, `site-plan-m.png` | Misnamed on the source site — a Monaco street-circuit banner, not a site plan. Depicts a real public place unrelated to the proposition |
| `map.png`, `plan.png` | Not shipped as images. **Consumed as data** — see §4 |
| `2plan-A…`, `2plan-B…` | Not shipped as images. Consumed as dimensions — see §4 |

---

## 3. Declared stand-ins

Generated with `fal-ai/nano-banana-pro`, 2K, 16:9 — one model for the whole stand-in
library, so the set grades as one (`IM1`).

**Prompts live in `PROMPTS` in `tools/build-frames.py`**, derived from
[keyframe-storyboard.md](../docs/keyframe-storyboard.md) and
[scene-map.md](../docs/scene-map.md) rather than written from taste (`GI2`).

> **A provenance gap, recorded rather than papered over.** This file previously claimed
> the prompts were recorded beside each entry. **They were not** — no prompt for the six
> frames generated on 2026-09-04 was captured anywhere, and they cannot be reconstructed.
> `PROMPTS` now exists and those six are marked `not recorded`. The two frames generated
> on 2026-09-05 carry their full prompts. `GI6` requires provenance to travel with the
> file; for six frames it did not, and re-shooting is the only way to close it.

| Frame | Act | What it stands in for | Why it was generated |
|---|---|---|---|
| `act00/perimeter` | 00 | The perimeter at night, one aperture lit | Tier 1 #4. No exterior of the compound is published |
| `act01/frontage` | 01 | The internal frontage, doors both sides | Tier 1 #3. No frontage plate is published |
| `act03/delivered` | 03 · DELIVERED | The suite as handed over, empty, **with its mezzanine and wood staircase** | Tier 1 #1. Every published render already has cars in it. **Regenerated 2026-09-05**: the first pass showed a plain empty bay with no second level, which left Frame E without its secondary mass and left the mezzanine-inclusive sq-ft figures unsupported by anything on screen. The mezzanine, the blackened-steel structure and the wood staircase are all verified product features (`spec-08`) — the room is generated, the facts are not |
| `act05/community` | 05 | The club with people in it, and the compound through the glass | **New 2026-09-05.** Every published club render is unoccupied, so the act's own argument — *the paddock has people in it* — had nothing on screen supporting it, and the adjacency it depends on was composed nowhere in the library. `GI3`: the figures are synthetic and depict no real person; the architecture is neutral and depicts no real premises |
| `act04/floor` | 04 | Sealed floor meeting a column base | Tier 2 #6. No macro material exists in the library |
| `act04/seal` | 04 | Door seal meeting the floor | Tier 2 #6 |
| `act07/roadway` | 07 | The roadway with one door open | Tier 2 #8 |

**What these images are not.** None depicts the Luxe Corsa property, its architecture,
its site or its finishes as fact (`GI3`). They carry the storyboard's composition,
lighting direction and tonal mass and nothing else. None contains type, UI, signage or
a legible number (`GI4`). Each is captioned in the page as a stand-in.

**They are stand-ins in exactly the sense [visual-direction.md §4](../docs/visual-direction.md)
already uses for the typefaces** — Archivo and IBM Plex Mono stand in for ABC Diatype
until it is licensed, and these stand in until the compound is shot. The image system is
keyed by frame name, so replacing one is a file swap plus a caption change in
`build-frames.py`; **no markup changes and no layout is arranged around a stand-in.**

---

## 4. Material consumed as data, not shipped as pictures

| Source | What was taken | Where it went |
|---|---|---|
| `map.png` — the published site plan | 13 bay runs, 26 Type A bay positions, 1 dealership mass, 2 club masses, 11 numbered buildings, each with position, angle, length and depth | `src/data/compound.json`, via `tools/extract-plan.py` |
| `plan.png` — the plan legend | `CD` Car Dealership · `AC` Luxe Corsa Club · `01` Private Units · **white = Type A**, **grey = Type B** | The drawing's own light-and-value language |
| `2plan-A-scaled-1.jpg` | 30′ × 50′, mezzanine 30′ × 31′, 1,500 SF + 930 SF, 6 cars drawn | The A↔B diagram and the spec plate |
| `2plan-B-scaled-1.jpg` | 23′ × 50′, mezzanine 23′ × 31′, 1,150 SF + 713 SF, 4 cars drawn | ″ |

The extraction reconciles to every published total independently: **26 Type A + 95
Type B = 121 bays across 11 buildings.** That is the strongest available evidence that
the drawing is the real compound and not a decorative approximation.

**The one derived figure**, declared in `compound.json` and in the page: how the 95
Type B bays divide between the two rows of a double-row building. The published raster
is 1296px wide and cannot resolve it, so it is apportioned by measured row length and
reconciled to the verified total. Every other number on the drawing is measured.

---

## 5. Grade

One grade across the library (`IM1`), applied by register, in `tools/build-frames.py`:

| Register | Acts | Temperature | Exposure | Saturation |
|---|---|---|---|---|
| `cool` | 00 · 01 · 03 · 04 · 07 | ≈4000K, blue-lifted | 0.62 | 0.42 |
| `warm` | 05 | ≈2700K, red-lifted | 0.70 | 0.60 |

The black point is lifted to `--void` `#07080A` and never to zero (`IM2`), so the
shadows keep the gradient of information the light behaviour depends on. No grain, no
halation, no vignette, no chromatic aberration (`IM6`).

Crops are authored per breakpoint from **different boxes** for landscape and portrait
(`IM4`, `I3`) — a portrait frame is never a scaled landscape one. Sizes emitted:
2200 / 1600 / 1100 / 760 landscape, 900 / 640 portrait.

---

## 6. Known compromises

Reported rather than hidden, per the NEVER-list gate in
[motion-dna.md §14](../docs/motion-dna.md).

1. **Act 03's four states are not one locked camera.** `C5` requires the same camera
   across DELIVERED → GARAGE → LOUNGE → PERSONALIZED, because customisation is only
   legible if the frame does not move. The published renders are four different
   viewpoints and no amount of cropping makes them one. The states therefore read as
   four rooms rather than as one room re-dressed, and **the peak's central argument is
   weakened until the shoot happens.** The choreography is built to the locked-camera
   spec and will be correct the moment four frames from one position exist; nothing in
   the markup assumes the current mismatch.
2. **Every photographic frame is a render or a stand-in.** The Anchor dialect's
   instrument is real light on real material, and no frame here is that.
3. ~~**Act 05 has no people in it.**~~ **Closed 2026-09-05** by `act05/community`, a
   declared stand-in carrying figures at conversational distance and the compound's
   closed overhead doors reading cool through full-height glazing. The act's argument and
   its imagery now agree. The two subordinate frames are still unoccupied developer
   renders, which is the honest state — the real library has no people in it.
4. **The grade is one look but not one exposure.** `TRIM` in `tools/build-frames.py`
   applies a per-frame exposure correction where a source sits far off its register's
   curve — currently one frame, `act03/delivered` at 0.58. This is matching a source to
   the look, which is what grading is; it is recorded here so it cannot quietly become a
   second look.
5. **Act 05's two developer renders sit lighter and more saturated than the lead.** They
   share the WARM grade, but their sources are brighter than anything else in the
   library, so the act carries a visible tonal step between its dominant frame and its
   subordinates. Not resolved.
