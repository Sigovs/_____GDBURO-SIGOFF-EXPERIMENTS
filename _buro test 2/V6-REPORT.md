# LUXE CORSA — ACT 02 / V6 — REMOVE THE INTERFACE

Design DNA: `C:\____WORK\_____GDBURO SIGOFF\design_dna`

V5.3 was preserved as the technical baseline. The corrected 11-building data, deterministic
picking, direct building-to-building switching, the escape hierarchy, the site plan's state
preservation, Type A / Type B geometry, the suite data and the ENTER logic were not rebuilt.
V5.3 is still published, beside V6, because the subtraction is only legible against the thing
it subtracted from.

---

## 1 · LIVE URLS

| | |
|---|---|
| V6 — act 02 on its own | `…/_buro%20test%202/index6.html` |
| V6 — the full site, acts 00–07 | `…/_buro%20test%202/index5.html` |
| V5.3 — act 02 on its own (baseline) | `…/_buro%20test%202/index3.html` |
| V5.3 — the full site (baseline) | `…/_buro%20test%202/index2.html` |
| The portal | `…/_buro%20test%202/` |

Base: `https://sigovs.github.io/_____GDBURO-SIGOFF-EXPERIMENTS/`

Every number below was measured on the **published** build served the way Pages serves it —
as files, from a subdirectory — not on the dev server.

---

## 2 · UI ELEMENT COUNT — V5.3 vs V6

Measured with `exploration/review-video/_cdp/uicount.mjs` at 1440×900 on the published pages.
"Chrome" is every visible control a visitor has to read and decide about. The suite strip is
counted separately because it is one control repeated once per bay, not thirteen decisions.

| state | chrome V5.3 | chrome V6 | panel area V5.3 | panel area V6 |
|---|---|---|---|---|
| compound | 1 | **1** | 4.5% | **0%** |
| building | 14 | **4** | 22.9% | **0.9%** |
| suite | 16 | **6** | 24.1% | **6.8%** |

What the four controls at building level actually are, printed by the same tool:

```
V5.3  building   ← Overview | ‹ | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | ›
V6    building   ← Overview | Site plan | ‹ | ›
```

The eleven-button navigator is gone from the screen. Its logic is not: the two chevrons are
the same `stepBuilding` it drove, and the switching test below still passes 20/20 and 30/30
because the primary way to reach another building is to click it on the model.

At compound rest V6 has **one** control on screen — `Site plan` — and no panel at all. The
count, the availability and the instruction are four lines of type on the ground.

---

## 3 · THE STRICT TEST — compound → building → suite → ENTER, model only

`v6qa.mjs`, real pointer events at real screen coordinates, against the published page. No
site plan, no navigator, no legend, no documentation.

```
building 03 answers the pointer   YES at 309,449
cursor says clickable             true
named before any click            03 · 10 of 13 available · View →
after the click                   level=building  b=03
anything appeared at the bottom?  (none)
doors reachable on screen         13 of 13
a real door answers the pointer   03 · 01 at 478,384
the door names its own suite      03 · 01 / Premium · 2,430 sq ft / $699K
a sold door says so               03 · 03 / Sold
after clicking the door           level=suite  b=03  s=03 · 01
ENTER                             248×49  rgb(206,59,50)  "Enter suite →"
site plan opened                  false
a building navigator exists       false
a legend exists                   false
CONSOLE ERRORS                    none
```

**FIRST-TIME TEST: PASS.** The whole path was walked without opening the plan, without a
navigator, and without anything appearing along the bottom of the screen.

---

## 4 · DIRECT SWITCHING — still intact

`switch.mjs`, from inside a selected building, never going home:

```
adjacent switching        20/20   (17 by clicking the model, 3 by the chevrons)
random direct switching   30/30
stale state after a switch with a suite chosen
   before  suite   b=03  s=03 · 01
   after   building b=06 s=null      mini bays belong to 06   ENTER absent
```

`escape.mjs`: Escape from suite → building, Escape from building → compound, Overview from
anywhere → compound, Escape out of the plan leaves the selection untouched. All PASS.

`siteqa.mjs` on the published full site: **11/11 buildings selectable inside the real page**,
the page still scrolls after the model has been used, and the wheel passes through the canvas.

---

## 5 · THE 02 / 10 CAMERA — PASS

