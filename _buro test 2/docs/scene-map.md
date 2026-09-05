# SCENE MAP — _buro test 2

Eight acts. Read [interaction-thesis.md](interaction-thesis.md) for what the page is,
[motion-dna.md](motion-dna.md) for the rules every entry obeys,
[visual-direction.md](visual-direction.md) for the resolved visual system, and
[keyframe-storyboard.md](keyframe-storyboard.md) for the five frozen frames.

**Revised 2026-09-04** — concept-refinement pass. The Plan Rail is demoted from
signature to persistent architectural language; the signature becomes
**PLAN → SELECT → ENTER**; act 02 becomes a three-level spatial interaction on the
homepage; act 03 gains a locked-camera four-state transformation; and the compound
scene is resolved as **constructed 2D (SVG + GSAP)** rather than WebGL. The reasoning
is in [interaction-thesis.md §14](interaction-thesis.md).

**The dimensionality rule that governs every "3D role" line below:**

> **Constructed depth is for what cannot be drawn or photographed.**
>
> The compound can be *drawn* — it is a plan, and a plan with shallow extrusion on a
> fixed axis is a drawing, not a scene. The suites can be *photographed* — they are
> real rooms. Neither needs a renderer. `3D: none` below is a decision with a stated
> upgrade trigger, not an omission.

---

## 00 — ENTRY

| | |
|---|---|
| **Communication goal** | *This is a place, it is closed, and here is exactly what and where it is.* The first screen identifies the proposition without a gate, a hold or a required gesture (`C18`, `MJ7`). |
| **Dominant visual** | One full-bleed night frame: the perimeter from **outside**. A long dark wall, a gatehouse, one aperture lit from within. The building is the subject; no car is visible yet. |
| **Text amount** | **Minimal — four elements.** Wordmark. *121 private suites.* *Lake Zurich, Illinois.* A hairline header carrying TOUR and the phone. No paragraph, no sub-headline, no scroll cue. |
| **Plan presence** | **First trace.** A single hairline runs along the bottom edge of the frame — unexplained, unlabelled, reading as part of the architecture rather than as interface. It is one edge of the compound boundary, and nothing on screen says so yet. |
| **Interaction** | The header is live from first paint — TOUR and the phone work before anything animates. Nothing else is interactive. |
| **GSAP role** | **orientation.** The page's arrival, and the one act bound by name rather than by role (`MJ11`). Display lines enter by line behind a hard mask edge, 60ms apart. The photograph does not move. |
| **3D role** | **none.** A photograph of a real perimeter at night is the strongest available asset; a render would be weaker and more expensive. |
| **Transition out** | **Aperture — the gate slides laterally.** The outgoing frame is occluded by the gate leaf. The hairline trace survives the cut unchanged, which is the first hint that it belongs to the place rather than to the page. |

---

## 01 — ARRIVAL

| | |
|---|---|
| **Communication goal** | *This is not a garage. It is a street of doors, and it keeps going.* Establish scale before anything is offered. |
| **Dominant visual** | The internal frontage: a lit roadway between two rows of closed sectional doors, receding past the frame on both sides. The single monumental mass on the page, and the only one — scale is claimed once. |
| **Text amount** | **Almost none.** One mono caption in the frame's quiet region, ≤10 words, carrying one verified figure and its source. |
| **Plan presence** | **The trace becomes a drawing.** The hairline gains a second line, then a perpendicular, then two more: by the end of the act it is legibly a fragment of a plan, drawn in the left margin at roughly one column wide. Still unlabelled. It is now the **Plan Rail**, and it will stay for the rest of the page. |
| **Interaction** | None. This act is watched. The rail's marker begins tracking scroll — which is how the rail teaches itself, before it is ever asked to be touched. |
| **GSAP role** | **narrative progression.** A scrubbed lateral pass across one wide plate — the only lateral movement on the page. The rail draws in, `scrub: true`, linear. |
| **3D role** | **none.** The frontage is a photograph or a single locked-off plate. A rendered corridor is the moment the page stops being about a real building. |
| **Transition out** | **Interruption — a hard grade change.** No door here: the light goes flat and the photographic dusk cuts to surveyed ground. One of only two register changes on the page. |

---

## 02 — THE COMPOUND · 121 PRIVATE SUITES

