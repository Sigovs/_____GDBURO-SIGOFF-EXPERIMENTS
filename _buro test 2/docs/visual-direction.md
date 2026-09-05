# VISUAL DIRECTION — _buro test 2

The resolved visual system. Written 2026-09-04, after
[interaction-thesis.md](interaction-thesis.md) settled the concept and before any
markup exists.

**Anchor `cinematic-industrial` (~65%) · Contrast `swiss-editorial` (~30%) · no
Signature influence.** Unifying principle: *the plan tells you where you are; the
light tells you what it is like to be there.*

**The register, in one line:** an architectural publication about a private automotive
compound — paddock discipline, campaign photography, technical drawing — where the
brightest thing on the page is always a real room.

> **Which dialect tier binds here.** The `DIALECT` sections inside the taste skills are
> `auction-editorial`'s positions, and `auction-editorial` was not selected. They are
> therefore inputs rather than defaults; where this system agrees with one it is cited,
> and where it departs the yield is recorded in §14. **The `INVARIANT` tier binds
> absolutely**, and `anti-patterns` D1–D10 are treated as binding because they are
> Alex's recorded dislikes rather than one dialect's taste, and the brief's own
> avoid-list restates most of them.

---

## 1. The three grounds

The page is dark throughout and there is no light mode. What varies is not the ground
but the **register** — one ground, three states, each one the concept rather than a
section's preference.

| Register | Where | What it is | Ground |
|---|---|---|---|
| **PHOTOGRAPHIC** | 00 · 01 · 03 · 04 · 07 | A real room, really lit. The image is the mass and the interface recedes to hairlines. | `--ground` |
| **SURVEYED** | 02 · 06 | The compound as a drawing, or the terms as a document. Flat, even, no fall-off. This is where facts live. | `--deck` |
| **WARM** | 05 | The clubhouse. The page's only temperature change, and the only frames with people. | `--ground`, warm-graded imagery |

**Why there is no light mode.** `color I7`: inverting a scheme is re-solving it, and
the masses carrying type over photography do not invert at all. Every act except two is
a photograph. A light version of this page would put dark ink on dark rooms, and the
correct response would be to keep every photographic act dark — at which point it is
the same page with a lighter document chapter, which is not a light mode, it is a
defect with a switch.

---

## 2. Palette — the ladder

**Derived, not chosen.** The base is cool rather than warm because the compound's
interior light is **verified as LED** (`spec-04`), and LED in a concrete building reads
neutral-to-cool. That single verified fact sets the temperature of the entire system.

```css
:root {
  /* GROUND — five steps, and the darkness has information in it */
  --void:     #07080A;   /* outside the compound; the black point of every photograph */
  --ground:   #0E1013;   /* the page */
  --deck:     #171B20;   /* surveyed ground — acts 02 and 06 */
  --roadway:  #1F242A;   /* the plan's road plane, near-planar and slightly lifted */

  /* MASS — building values sit close together on purpose; LIGHT separates them */
  --mass:     #1A1E23;   /* a building face, unlit */
  --mass-lit: #3A424B;   /* a building face, focused */
  --bay-lit:  #6E7C88;   /* ONE bay, illuminated — the selection state */

  /* INK — one near-white, never #fff */
  --ink:      #ECEEF1;
  --ink-85:   rgb(236 238 241 / .85);
  --ink-70:   rgb(236 238 241 / .70);
  --ink-55:   rgb(236 238 241 / .55);   /* the dimmest ink allowed to carry meaning */
  --ink-40:   rgb(236 238 241 / .40);   /* rules that carry information */
  --ink-16:   rgb(236 238 241 / .16);   /* construction lines — decoration only */

  /* LIGHT */
  --lume-cold:#CBD6DE;   /* LED interior spill — the compound */
  --lume-warm:#E9DCC4;   /* the clubhouse, and nowhere else */

  /* MASS — a bay that can never take light */
  --mass-sold:  #101317;  /* SOLD: one step under --mass, and it never illuminates */

  /* ACCENT — one hue, one role, under 1% of pixels, and never in the drawing */
  --oxide-text: #C86B60;  /* the word and the figure that carry scarcity. Text only */
}
```

### Measured, not asserted (`color I1`, `I6`)

Every pair the page actually uses, composited, in the ratio it renders at:

| Pair | Ratio | Verdict |
|---|---|---|
| `--ink` on `--ground` | **16.39** | ✓ |
| `--ink` on `--deck` | **15.47** | ✓ |
| `--ink` on `--mass-lit` | **8.77** | ✓ |
| `--ink` on `--bay-lit` | **3.69** | ✓ large / UI only — **body text never sits on a lit bay** |
| `--ink-70` composited on `--ground` → `#A9ABAE` | **8.28** | ✓ body |
| `--ink-55` composited on `--ground` → `#888A8D` | **5.50** | ✓ body — **the floor for functional text** |
| `--ink-55` composited on `--deck` → `#8B8D91` | **5.41** | ✓ body |
| `--ink-40` composited on `--ground` → `#67696C` | **3.46** | ✓ UI boundary — **rules that carry meaning** |
| `--ink-16` composited on `--ground` → `#323437` | **1.53** | ✗ — **decoration only, may never carry information** |
| `--lume-cold` on `--ground` | **12.89** | ✓ |
| `--oxide-text` on `--deck` | **4.72** | ✓ body — the word SOLD, the figure 23 |
| `--oxide-text` on `--ground` | **5.20** | ✓ body |
| `--mass-sold` vs `--mass` | **1.11** | the resting difference — deliberately near-invisible |
| `--mass-sold` vs `--bay-lit` | **4.35** | what the difference becomes once neighbours light |
| **`--bay-lit` vs `--mass`** | **3.91** | **the selection state, and it is visible without a border** |
| **`--bay-lit` vs `--ground`** | **4.45** | ″ |

**One finding the measurement forced, and it is the kind that is invisible in a token
table.** A single hairline token cannot do both jobs. At `--ink-16` a rule is a
beautiful construction line and measures **1.53:1** — which is fine for a drawing's
guide lines and a failure the moment the same token draws a bay division, because a bay
division tells the visitor where one owned room ends and the next begins. **The token
splits: `--ink-16` for lines that mean nothing, `--ink-40` for lines that mean
something.** This is the failure `color I7`'s own evidence records, found here by
measuring rather than by looking.

**Dimmed ink stops at `--ink-55`.** `--ink-45` measures **4.06:1** and fails the 4.5
floor by a margin small enough to survive every eyeball review. It is not in the system.

---

## 3. Accent — derivation, de-rating, and one role

**Derivation (`color I5`, stated before use).** The brand name is *Corsa* — race — and
its reference colour is rosso corsa. The derivation is sound and **the result fails the
judgement step, for two independent reasons**: it is the most exhausted accent in the
category, and it is *the colour of the cars*. An accent that competes with the subject
is exactly the failure `I5` describes when it says derivation is necessary and not
sufficient.

**So the derivation is taken and then de-rated.** The hue is kept, the chroma is dropped
to a fired-oxide level, and the budget is cut from "an accent" to **one role**.

> ### The system's primary accent is LIGHT, not hue.
>
> The Anchor's first instrument is illumination — *a decision that could be solved by
> lighting is solved there first.* Emphasis on this page is carried by luminance:
> the lit bay, the focused mass, the spill on the roadway. **This is what makes
> black-and-gold structurally impossible rather than merely discouraged** — there is no
> decorative hue in the system for gold to be.

**The one chromatic role: SOLD.** 23 of 121 suites are gone, and scarcity is the actual
sales argument.

> **Resolved 2026-09-05. This section and §10 P9 used to contradict each other**, and
> the build followed the wrong one. §3 permitted "an oxide mark" on a sold bay; §10 P9
> forbade any coloured dot, pin, pill or marker on the plan. Both cannot be true, and
> what shipped was a 2.8-unit oxide tick inside each of 23 bays — a coloured availability
> marker on a site plan, which is the Zillow tell P9 names by name. **P9 wins outright,
> and §3 now says so.**

**The accent never touches the plan geometry.** Not as a fill, not as a boundary, not as
a tick, not as a legend swatch. State on the drawing is light and nothing else:

| State | On the drawing | In the textual layer |
|---|---|---|
| **Unselected** | the normal surveyed drawing, `--mass` | — |
| **Hover / focus** | architectural illumination — the face lifts to `--mass-lit` | — |
| **Selected** | one bay illuminated to `--bay-lit` | the record names the suite |
| **Sold** | **`--mass-sold`: the bay can never take light.** It sits one step under `--mass` at rest and stays there while its neighbours lift, so at building level it is the only dark thing in a lit run — **4.35:1** against `--bay-lit` | the word **SOLD**, in `--oxide-text`, in the record and in the suite's accessible name |