The arrival azimuth is derived from the run's own door normals; for a double-row building the
runs are taken separately (their mean normal cancels) and the run with the most available
suites wins. `poses.mjs` shot the arrival pose on every building and asked the model where its
doors were:

```
B01 12/12   B02 26/26   B03 13/13   B04 6/6   B05 6/6   B06 9/9
B07 9/9     B08 6/6     B09 8/8     B10 16/16  B11 10/10
```

02 and 10 arrive facing a door row. What cannot be fixed by a camera is that they are two runs
back to back: from the door side of one, the other's doors are behind the building. That is the
architecture, and it is why the chevrons and the plan still exist.

---

## 6 · WHAT THE ARCHITECTURE DOES INSTEAD OF THE INTERFACE

- **Compound rest.** One control. Four lines of type. The model is the whole screen.
- **Hover a building.** It lifts out of the site — its own material, its roof, its neighbours
  dropping back — and a tag appears *on it* saying `03 / 10 of 13 available / View →`. That is
  where the interaction is taught: on the object, once, without a legend.
- **Select it.** The camera moves; the other buildings stay lit, stay hoverable and stay
  clickable. Nothing announces a mode. There is no bar, no breadcrumb and no state label.
- **The garage doors are the selector.** Pointing at a real door names its suite, its type,
  its size and its price on a sand tag with a leader line down to the door itself. A sold door
  says `Sold` and does not answer a click.
- **The product panel exists only after a door is chosen.** It is a 298px plate in the corner
  with the suite, `Premium · 2,430 sq ft`, `$699,000`, ENTER in the project's red, and one
  quiet `Full specs →`. It is not a footer and nothing appears along the bottom of the screen.
- **Premium / Standard is the language.** `Type A` and `Type B` survive only inside act 03's
  technical plate, where they belong.
- **The miniature bays are secondary and look it** — a thin rail low on the left, for reaching
  a door the camera has turned away from.
- **The site plan is not on the journey.** It is a utility overlay behind one quiet word, and
  Escape returns the visitor exactly where they were.

---

## 7 · ACT 03 DATA CONTINUITY — FIXED

The known bug: a visitor chose `03 · 01` — Premium, 2,430 sq ft, from $699,000 — and act 03
then described a Type B, 1,863 sq ft, from $549,000, drawn at 23′ × 50′.

The cause was structural, not a typo. `main.js` fills act 03's plate inside `syncPeak()`, and
that whole block is guarded by `if (compoundEl)` — production act 02's own markup. The
integrated page removes `data-compound` so production act 02 stands down, and act 03's wiring
went with it. `exploration/study/v6/act03-link.js` reconnects it. Measured on the published
full site after choosing 03 · 01:

```
Suite 03 · 01 | Type Premium · TYPE A | Footprint 30′ × 50′ | Mezzanine 30′ × 31′ · 930 SQ FT
Total 2,430 SQ FT | Capacity ≈6 CARS, 3 MOTORCYCLES | Electric 100 amp service
Climate Climate controlled | From $699,000        footprint notation rect width 46 (Type A)
```

Act 03 was **not** redesigned. Same eight rows, same notation, same caption — different values,
and they are the visitor's own.

---

## 8 · MODEL AND LIGHT — four defects found by measuring the frame

Each of these was found because the rendered picture was read out as pixels, not because the
code looked wrong.

**The three warm lamps at the gate had their range in the wrong units.** `THREE.PointLight`
uses `distance` raw; it is not scaled by the light's parent, and this light's parent is scaled
by 0.02. `ft(52)` asked for a 52-foot pool and produced a **39-world-unit** one — more than
twice the width of the whole compound. At the rest pose the camera is far enough out that it
passes for haze; the moment a building is selected the camera drops into the middle of it. An
8×6 grid of mean RGB, building level vs rest:

```
before   top of a building frame  #34302d   red ahead of blue by +7 … +21
         compound rest            #22262b   red behind blue by −4 … −14
after    top of a building frame  #242426   −2 … −5
```

Same class of bug as the one already fixed on the focus and apron lights; these two were
missed. Now `wft()`.

**A third of every building frame was lit ground standing in for sky.** The fog was a fixed
pair of numbers solved against the rest pose, so from a selected building — half the distance —
the terrain plane stayed lit to the top of the picture. Proved by hiding the terrain: the top
third went from `#34302d` to `#0c1521`, the blue-hour sky it was covering. The fog now rides
the camera's own distance (`near = dist × 0.9`, `far = dist × 3.0`), which reproduces the hand-
set 19 / 62 at the rest pose and tightens automatically at every level below it.