**The recognition act, and the mechanism of the signature.** Three levels of depth,
revealed progressively (`MJ10` — each level owes a truth the last did not deliver).

| | |
|---|---|
| **Communication goal** | *The line that has been walking beside you is this place. There are 121 suites in 11 buildings, they are not identical, and one of them can be the subject.* Convert an adjective — "exclusive" — into an addressable object. |
| **Dominant visual** | **The compound, drawn.** Light lines on dark ground: 11 suite buildings as shallow-extruded masses on a fixed axonometric axis, the clubhouse as a distinct mass, the roadway as a near-planar lighter field, the perimeter as one line. No terrain, no trees, no north arrow, no scale bar, no floating labels. |
| **Text amount** | **High, and it is the point.** A count line, a legend, and — on selection — type, dimensions, square footage and capacity. `swiss-editorial` owns this act entirely. Every figure verified; see the ledger in §5. |
| **Plan presence** | **This act *is* the plan.** The rail expands from one column to the full stage — and the expansion is continuous, so the visitor watches the thing that has accompanied them become the place they are in. |
| **Interaction** | **Three levels.** See the table below. Pointer and keyboard reach identical states; the drawing is real DOM, so a suite is a focusable element with a real accessible name (`DNA78`). |
| **GSAP role** | **spatial explanation** (band 1 for this act). Pinned 2.6vh across three levels. Rows stagger 24ms, capped at eight, span ≤400ms. `invalidateOnRefresh` on everything measured. |
| **3D role** | **none — resolved as SVG + GSAP.** The full argument is in [interaction-thesis.md §14](interaction-thesis.md); the short form is that a fixed-axis shallow extrusion is a *drawing*, the SVG version has to exist anyway as the no-WebGL and reduced-motion fallback, and SVG gives real focusable nodes and a free hand-off into the clip-path that act 03 needs. **Declared upgrade trigger, and only this one:** if the act must deliver a *material* read — roof surfaces, wet asphalt, true contact shadow — rather than a drawn one. It does not. |
| **Transition out** | **PLAN → SELECT → ENTER.** The selected suite's footprint becomes the frame the physical room appears through. Choreographed in [motion-dna.md §3a](motion-dna.md); storyboarded as C → D → E in [keyframe-storyboard.md](keyframe-storyboard.md). |

### The three levels

| Level | What the visitor sees | The truth it delivers | What light does |
|---|---|---|---|
| **01 · COMPOUND** | The whole compound, all masses, minimal labelling. A count line: *121 suites · 11 buildings.* | **Scale and organisation.** This is a planned development, not a row of lock-ups. | Even, low. One key direction across every mass. Nothing is picked out. |
| **02 · BUILDING** | One building focused. The others drop in luminance and lose their bay divisions. Bay subdivisions appear inside the focused mass only. | **Granularity.** A building is made of individually owned rooms, and they are not all the same width. | The focused mass lifts; its neighbours fall away. Subordination is by light, not by opacity on an overlay. |
| **03 · SUITE** | One bay is the spatial subject. Its footprint is drawn at full weight; the record beside it carries type, dimensions, square footage, capacity, price. | **Specificity.** This one, this size, this money. | **One bay is illuminated** — the interior face lifts and light spills onto the roadway in front of its door. Measured at 3.91:1 against the unlit mass and 4.45:1 against the ground, so activation is visible without a selection border. |

**No level is skippable and none is mandatory** — scrolling on leaves the act at
whatever level the visitor reached, and the record reflects it. There is no modal, no
lightbox and no state the visitor can be trapped in.

**Homepage scope, deliberately bounded.** This is *see the world → understand the
scale → enter one suite.* It is **not** a configurator: no filters, no sort, no
compare, no saved list, no map search. Those belong to `/vehicle-suites/` — see §6.

---

## 03 — THE SUITE · **THE PEAK**