Three carriers, and hue is never one of them on the drawing (`color I2`): the absence of
light, the position in the list, and the word.

**Where the accent is allowed to exist: the textual layer only.** Four instances on the
page — `23 sold` in act 02's record head, `Sold` on a sold row in the suite list, `Sold`
in the selection plate, and `23` in act 06's availability table. All four are the same
fact: how many are gone.

**The key is typographic too.** It was four 18×10 colour chips, one of them oxide, which
is a pill cluster encoding state by hue. It now reads *LIT — selected · RAISED —
building in focus · UNLIT — sold, listed below*: it describes the light rather than
sampling it.

**Budget: under 1% of visible pixels, one role, no exceptions.** Not a button, not a
heading, not a hover, not a rule, not a section ground, **and never a shape inside the
drawing.** If a second role ever needs it, the answer is that the second role needs
light instead.

**One measured concession, recorded rather than hidden.** `--oxide-text` sits at 52%
saturation, above the 8–25% the dialect prefers. Desaturating it further drops it under
4.5:1 on this ground, and an accent that cannot be read is not a quieter accent — it is
a broken one. The contrast floor outranks the chroma preference (`color I1` over
`color D2`).

**Focus ring: `--ink`, 2px, 2px offset** (`color I3`). Measured against every surface a
focusable element can sit on; the worst case is a lit bay at **3.69:1**, which passes.
`--lume-cold` was the more elegant candidate and measures **2.90:1** there — rejected on
the number.

---

## 4. Typography — two voices, every role

**Two voices, and the second one states the job the first structurally cannot do**
(`typography I8`).

| Voice | Roles it serves | Why it exists |
|---|---|---|
| **Grotesque** | display · lead · body · nav · button · list · paragraph | The page's whole language, differentiated by size, weight and position — not by family |
| **Mono** | measurement · spec keys and values · plan annotation · captions · act numbers · eyebrows · the record column | **Fixed advance makes numbers scan as a ledger and columns align without a table.** A proportional face cannot do this, which is the systemic purpose the invariant demands |

**No third voice, and specifically no didone.** `typography D1` — the house three-voice
system with a high-contrast display serif — is **set aside**; the yield and its reason
are in §14. The brief bans generic huge serif luxury typography, both selected dialects
call for one or two mechanical voices, and a didone over architectural photography is
costume on a building.

### Faces

| | Intent (licensed) | Prototyping stand-in (free) |
|---|---|---|
| **Grotesque** | **ABC Diatype** — neo-grotesque, slightly mechanical, holds at 14px and at 96px. Alternates: Suisse Int'l, Söhne | **Archivo** — a real grotesque skeleton, wide range, and it does not read as the Inter default |
| **Mono** | **ABC Diatype Mono** — the exact pair. Alternates: Söhne Mono, Suisse Int'l Mono | **IBM Plex Mono** — technical rather than coding-flavoured |

**The stand-in is declared as a stand-in.** A display face is verified in the render, at
the sizes the page sets, on the grounds it sits on — so the final call is made on screen
with the page's own strings, never from a specimen.

### Scale

```css
:root {
  --t-micro:   0.875rem;                                    /* 14px — the floor, fixed */
  --t-body:    clamp(1rem, 0.35vw + 0.95rem, 1.125rem);
  --t-lead:    clamp(1.125rem, 0.9vw + 1rem, 1.5rem);
  --t-h3:      clamp(1.5rem, 1.6vw + 1.1rem, 2rem);
  --t-h2:      clamp(2rem, 3vw + 1.2rem, 3.25rem);
  --t-display: clamp(2.75rem, 6vw + 1rem, 6rem);
}
```

**Optical correction is encoded, not remembered** (`typography I3`):
display `line-height: .95 · letter-spacing: -.02em` · lead `1.35` · body `1.6 · 0` ·
mono label `1.2 · +.12em, uppercase`.

### The rules that bind