**The arrival pose looked at a lid, dead on.** The camera targeted the middle of the roof slab
and stood exactly on the door normal. The runs on this site are parallel, so a perpendicular
camera stacks the neighbours directly in front of the subject and the frame becomes bands. It
aims at the door band now, stepped out onto the apron, swung 25° off the normal: the door row
recedes, the building reads as a volume, the neighbours become context at the sides.

**The apron pool was a lamp pressed against the wall.** Nine feet out and seven feet up; at
suite distance it erased the one door the visitor had actually chosen. Magnified three times on
the composited render it came back as a white card with no reveal and no handle while the
available doors beside it still read as doors. Moved out onto the apron and turned down.

---

## 9 · CONTRAST — measured on the composited render

`aa.mjs` measures a hand-written list of V5.3 selectors, and against V6 it reported "all pass"
by finding none of them. `aa6.mjs` finds the text instead of being told where it is: every
element inside the interface with its own visible text, over three states, ink read out of a
PNG of the live render against the ground actually under it.

Two failures, both real, both fixed: the chevrons at **2.15:1** and **2.65:1** against the 3.0
a 26px mark needs — a scrim tuned against the blue-hour rest pose, over a warm building-level
ground. Deepened where the glyph sits, still fading to nothing before it can draw an edge.
Re-measured: 12.83:1 and 12.56:1.

One reported failure was the estimator's, not the design's: a 20px arrow alone in a 60px cell
covers about 3% of its box, so a 2nd-percentile ink lands on a half-covered pixel and reported
1.55:1 for white on red. The ink is now the median of the glyph core. Corrected reading 4.89:1.

Final: **31 of 31 text nodes pass**, and no functional text is below the 14px floor.

---

## 10 · DELIVERABLES ON DISK

| | |
|---|---|
| Video, 58s, real pointer | `exploration/review-video/luxe-corsa-act02-v6.mp4` |
| Screenshot sheet, 8 states | `exploration/study/shots6/` |
| Arrival pose on all 11 buildings | `exploration/audit/poses/` |
| The V6 interface | `exploration/study/v6/v6.js`, `v6.css`, `act03-link.js` |
| Standalone shell | `exploration/study/proposed-v6-architecture-ui.html` |
| Integrated page (generated) | `exploration/integrated/v6-full-site.html` |

The video walks: rest → hover 03 → select 03 → hover a real garage door → select that suite →
ENTER → straight to 02 → straight to 05 → Overview. Beats verified against the state machine:

```
01 rest            compound
02 hover 03        compound
03 building 03     building b=03
04 door hover      03 · 01
05 suite           suite  03 · 01
06 entered         suite  03 · 01
07 switched to 02  building b=02
07 switched to 05  building b=05
08 home            compound
```

---

## 11 · REMAINING PROBLEMS

1. **02 and 10 can only ever show one of their two rows.** The camera arrives on the better
   side by measured door normals, but the other thirteen doors are behind the building. Today
   the chevrons and the site plan carry that; the honest fix is a second arrival pose per
   double-row building — one per run — which is a design decision, not a bug fix.
2. **The building frame still carries about a quarter of empty air at the top.** It reads as
   dusk now rather than as lit ground, which is the fix that mattered, but the pose is composed
   for a 3:2 desktop stage and has not been re-composed for tall or square viewports.
3. **The chevrons are still an unlabelled control.** They pass contrast and they are the
   declared fallback, but nothing on screen says what they step through until they are used.
4. **The 02 → 03 aperture remains designed and parked.** `BRIEF-seam-02-03.md` carries the
   concept. The data now survives the cut; the *transition* does not — act 02 ends and act 03
   begins with no aperture between them.
5. **Mobile is untested at V6.** Every number in this report is 1440×900. The interface is
   built on the same responsive foundation as V5.3, but no V6 measurement has been taken at a
   phone's square stage.
6. **The dashboard repository has still not been pushed.** The live GD Buro dashboard shows the
   earlier state. This repository is pushed and the five versions are live; the dashboard entry
   that points at them is a separate repo and is waiting on a decision that was never given.

---

**STOPPED FOR REVIEW.**