| | |
|---|---|
| **Communication goal** | *This is what one of them is actually like, at true proportion, and it is the one you selected.* Everything before exists to arrive here; everything after exists because of it. |
| **Dominant visual** | The interior of one suite, from the doorway, at tripod height. **The camera never moves for the whole act.** The negative space — the unlit rear of the room, and the mezzanine soffit above — does the compositional work. |
| **Text amount** | **Moderate, two registers.** One display line, four words or fewer. Then the spec plate: type, footprint, mezzanine, total square footage, capacity, electrical service, climate, price — every figure with its unit, mono keys, tabular figures, ≥14px. |
| **Plan presence** | **The trace persists as notation.** A small footprint diagram of the selected suite sits in the record column at roughly 40mm, hairline weight, with the selected bay marked. It is the drawing that just became this room, kept where the reader can check it. |
| **Interaction** | The spec plate is live and names the suite selected at act 02. One quiet route out — *see this suite in person* — which is the header's TOUR action, not a second CTA. |
| **GSAP role** | **narrative progression** (band 1, the page's peak). Pinned 3.4vh. **One locked camera, four states** — see below. Scrubbed, reversible, every 25/50/75% frame legible. |
| **3D role** | **none, and this is the load-bearing refusal.** The obvious move is to make the peak the rendered moment. A photograph of a real room with real light and a real car in it is more convincing than any render of it, costs a fraction, and `DM6` allows one depth idea per view. The peak is carried by photography and by the cut. |
| **Transition out** | **Aperture — a shutter drops to a slot**, and act 04's macro frame opens out of that band. The slot is the door seal, which is act 04's subject. |

### One camera, four states

**The rule is SAME CAMERA.** The space changes; the viewpoint does not. That is what
makes customisation legible instead of making it a slideshow of different rooms.

| State | What it shows | The truth it delivers |
|---|---|---|
| **DELIVERED** | The shell as handed over: insulated walls and ceiling, sealed floor, commercial overhead door, pedestrian door, wood staircase to the mezzanine. | **What you are actually given.** |
| **GARAGE** | Cars in it. | **What it holds, at true proportion.** |
| **LOUNGE** | The mezzanine finished out and occupied. | **What the second level becomes.** |
| **PERSONALIZED** | One owner's version. | **What someone made of theirs.** |

Four states, four truths, no repetition at different intensities (`MJ10`).

> **Motion rule locked 2026-09-05 — `C6-TEMP`.** These four frames are not one camera:
> one stand-in and three developer renders from three viewpoints. Until same-camera
> assets exist, motion treats the state changes conservatively — hold, cut, restrained
> crossfade, or a masked editorial transition — and never as a spatial morph. Full rule
> in [motion-dna.md §6](motion-dna.md).

> **Asset dependency, declared (`C17`).** DELIVERED and GARAGE are photographable
> today. LOUNGE and PERSONALIZED depend on a finished, occupied suite existing and
> being shot from the identical camera position. **If they do not arrive, the peak is
> two states and the act shortens to 2.4vh** — it does not get filled with renders.
> Nothing here is fabricated ahead of the photography.

---

## 04 — MACHINE / SPACE

| | |
|---|---|
| **Communication goal** | *Someone specified this building properly.* The build-quality argument made by looking closely rather than by claiming. The act that stops the page being real-estate marketing. |
| **Dominant visual** | Macro. Three frames, no whole car and no whole room in any: the overhead door seal meeting the floor · the floor finish under a tyre · light crossing paint inside the enclosure. Material read as material — concrete, rubber, steel, clearcoat. |
| **Text amount** | **Low, and every word measures something.** One mono caption per frame following *technical fact → observable consequence → value to this buyer* (`DNA32`). No adjectives. |
| **Plan presence** | **Rail only**, at its narrowest. The marker sits on the selected bay. |
| **Interaction** | **None. The page's deliberate non-selling act** — the pause between two chapters that want something. Its rhythmic job is to be a different *kind* of mass, not a wider interval. |
| **GSAP role** | **hierarchy** only (band 3). Frames arrive as the cut delivers them; captions by opacity, 180ms, no travel. Nothing scrubbed, nothing pinned. |
| **3D role** | **none.** Macro material is the worst case for a render and the best case for a lens. A rendered door seal is a claim about a door seal. |
| **Transition out** | **Aperture — a glazed door swings and the ground goes warm.** The page's only temperature change, through glass, so club and compound read as adjacent rather than sequential. |

---

## 05 — THE CLUB

| | |
|---|---|
| **Communication goal** | *The paddock has people in it* — and the club exists **because the machines are next door**, not as a hotel amenity that happens to be nearby. |
| **Dominant visual** | The clubhouse interior from a short arc: rooftop bar and lounge, simulators, event floor. **The first frames with people, and the only warm ones.** The adjacency is composed in — a suite door or the compound roofline visible through glass in at least one frame. |
| **Text amount** | **Moderate.** A short editorial paragraph — the only sustained reading before act 06 — plus the amenity list as a column, not as cards. |
| **Plan presence** | **The rail's clubhouse mass illuminates**, quietly, for the duration of the act. It is the one moment the rail reports something other than position, and it says *you are in this building now*. |
| **Interaction** | Light. The amenity list anchors into act 06's detail. No lightbox, no carousel, no filter. |
| **GSAP role** | **narrative progression** (band 2). A three-frame arc delivered by cut, not camera travel. The paragraph arrives by opacity only — it is reading matter. |
| **3D role** | **none.** Interiors with people are a photographic subject and nothing else. |
| **Transition out** | **Interruption — the second and last grade change.** Warm club light cuts to the surveyed ground of act 06, which is how the visitor knows the next thing is fact rather than atmosphere. |

---

## 06 — COMMUNITY / OWNERSHIP

| | |
|---|---|
| **Communication goal** | *Here is what you own, on what terms, with what included.* The commercial spine, and the act that answers the buyer's second question. |
| **Dominant visual** | **Not an image — a document.** Surveyed ground, a real column grid, information set as designed objects: what ownership includes, the specification shared by every suite, the two types compared, security, events, the South Florida status. One small photographic inset at most, subordinate. |
| **Text amount** | **The highest on the page, and it is the content.** Specification is content, not an appendix. Reading size, real measure, tabular figures, correct units throughout. |
| **Plan presence** | **The type comparison diagram** — one shared architectural diagram, TYPE A ↔ TYPE B, described in §4. It is the rail's language used to explain the product rather than to locate the visitor. |
| **Interaction** | Reading, plus the ordinary means: anchors, an expandable schedule that **does not move the list it lives in** (`U14`), the A↔B toggle, and the same single TOUR action. |
| **GSAP role** | **none, except the A↔B diagram.** No entrances, no reveals, no ambient anything (`DM9`). Identical in reduced-motion mode apart from the diagram resolving instantly — which is the honest test of whether an act needed motion. |
| **3D role** | **none.** |
| **Transition out** | **Aperture — a sectional door lifts one last time**, and act 07 is behind it: act 01's roadway at the other end of the day. The page's last threshold is the one you leave by. |

---

## 07 — PRIVATE TOUR

| | |
|---|---|
| **Communication goal** | *Come and see it.* One action, one place, one moment — and the page ends somewhere rather than fading out (`DNA30`). |
| **Dominant visual** | One composed frame: the roadway of act 01, a single door open, light spilling out. The camera settles and stops. Deliberately the same place as act 01, so the page closes where it opened with one door now open. |
| **Text amount** | **Minimal — the page's second and last moment of typographic scale.** One display line. Beneath it: the selected suite's type and size, the address, the phone, the tour action. |
| **Plan presence** | **The final trace.** The rail collapses back to the single hairline it was at act 00 — with one bay still lit. The visitor leaves with the drawing they arrived with, changed by one illuminated room. |
| **Interaction** | **One primary action — schedule a tour** — with the phone and the email list as quiet peers. The same action the header has carried since the first screen, at full size for the first time. No repeated CTA anywhere else on the page (anti-patterns `D6`). |
| **GSAP role** | **release** (band 2). Damping resolves, motion stops on a composed frame. The rail marker reaches the end of its travel and stays. |
| **3D role** | **none.** |
| **Transition out** | **None — the page resolves.** The footer shares act 06's ground and grid, carrying the address, the legal record and the sources. No new register, no fade to empty. |

---

## 1. Shot list (`DNA27`, `DNA50`)

```
00  reveal        01  dolly         02  interruption   03  push-in
04  macro         05  orbit         06  interruption   07  release
```

Seven shot types, eight acts, one repeat — `interruption`, used exactly twice, both to
change register from photographic to surveyed. That repetition is the page's meter.

Act 03's `push-in` is now a **push-in that has already happened**: the camera arrives
at its position through the PLAN → SELECT → ENTER transition and then holds for four
states. The push is the transition; the act is the hold.

**Mobile shot list, authored separately** (`DNA67`, `MJ8`) —
`00 reveal · 01 reveal (no lateral room; one wide composed frame) · 02 interruption,
plan re-authored as a shallow-perspective interactive drawing, three levels kept ·
03 push-in as four stacked full-screen states · 04 macro · 05 reveal (no arc room) ·
06 interruption · 07 release.`

---

## 2. Scroll budget (`DNA38`, `DM3`)

| Act | vh | Pinned |
|---|---|---|
| 00 ENTRY | 1.0 | no |
| 01 ARRIVAL | 1.4 | no |
| 02 THE COMPOUND | 2.6 | **yes** |
| 03 THE SUITE | 3.4 | **yes** |
| 04 MACHINE / SPACE | 1.35 | no |
| 05 THE CLUB | 1.65 | no |
| 06 COMMUNITY / OWNERSHIP | 2.0 | no |
| 07 PRIVATE TOUR | 1.0 | no |
| **the footer** | **0.45** | no |
| **Total** | **≈14.9** | 2 pins |

> **Revised 2026-09-05, and the revision is an admission.** The ≈13.8 figure was an
> estimate made before the content existed, and it was wrong in two specific ways.
>
> **It never counted the footer.** The page has an address, a phone number, both starting
> prices, the expansion status, the sources line and the unaffiliated-study disclaimer.
> That is 0.45vh of required content the budget simply omitted — not an overrun.
>
> **It under-estimated act 06 by 0.4vh.** The terms act is nine specification rows, five
> availability rows, the A↔B diagram and two disclosures. Every line of it is verified
> content; its length is set by the facts, not by the layout. Compressing it is the one
> thing the brief forbids.
>
> Five acts — 00, 01, 02, 03, 07 — land on their planned figure to within 0.04vh, which
> is what says the estimate was sound where it had content to estimate against.
>
> **The floor, as arithmetic:** 13.80 planned + 0.45 footer + 0.40 act 06 + 0.04 act 02
> pin rounding = **14.69**, before acts 04 and 05 are allowed a pixel. They sit 0.19
> above that between them, and closing the rest would mean shrinking the macro frames
> until "macro" stops reading. **14.9 is the smallest defensible total**, and it is the
> number motion is budgeted against from here.

The compound has three levels and the peak has four states; both are paid for inside
this total. Net change against the pre-correction build: **−0.34vh**.

---

## 3. Section-language ledger (`§2c`)

Read **down the columns**, not across the rows.

| act | ask | ground | type voice | borders / containers | image treatment | depth | motion | plan state |
|---|---|---|---|---|---|---|---|---|
| 00 ENTRY | nothing | photographic dark | grotesque + mono | hairline only | full-bleed night exterior | light fall-off | line-mask entrance | one line |
| 01 ARRIVAL | nothing | photographic dark | mono | hairline only | full-bleed interior, lateral | light fall-off | scrubbed lateral pass | rail draws in |
| 02 COMPOUND | browse | **surveyed dark** | mono + grotesque | hairline rules | none — drawing | shallow extrusion | pinned, three levels | **full stage** |
| 03 SUITE | read | photographic dark | grotesque + mono | hairline only | full-bleed interior | light fall-off | pinned, four states | footprint notation |
| 04 MACHINE | nothing | photographic dark | mono | hairline only | macro, cropped hard | light fall-off | none beyond arrival | rail, narrowest |
| 05 CLUB | browse | **warm dark** | grotesque + mono | hairline only | interior with people | light fall-off | three-frame arc | clubhouse lit |
| 06 OWNERSHIP | read | **surveyed dark** | grotesque + mono | hairline rules | one inset, subordinate | flat | **none** (A↔B only) | type diagram |
| 07 TOUR | act | photographic dark | grotesque + mono | hairline only | full-bleed interior | light fall-off | release | collapses to one line |

**What the columns say.** `ground` never changes owner — one dark ground for the whole
page, in three registers (photographic · surveyed · warm), and each register change is
the concept rather than a section's preference. `borders/containers` has one answer
everywhere: hairlines and alignment, never boxes — which makes the card-grid failure
structurally impossible rather than merely discouraged. `type voice` is two voices
doing every role by size, weight and position. **`plan state` is the new column**, and
it is the one that must be read hardest: it changes in every row, and that is carried
by the concept — the rail is a single continuous object whose state is the page's
progress. If any row's plan state stopped being derivable from the act's position, that
row is drift.

**The `ask` column.** `nothing · nothing · browse · read · nothing · browse · read ·
act` — no run of consecutive asks, and the two pauses are different *kinds* of mass
rather than wider intervals between offers.

---

## 4. Type A ↔ Type B — the secondary interaction

**One shared architectural diagram, not two feature cards.**

The verified fact that makes this work: **the depth is identical and only the width
changes.** Both types are 50′ deep with a 31′ mezzanine; A is 30′ wide, B is 23′.

| | TYPE A | TYPE B |
|---|---|---|
| Footprint | 30′ × 50′ | 23′ × 50′ |
| Mezzanine | 30′ × 31′ | 23′ × 31′ |
| Total | 2,430 sq ft | 1,863 sq ft |
| Capacity | ≈6 cars, 3 motorcycles | ≈4 cars, 2 motorcycles |
| From | $699,000 | $549,000 |
| Units | 26 | 95 |

**The interaction.** One plan. The depth axis and the mezzanine band are **locked** and
visibly locked — a dimension line runs the full 50′ and does not move. Only the width
edge travels, 30′ ↔ 23′. The record cross-fades beside it. Because the depth is
anchored, the visitor reads the difference as *width*, which is what it actually is,
instead of as "one is bigger".

**Scale reference, and its honesty rule.** A car footprint outline at true scale sits
inside the diagram, fixed, so the width change is measured against something the
visitor understands. It is **labelled `SCALE REFERENCE — NOT A PARKING LAYOUT`**, at
the 14px floor. The source says "fits approximately 6 cars"; it does not publish an
arrangement, and drawing one would be inventing content shape to fill a composition
(`CP7`).

**Technique, later.** 2D/SVG. A width tween on one rect, and **GSAP Flip on the record
rows**, which is where Flip actually earns its place — the rows change value and
count, and Flip animates a layout change nobody had to hand-author. No morph is needed:
these are rectangles. **No 3D.** Extruding this diagram would add a viewing angle and
subtract the one thing it is for, which is reading two widths against one locked depth.

**Where it lives.** Primarily `/vehicle-suites/`. On the homepage it appears once, in
act 06, at modest scale. **And it is already free at act 02** — on the compound plan,
Type A and Type B bays are literally different widths, so the product difference is
visible before a single word is read.

---

## 5. Content ledger (`CP1`–`CP7`)

**Rebuilt 2026-09-04** against `luxecorsa.com/vehicle-suites/`. Most of what was a
placeholder in the previous revision is now verified.

> **Second pass, 2026-09-04 — the source imagery was obtained.** Three rows changed
> status: `plan-01` placeholder → **verified**, `bldg-dealership` not-verified →
> **verified**, and the unit plans added four new dimensioned rows. The asset
> provenance ledger for every image that ships is [assets/ASSETS.md](../assets/ASSETS.md).

| id | claim | status | source |
|---|---|---|---|
| `count-01` | **121** private suites | verified | luxecorsa.com/vehicle-suites/, read 2026-09-04 |
| `count-02` | **11** buildings | verified | ″ |
| `loc-01` | 24455 US-12, Lake Zurich, IL 60047 | verified | ″ |
| `loc-02` | South Florida — expansion pending | verified | luxecorsa.com, read 2026-09-04 |
| `tel-01` | 224-662-0000 | verified | ″ |
| `typeA-dim` | 30′ × 50′ + mezzanine 30′ × 31′ = **2,430 sq ft** | verified | luxecorsa.com/vehicle-suites/ |
| `typeA-cap` | fits approximately **6 cars and 3 motorcycles** | verified | ″ |
| `typeA-price` | from **$699,000** | verified | ″ |
| `typeB-dim` | 23′ × 50′ + mezzanine 23′ × 31′ = **1,863 sq ft** | verified | ″ |
| `typeB-cap` | fits approximately **4 cars and 2 motorcycles** | verified | ″ |
| `typeB-price` | from **$549,000** | verified | ″ |
| `typeA-split` | Type A: **1,500 sq ft** ground floor + **930 sq ft** mezzanine | verified | luxecorsa.com/wp-content/uploads/2plan-A-scaled-1.jpg — dimensioned unit plan. 1,500 + 930 = 2,430 ✓ reconciles with `typeA-dim` |
| `typeB-split` | Type B: **1,150 sq ft** ground floor + **713 sq ft** mezzanine | verified | luxecorsa.com/wp-content/uploads/2plan-B-scaled-1.jpg. 1,150 + 713 = 1,863 ✓ reconciles with `typeB-dim` |
| `unit-depth` | both types **50′ deep**, mezzanine **31′ deep**, mezzanine opening **8′ × 4′** | verified | both unit plans, dimensioned. **This is the fact the A↔B interaction rests on** (§4) and it is now measured rather than inferred |
| `spec-01..09` | climate controlled · pedestrian door · bathroom with walk-in shower · LED lighting throughout · insulated walls, ceilings and garage door · **100 AMP** electric service · commercial-grade overhead garage door · wood staircase and railings to mezzanine · upgrades via onsite designer | verified | ″ |
| `amenity-01..07` | clubhouse with rooftop bar and lounge · racing and golf simulators · wellness centre · business and event space · detailing and customisation · gated community · 24/7 surveillance | verified | luxecorsa.com, read 2026-09-04 |
| `avail-01` | **98 available** (81%) · **23 sold** (19%) | **dated-requires-reconciliation** | luxecorsa.com/vehicle-suites/, captured 2026-09-04. **Renders with its capture date beside it** (`CP5`) |
| `avail-02` | Type A **21 of 26** · Type B **77 of 95** | **dated-requires-reconciliation** | ″, same treatment |
| `plan-01` | **the site-plan geometry itself** — building positions, bay widths, the A/B distribution across the 11 buildings | **verified** | luxecorsa.com/wp-content/uploads/map.png + legend `plan.png`, obtained 2026-09-04. **Resolved.** The published site plan exists as artwork and the geometry is measured from it by `tools/extract-plan.py`: 13 bay runs across 11 numbered buildings, 26 Type A bays drawn individually (white in the legend), 95 Type B (grey), 1 dealership mass, 2 club masses. The extraction reconciles to all three published totals. **The `INDICATIVE LAYOUT` mark is therefore dropped.** The one derived figure is the split of Type B bays between the two rows of a double-row building, which the raster cannot resolve; it is derived by length and declared in `compound.json` |
| `suite-no` | per-suite numbering | **does not exist** | No numbering system is published. **A selected suite is identified by type and dimensions, never by an invented unit number.** This is also the better label |
| `bldg-dealership` | a dealership building on the compound | **verified** | luxecorsa.com/wp-content/uploads/plan.png — the published legend carries `CD · Car Dealership`, and the mass is drawn on the site plan at its west end. **Reversed 2026-09-04**: this row previously read *not verified* on the strength of the marketing pages alone. It is drawn, as a civic mass distinct from the 11 suite buildings |

**Internal consistency, checked:** 26 + 95 = 121 ✓ · 21 + 77 = 98 ✓ · 98 + 23 = 121 ✓ ·
1,500 + 930 = 2,430 ✓ · 1,150 + 713 = 1,863 ✓. Five independent published figures
reconcile, and the site plan independently yields 26 Type A and 95 Type B bays when
measured — which is the strongest evidence available that the source numbers are real
rather than marketing rounding.

**Rules this page inherits.** Every claim-shaped string in the *rendered* page maps to
a row here (`CP2`) — coverage, not validity, is the test. No prior mockup, brief or
concept document is ever a source (`CP3`). No superlative ships without a citation, and
no promise — "24/7", "climate-controlled", "secure" — ships without a statement by the
client rather than an inference from the category (`CP6`). **If a composition needs a
figure nobody can source, the composition changes** (`CP7`) — which is why the plan is
designed to read correctly with the A/B distribution unknown, and why no suite carries
a number.

---

## 6. Homepage vs. `/vehicle-suites/` — the split

Two pages, one plan system, two jobs. Getting this wrong in either direction is the
single most likely way this concept fails.

| | **Homepage — act 02** | **`/vehicle-suites/`** |
|---|---|---|
| **Job** | see the world → understand the scale → enter one suite | explore → compare → understand the product |
| **Register** | editorial, cinematic, spatial | functional, still premium |
| **Levels** | compound → building → suite | the same, plus filter and compare |
| **Controls** | selection only | filter by type, availability, size, price; sort; compare two |
| **Record** | one suite at a time | a list beside the plan, both selectable |
| **A↔B diagram** | once, modest, in act 06 | prominent, and the page's own signature |
| **Outcome** | one suite becomes the subject of act 03 | a shortlist and an enquiry |
| **What it must never become** | a configurator | a mood film |

**The plan system is built once and configured twice.** Same geometry, same drawing
grammar, same light-as-state language, same accessible list underneath. The homepage
instance switches the functional layer off; the suites page switches it on.

---

## 7. Asset origin (`GI1`–`GI8`)

Every frame is **real photography of the real compound**, or it is declared. No
generated image depicts the actual building, and nothing generated ships without
provenance travelling with the file. Where the compound is not yet built, a developer
render is a legitimate asset **and is labelled as a render in its caption** — a render
presented as a photograph is exactly the claim the provenance rules exist to stop.

---

## 8. Required visual assets

Ordered by how much of the page collapses without them. **This remains the single
largest risk in the project** and it is the composition's declared dependency (`C17`):
the Anchor dialect has nothing to light if the library is inconsistent, and the vault
records that failure three separate times
(`vault/semlerpremium-dk-showroom`, `vault/semlerpremium-dk-brands-porsche-911-gt3-…`,
`vault/porsche-com-usa`).

**Tier 1 — the page does not exist without these**

1. **The suite interior, DELIVERED** — one suite, door up, from the doorway, tripod height, true perspective. Act 03, state 1. *The single most important frame on the site.*
2. **The suite interior, GARAGE** — the identical frame with cars in it. **Same camera position, same lens, same light.** Act 03, state 2. The two frames must be the same frame or the proportion argument fails.
3. **The internal frontage** — a long lateral plate of the roadway between two rows of doors, wide enough to pass across a viewport. Act 01, and reused at act 07.
4. **The perimeter at night** — the compound from outside, one aperture lit. Act 00, and the LCP element.
5. **The site plan as artwork or data** — building positions, bay widths, the A/B distribution. Act 02. **Not an image: geometry.** Currently `plan-01`, placeholder.

**Tier 2 — an act is weakened without these**

6. **Three macro frames** — door seal to floor, floor finish under a tyre, light across paint. Act 04.
7. **Club interiors with people** — bar and lounge, simulators, event floor, warm, at least one showing the compound through glass. Act 05.
8. **The closing frame** — act 01's roadway with one door open, other end of the day. Act 07.
9. **The suite, LOUNGE** — the mezzanine finished and occupied, same camera. Act 03, state 3.
10. **The suite, PERSONALIZED** — one owner's version, same camera. Act 03, state 4.

**Tier 3 — supporting**

11. **Portrait crops of every Tier 1 and Tier 2 frame**, authored separately, never derived by `object-fit`.
12. **The wordmark**, in a form that survives at hairline scale in the persistent header.
13. **A lighting reference** — one document fixing colour temperature, contrast curve and black point, so the library grades as one compound rather than as eight shoots.
14. **A car silhouette at true scale** — one 2D outline, correct dimensions, for the A↔B diagram's scale reference.

**Photographic direction.** Level, tripod height, wide, interior-architectural. The
building is the subject and the car is in the frame at the size a car actually is.
**No low hero angles, no three-quarter beauty shots, no rolling shots, no drone.** One
directional key identifiable in every frame; deep shadow with detail in it, never flat
black; crops that commit and never leave a silhouette tangent to a frame edge (`C9`).

**The fallback, stated now rather than improvised later.** If Tier 1 photography does
not arrive, this direction fails honestly rather than quietly: acts 00, 01, 03 and 07
cannot be carried by renders without the page becoming the cinematic-effect cliché the
NEVER list bans. The correct response is to **change the direction** — `swiss-editorial`
as Anchor, the plan and the record carrying the page, photography demoted to support —
not to render the missing frames and hope. That decision belongs to Alex, before the
build.