| | |
|---|---|
| **T1** | **14px floor on everything functional** (`typography I7`). Captions, plan annotations, spec keys, the legend, the count line, nav — all at `--t-micro` or above. **Mono runs optically smaller at the same px**, so it is never the reason to go under. |
| **T2** | **Uppercase is tracked ≥0.12em and short** (`typography I4`). Labels and act numbers only. Never a sentence, never a paragraph, never a headline. |
| **T3** | **Tabular figures everywhere numbers align** (`typography I5`) — the spec plate, the A↔B comparison, the count line, prices. |
| **T4** | **Display appears exactly twice** — act 00 and act 07. Two moments of typographic scale on a page of eight acts, and both are the page speaking rather than describing. |
| **T5** | **Measure caps**: body 65ch, lead 45ch, display 20–30ch. Wide viewports get margin, not longer lines. |
| **T6** | **Line breaks are authored** (`typography I6`). `text-wrap: balance` on display and lead, `pretty` on body, and hand-set breaks on the two display lines, which are short enough to deserve them. |
| **T7** | **Casing is applied by role across the whole page**, never to make one section look different. |

---

## 5. Grid

**A real modular grid, stated and visible in the alignments** — `swiss-editorial` owns
this domain, and its position is that the grid *is* the composition rather than a
scaffold under it.

```
12 columns · gutter 24px · page margin clamp(20px, 4vw, 72px)

col   1  │ 2 ────────────────────── 8 │ 9 ──────── 12
      RAIL│          STAGE            │    RECORD
```

| Span | Columns | What lives there |
|---|---|---|
| `rail` | 1 | The Plan Rail. Desktop only. |
| `stage` | 2–8 | The act's subject when it is not full-bleed. |
| `record` | 9–12 | Spec plates, captions, the legend, the count line, annotations. **Present in all eight acts, on the same ground** — this is the structural counterweight to *atmosphere instead of evidence*. |
| `text` | 2–7 | Reading matter. Caps at 65ch inside its span. |
| `field` | **full bleed** | Photography. |

**The one rule that keeps this honest: the field is the only thing allowed to break the
grid, and it breaks it completely.** Full bleed, edge to edge, never a 90%-width
"almost aligned" image. Partial breaks are what make a grid read as decoration behind
content rather than as the composition.

**Vertical rhythm: an 8px baseline.** Every text block, every rule, every plate row
lands on it. The drawing does not — it has its own geometry and forcing it onto a text
baseline would be the grid overruling the subject.

**Responsive.** 12 → 8 columns at 1024px → 4 columns at 640px. The rail leaves the
column set and becomes a 2px position line under the header; the record moves beneath
its stage rather than beside it; the field stays full bleed at every width. **The
governing idea is re-established at each breakpoint, not merely the content** (`C12`).

---

## 6. Spacing

4px base, the documented scale, no magic numbers (`spacing I2`).

```css
--s-1: .25rem; --s-2: .5rem;  --s-3: .75rem; --s-4: 1rem;   --s-5: 1.5rem;
--s-6: 2rem;   --s-7: 3rem;   --s-8: 4rem;   --s-9: 6rem;   --s-10: 8rem;
```

**The logic is EVEN, not bottom-heavy.** Act padding is symmetrical:
`padding-block: clamp(4rem, 9vw, 8rem)` top and bottom, identical.

This sets aside `spacing D2` (bottom padding exceeds top, 1:1.5–1:2) deliberately. The
Anchor's stated behaviour is *even, machine-like intervals — space reads as air in a
room, not as margin on a page*, and the page's meter is eight enclosures at a regular
beat. Bottom-heavy padding would make them read as eight chapters of an editorial,
which is a different page. **Floor: `spacing I1` still binds absolutely** — internal
gaps stay smaller than external ones, and every gap in a stack is set as a component
rather than by hand. The yield is recorded in §14.

**What does not yield:** measure caps (`spacing D3`, backed by `typography I2`), and
`spacing I4` — space scales down on mobile and never collapses. Gutters stay generous
at 390px; that is where the register survives or dies.

---

## 7. Text density

Density is a per-act decision and it is already declared in
[scene-map.md §3](scene-map.md). The system-level rule:

| Density | Acts | What it looks like |
|---|---|---|
| **Near-silent** | 00 · 01 · 04 · 07 | One display line or one caption. The record column carries a single plate. |
| **Composed** | 03 · 05 | A short lead and one spec plate, or one paragraph and a list. |
| **Dense, and ordered** | 02 · 06 | Full record column, legend, comparison, terms. `swiss-editorial` is comfortable with volume — *it organises rather than reduces*, and this is where that matters. |

**Dense is never uniform.** A dense act is ranked by position and register before size,
and its field stays calm around the groups.

---

## 8. Light behaviour

The Anchor's primary instrument, and the page's emphasis mechanism.

| | |
|---|---|
| **L1** | **You can say where the light comes from, in one clause, in every frame.** If you cannot, the frame is not lit, it is exposed. |
| **L2** | **The fall-off is the design.** An evenly dark page has spent its whole instrument on atmosphere and has nothing left for emphasis. There is always a gradient of information inside the darkness. |
| **L3** | **The brightest pixel on the page is always inside a photograph.** The interface never emits light — it reflects the ground. `--ink` at 16.39:1 is the interface ceiling; photographic highlights may go wherever the exposure puts them. |
| **L4** | **One key direction per act**, consistent across every frame in that act. |
| **L5** | **Scale is claimed once** — act 01. Two monuments cancel. |
| **L6** | **Selection is illumination, not decoration.** No glow, no bloom, no emissive edge, no outline. A selected surface is a surface with light falling on it, and it measures 3.91:1 against its unlit neighbour. |
| **L7** | **Temperature changes once, at act 05**, and the change is the meaning — cold machines, warm people, one glazed door between them. |

**Interface elevation does not exist.** Depth is occlusion and light fall-off only. No
drop shadows, no elevation layers, no `box-shadow` anywhere on the page (`U9`,
anti-patterns `D3`).

---

## 9. Image treatment

| | |
|---|---|
| **IM1** | **One grade across the whole library.** One colour temperature (~4000K interior LED, ~2700K for act 05), one contrast curve, one black point. The compound has one lighting design and the page inherits it. |
| **IM2** | **The black point is lifted to `--void`, never to zero.** Crushed blacks throw away the gradient of information L2 requires, and a photograph whose shadows are `#000` is a photograph that has been made to match a bad interface. |
| **IM3** | **Crops commit.** Frames crop *through* the subject rather than around it, and no silhouette is tangent to a frame edge (`C9`). |
| **IM4** | **Crops are authored per breakpoint.** `object-fit: cover` is not a decision. A frame that cannot hold its subject at 390px is re-shot or re-composed. |
| **IM5** | **Text sits in the frame's quiet region**, and legibility is fixed at the background layer — repositioning first, then a directional scrim measured on the composited render, per format (`color I4`, `I6`). **No frosted glass, no translucent panel over imagery anywhere** — the vault records that exact failure on the strongest automotive reference in the library (`vault/rolls-roycemotorcars-com-en-us-home-html`). |
| **IM6** | **No grain, no halation, no chromatic aberration, no vignette.** These are the reflex "cinematic" moves and they are filters. This dialect's position is that *motion blur and dust are physical facts, not filters* — so if the room has dust in the light, photograph the dust. |
| **IM7** | **A render is labelled as a render** in its caption. Non-negotiable, whatever it costs the composition (`GI`). |

### How automotive photography and architecture coexist

> **The car is never the subject and never absent.**

| | |
|---|---|
| **A1** | Every frame containing a car frames it as **occupant**, at the size a car is inside a 30′ × 50′ room. The building is the subject; the car is the evidence that the building's proportions matter. |
| **A2** | **Banned framings**: the low hero angle, the three-quarter beauty shot, the rolling shot, the drone pass, the wet-tarmac reflection, the panning blur. Every one of them makes the car the subject, which inverts the proposition — this business sells enclosure. |
| **A3** | **Level, tripod height, wide, interior-architectural.** The camera stands where a person stands. |
| **A4** | **The one exception is act 04**, where the car appears as a *material* — paint under a raking light — and not as a vehicle. |
| **A5** | **Cars are never on the plan.** The compound drawing shows rooms, not their contents. The only car in the drawing system is the A↔B diagram's scale reference, and it is labelled as one. |

---

## 10. The plan — drawing style

The single most likely place this concept fails is here, by drifting into a map. The
drawing has its own grammar and it is a drawing.

| | |
|---|---|
| **P1** | **Light lines on dark ground** — the negative of a blueprint, and what an architectural model photographed in a dark room actually looks like. It shares the page's ground, so the plan is not a foreign object dropped onto the page. |
| **P2** | **One fixed shallow axonometric axis, ~15° off plan.** Enough to read mass, not enough to become a scene. It never rotates, never orbits, never free-drags. |
| **P3** | **Shallow extrusion.** Buildings are masses with height, not models with roofs. The roadway stays near-planar and slightly lifted (`--roadway`). |
| **P4** | **Minimal context.** The perimeter as one line, the roadway, the masses, and nothing else. **No terrain, no trees, no cars, no water, no sky, no ground texture, no shadows cast onto scenery.** |
| **P5** | **The clubhouse is a distinct mass** with a different roof treatment — verified as an amenity, and drawn as the two masses the published plan shows. **The dealership is also drawn**, as a third civic mass at the west end. *Revised 2026-09-04*: this rule previously banned it as unsourced; the published legend carries `CD · Car Dealership` and the plan draws it, so `CP1` is now satisfied and the ban is lifted. Civic masses are distinguished from the 11 suite buildings by having no bay divisions. |
| **P6** | **Suite subdivisions appear only at level 02**, inside the focused mass, drawn from the party wall outward at `--ink-40` — because a bay division carries information. |
| **P7** | **No floating labels.** All text lives in the record column, connected by a hairline leader to a real anchor point that stays anchored (`DNA60`, `DNA61`). |
| **P8** | **No CAD furniture** — no north arrow, no scale bar, no compass, no grid overlay, no coordinate readout, no `[ 01 / 11 ]` counter, no bracket corners, no crosshairs. A technical-looking mark that measures nothing is this register's own false version. |
| **P9** | **No pins, dots, pills, ticks, swatches or coloured markers anywhere in the plan geometry — including the key beside it.** State is light (a bay that never illuminates), the record, and the word SOLD. This is the rule §3 used to contradict; §3 now defers to it. |
| **P10** | **Geometry is generated from source data, never hand-nested.** Satisfied by `tools/extract-plan.py`, which measures the published site plan and emits `src/data/compound.json`; the drawing is rendered from that file and nothing in it is authored by hand. *Revised 2026-09-04*: the plan has been obtained, so the `INDICATIVE LAYOUT` mark is dropped. |

**What it must feel like:** a premium physical architectural model, photographed —
crossed with a technical drawing that a person who builds things would recognise as
correct. **Not**: Google Maps, Zillow, an availability dashboard, a game map, a sci-fi
HUD, or a CAD viewer.

---

## 10a. The safe-header rule

The header is fixed, transparent and hairline, and content passes beneath it. That is
correct and it stays. What was wrong was the *shape of the pass*: the scrim ran the
bar's own height from .86 to .55 to 0, which left a tall band where copy was dimmed
just enough to fight the wordmark and not enough to read as background. Acts 05 and 06
ghosted through it; acts 00 and 07 put a display line into it.

**One rule, three tokens, applied page-wide:**

```css
--header-h:    72px;   /* the bar — wordmark to hairline */
--header-fade: 44px;   /* the tail, where the scrim falls to nothing */
--header-safe: calc(var(--header-h) + var(--header-fade));
```

| | |
|---|---|
| **H1** | **The scrim is a sibling of the bar and taller than it.** Nearly solid across the text band, then to zero inside 44px. A mass is either behind the bar and unambiguously dimmed, or clear of it. There is no half-veiled middle. |
| **H2** | **No composed mass rests inside `--header-safe`.** Acts 00 and 07 bottom-anchor their display block inside a box that starts below the band, so the block grows downward and can never reach the bar. |
| **H3** | **It stays a directional scrim, not a panel.** No fill, no border, no blur, no `backdrop-filter`, and it never crosses live content at full strength (`U13`, `color I4`). |
| **H4** | **The fix is never whitespace.** Padding a section down to clear a fixed bar is a bar the composition is apologising for. |

---

## 11. Line weight — three weights, and each one means something

Architectural draughting practice, applied literally: **a line's weight states what
kind of edge it is.**

| Token | Weight | Value | Ratio | What it draws |
|---|---|---|---|---|
| `--rule-construction` | 1px | `--ink-16` | 1.53 | Guide lines, dimension extension lines, the grid where it is shown. **Decoration — may never carry information.** |
| `--rule-partition` | 1px | `--ink-40` | 3.46 | Bay divisions, spec-plate rules, table rules, the record column's separators. **Carries information, so it meets the 3:1 UI boundary contract.** |
| `--rule-boundary` | 2px | `--ink-70` | 8.28 | The compound perimeter, the selected object's outline, the focus ring. |

**Three weights, no more.** A fourth weight is a fourth kind of edge, and the drawing
does not have one. Hairlines are 1px CSS at every DPR — chasing 0.5px produces a line
that disappears on half the devices that see it.

**Rules and alignment, never boxes.** There is no bordered container anywhere on this
page. `swiss-editorial`'s position is that a container marks a system boundary, and this
page's system boundaries are the compound perimeter and nothing else. This is what makes
`anti-patterns D4` (boxes where open air and thin rules work) structural rather than
aspirational — and it is what makes a card grid impossible to build by accident.

---

## 12. Numbering, captions and annotations

**Numbering system**

| What | Form | Source |
|---|---|---|
| Acts | `00`–`07`, mono, two digits always, in the header beside the wordmark | The page's own structure |
| Buildings | `01`–`11`, mono, in the record when a building is focused | **Verified** — 11 buildings |
| Suites | **none** | **No numbering system is published.** A suite is identified by type and dimensions — `TYPE A · 30′ × 50′ · 2,430 SQ FT` — which is provenance-safe and the more useful label anyway |

**Captions.** Mono, `--t-micro` (14px), uppercase, `+.12em`, `--ink-70`. In the frame's
quiet region or in the record column — never centred under an image, never in a box.
One caption per frame. Every figure carries its unit.

**Technical annotations.** Hairline leader from the record to a real anchor point;
mono micro-label; value in tabular figures (`DNA60`). **No tooltip bubbles, no rounded
chips, no drop shadows, no coloured tags.** An annotation stays anchored for the whole
act it belongs to (`DNA61`); one that drifts off its feature is worse than no label.
At mobile scale an annotation that cannot be read becomes a list beneath the frame —
never smaller type (`DNA62`).

**Dated figures carry their date in the render** (`CP5`): *98 available · 23 sold · as
of 4 Sep 2026*. The ledger is not the reader's; the render is.

---

## 13. Avoid — mapped to the rule each one breaks

| Avoided | Why it cannot happen here |
|---|---|
| Black + gold luxury cliché | There is no decorative hue in the system. Emphasis is luminance (§3, `color D4`) |
| Generic huge serif luxury type | Two voices, both grotesque and mono. No didone (§4) |
| SaaS gradients | Gradients exist only as light fall-off on the plan's floor plane (`anti-patterns D2`) |
| Excessive blur | Blur is not in the system. Legibility is fixed by repositioning and directional scrims (`color I4`) |
| Glassmorphism | **No translucent surface over imagery anywhere** (IM5, `U13`) |
| Giant rounded cards | No boxes at all. Rules and alignment (§11, `anti-patterns D4`) |
| Cards as the primary composition | The record is a column, not tiles. There is no card component in the system |
| Generic Awwwards minimalism | The page is dense in two of eight acts and carries verified figures throughout (`anti-patterns D10`) |
| Oversized type for fashion | Display appears twice, both times as the page speaking (T4) |
| Decorative UI noise | No HUD, no crosshairs, no counters, no brackets (§10 P8) |

---

## 14. Dialect yields — every one, with its condition

| Rule set aside | Condition | Floor that still binds |
|---|---|---|
| `spacing D2` — bottom padding exceeds top, 1:1.5–1:2 | *"a rhythm the brand already owns"* — the Anchor's mechanical even interval is the page's meter, and eight enclosures at a regular beat is the composition. Bottom-heavy padding would make them read as editorial chapters | **`spacing I1`** — internal gaps stay smaller than external, every stack set as a component |
| `typography D1` — the three-voice didone/grotesque/mono system | *"the deliverable is technical and a single well-chosen family is clearer"* — both selected dialects call for one or two mechanical voices, and a didone over architectural photography is costume. Two voices, seven roles | **`typography I2`, `I8`** — roles bounded, and the second voice states the systemic job the first cannot do |
| `typography D2` — one italic accent word | The grotesque has no true italic worth the move, and the register is deliberately flat and technical. The rule's own yield names both | — |
| `color D2` — smoky desaturated colour as the palette's character | The palette has essentially no chroma at all, which is further than the rule goes rather than short of it | **`color I5`** — the one hue present is derived, de-rated and judged where it lands |
| `spacing D1` — take one step MORE when in doubt | Acts 02 and 06 are density acts, and `swiss-editorial` organises volume rather than reducing it. The rule's own yield covers comparison and scanning at volume | **`spacing I1`, `I4`** |

**No invariant was set aside.** Where one bit, it is recorded in §2 (the split rule
token, and `--ink-45` excluded from the system) and in §3 (the focus ring decided by
measurement rather than by preference).
