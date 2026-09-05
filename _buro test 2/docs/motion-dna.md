# MOTION DNA — _buro test 2

**One system, thirteen rules, one NEVER list.** Read
[interaction-thesis.md](interaction-thesis.md) first: this file schedules in time what
that one decided in space, and it may not be used to justify a device the thesis did
not give a role.

Governing skills: `motion-judgment` (`MJ1`–`MJ11`) decides *whether* · `motion-taste`
decides *how it feels* · `dimensionality` (`DM1`–`DM10`) decides *depth and time* ·
`gsap-implementation` (`G1`–`G8`) binds only once markup exists.

> **Revised 2026-09-04.** The signature is now **PLAN → SELECT → ENTER** (§3a); the
> Plan Rail is persistent architectural language, not the signature; act 02 has three
> levels and act 03 has four locked-camera states; and **no WebGL is loaded on the
> homepage** — the compound is constructed in SVG. Budgets in §13 are revised down
> accordingly.

---

## 1. MOTION READ

```
Subject          A private automotive compound — 121 enclosures and a members' club.
                 NOT temporal. The building does not move; the visitor does.
Journey          arrive → understand the scale → find a suite that fits → stand in it
                 → judge the build quality → meet the club → read the terms → book
Static verdict   PASSES. Eight composed frames, a numbered index, a spec record and a
                 persistent action. With every script removed the page is a complete
                 architectural portfolio with a working enquiry route.
Time adds        (a) The threshold. A cut through an aperture is the only way to say
                     "you are now inside something you were outside of" without a
                     paragraph saying so.
                 (b) The index. 121 states, one selected, four later acts re-pointed —
                     a static page can show a plan but cannot make it yours.
                 (c) Proportion. The car entering the empty room proves a dimension
                     that a caption only asserts.
Register         HEIGHTENED — and the reason is not "luxury". The subject is a place
                 the visitor will never be admitted to before buying, so the page is
                 the only walk-through that exists. The heightened register raises the
                 permitted amplitude; it does not raise the number of ideas (`MJ3`).
Primary idea     THE THRESHOLD. One temporal idea for the whole page: you are being
                 admitted, one enclosure at a time.
Stable           The record column. The persistent header. Body copy. The terms in act
                 06. Every caption. These never animate beyond a 180ms opacity arrival,
                 and nothing loops anywhere near them (`DM9`).
Roles            aperture cut          -> narrative progression  (band 2, structural)
                 plan rail             -> orientation            (band 2, persistent)
                 compound levels 01-03 -> spatial explanation    (band 1, act 02)
                 PLAN -> SELECT -> ENTER -> narrative progression (band 1, SIGNATURE)
                 suite four states     -> narrative progression  (band 1, THE PEAK)
                 light-as-state        -> feedback               (band 3, act 02)
                 record arrival        -> hierarchy              (band 3)
                 hover / focus states  -> feedback               (band 3)
                 door-weight easing    -> subject expression     (band 5, seasoning)

                 Three band-1 systems exist and they never share a viewport: the
                 compound levels end before the signature begins, and the signature
                 lands before the peak's first state (`MJ2`).
Transport        THE READER. No hijack, no forced pacing, no sequence that must be
                 watched out. Two pinned acts, both leavable by scrolling on. The rail
                 is a shortcut, never a replacement for the scrollbar (`MJ6`).
Learning         Nothing is required. The rail explains itself by moving before it is
                 ever asked to be touched. No skip control is needed because nothing
                 delays access to ordinary content (`MJ7`); the header's TOUR and
                 phone are live from the first paint.
Mobile           RE-AUTHORED. The compound is re-drawn as a shallow-perspective
                 interactive plan rather than shrunk; all three levels survive. See §11.
Reduced motion   Authored still per act, act by act, in §10. Not a disabled page.
Cost             Stated plainly, because approving the idea is not approving its price:
                 ≈13.8 viewport-heights of scroll — a long page that a hurried buyer
                 will not finish; two pins, which are the most fragile thing on a
                 real phone; a photographic payload that must be authored, not
                 collected; an act-02 scene that costs a WebGL context for one act;
                 and one genuine attention cost — the aperture cut takes ~640ms of the
                 visitor's advance eight times, which is ≈5s of the page spent on
                 seams. Removed from this line by the 2026-09-04 revision, and worth
                 naming as a cost that is no longer paid: a WebGL context, its
                 decoders, a second frame loop, and an entire class of failure.
Cut              (1) An ENTER gate / gated splash. The single most obvious expression
                     of "members-only", and forbidden: `DM2` (no scene gates the first
                     read) and `MJ7` (the entrance may not be learned).
                 (2) A continuous camera through the whole compound — the previous
                     build's grammar, and it says "tour", not "threshold" (`DNA36`).
                 (3) Engine audio on scroll. Borrowed character, not this subject's;
                     the compound is quiet, which is the point.
                 (4) A drag-to-explore hero. Costs the visitor an attempt, steals the
                     scroll gesture on touch, and answers none of the top three jobs.
                 (5) Scroll-triggered counters on the specification figures. Dramatised
                     numbers are `oilstainlab`'s move, and this page's claim is that
                     the numbers are ordinary facts.
                 (6) Parallax on the photographic field. A second depth idea competing
                     with the aperture cut (`DM6`).
                 (7) A custom cursor. It is the fastest way to make a members' club
                     read as an agency showreel.
                 (8) A WebGL compound. Cut on the evidence, not on principle: the act
                     needs a drawing and not a scene, and the 2D version has to exist
                     anyway as the fallback. One named trigger reverses it
                     (interaction-thesis §14).
                 (9) A free-rotating / orbit-draggable model. It converts a plan into a
                     configurator, steals the scroll gesture on touch, and answers none
                     of the three jobs.
                 (10) Suite numbers ticking up, availability counters animating, a
                     "23 SOLD" figure counting on scroll. Dated facts stated plainly.
```

---

## 2. Primary movement — one idea, and it is the cut

**THE APERTURE CUT is the page's primary movement and its only structural transition.**
Every seam between two acts is a physical opening crossing the frame: a sectional door
lifting, a gate sliding, a shutter dropping, a lift platform passing. The outgoing act
is behind it, the incoming act is in front of it, and the aperture is the event.

| Rule | |
|---|---|
| **P1** | One aperture per seam. Never two apertures in one transition, never an aperture inside an act. |
| **P2** | The aperture's *type* varies by act and its *timing* never does. It is always `--dur-door` (640ms) on `--ease-door`. Variation is in what opens, never in how long it takes. |
| **P3** | The aperture is a real thing in the world it opens onto — a door the building has. It is never an abstract wipe, a mask shape, or a circle. |
| **P4** | The cut is scroll-driven, not autoplayed. The visitor opens every door. Scrubbed with `scrub: 0.6` so it carries weight without lagging behind the input. |
| **P5** | Reversing the scroll reverses the aperture. Doors close the way they opened. |
| **P6** | One primary temporal idea per viewport (`MJ2`). While an aperture is crossing, nothing else on screen animates — not the record, not the rail, not a hover. |

**Why a cut rather than travel:** a compound is a set of enclosures. Continuous travel
says *tour*; a cut through a door says *admitted*. The metaphor is the mechanism.

---

## 3. Secondary movement

Band 2 and below. Everything here is subordinate to the cut and stops when the cut runs.

| | Device | Role | Rule |
|---|---|---|---|
| **S1** | **The rail marker** | orientation | Moves linearly with scroll progress. No easing, no lag — it is an instrument and it must be believed. It is the only element on the page that moves continuously. |
| **S2** | **The record arrival** | hierarchy | A spec plate or caption arrives by opacity 0→1 over `--dur-base` with a 12px upward settle. Once. It never re-arrives on scroll-back. |
| **S3** | **Ground luminance** | continuity | The page's ground shifts between acts as a slow luminance change, never a hue change and never a ground-colour change. It is how the two flat acts (02, 06) announce themselves. |
| **S4** | **Hover / focus** | feedback | Uniform across every interactive element: 90ms, opacity and a 1px hairline gaining weight. No lift, no scale, no shadow. |
| **S5** | **The suite's four states** | narrative progression | Act 03 only, one locked camera. The peak's own timeline; see `C5` in §6. |

**No element outside this table moves.** A device not in the thesis and not in this
table does not enter the build (`DNA35`).

---

## 3a. PLAN → SELECT → ENTER — the signature choreography

**One mechanism, three movements, and the geometry is continuous throughout.** The
same path object is the rail, then the compound, then the selected footprint, then the
mask. Nothing is swapped for a look-alike; if the geometry were re-created at any
stage the visitor would feel the seam even without being able to name it.

### Movement 1 · PLAN — the rail becomes the compound

| | |
|---|---|
| **Anchored** | The rail's own baseline. The drawing grows *from* the line that is already on screen, never fading in over it. |
| **Moves first** | The `viewBox`. A scrubbed tween from the rail's one-column crop to the compound's full extent. This is the camera, and it is the only thing moving for the first 40% of the movement. |
| **Moves second** | Building masses extrude — a scrubbed height tween, staggered 24ms from the entry road outward, capped at eight then arriving together. |
| **Arrives late** | The count line and the legend, by opacity, after the extrusion settles. Text never arrives during travel. |
| **Disappears** | The photographic ground of act 01, occluded by the grade change, not dissolved. |
| **Scrubbed or triggered** | **Scrubbed**, `scrub: 0.6`. The visitor opens the compound at their own rate. |
| **Pinned** | Yes — this is the front of act 02's 2.6vh pin. |
| **Flip?** | **No.** Flip animates a layout change between two DOM states; this is one element's own viewBox and geometry, which a direct tween owns more cheaply and more precisely (`DNA45` — lowest sufficient method). |
| **Masking?** | No. |
| **Character** | A drawing being unrolled on a table. Even, unhurried, no acceleration into the final frame. |

### Movement 2 · SELECT — building, then bay

| | |
|---|---|
| **Anchored** | The compound's full extent and its axis. **The axis never changes** — no rotation, ever. |
| **Moves first** | Light. The focused building's interior faces lift and its neighbours fall away. Nothing translates yet, which is what makes the change read as *illumination* rather than as *navigation*. |
| **Moves second** | The `viewBox` eases in by roughly 25% on the focused mass. A reframe, not a zoom to fill. |
| **Arrives late** | Bay subdivisions inside the focused mass, hairline, drawn from the party wall outward. Then the record. |
| **Transforms** | On bay selection: one bay's interior face lifts to `--bay-lit` and light spills onto the roadway in front of its door. Measured at 3.91:1 against the unlit mass — the activation is visible with no selection border. |
| **Disappears** | Nothing. Subordinated masses stay legible; they lose light, not presence. |
| **Scrubbed or triggered** | **Triggered.** This is interaction feedback, and feedback must answer the input immediately — `--dur-base`, 320ms, `--ease-enter`. Binding selection to scroll would take the choice away from the visitor. |
| **Pinned** | Still inside act 02's pin. |
| **Flip?** | **Yes, on the record column only** — the rows change count and content between compound / building / suite, and Flip animates a layout change nobody had to author. Not on the drawing. |
| **Masking?** | No. |
| **Character** | A hand moving a lamp across a physical model. |

### Movement 3 · ENTER — the footprint becomes the door

**The one moment in the page where the drawing becomes the photograph, and the whole
signature is judged on it.**

| | |
|---|---|
| **Anchored** | The selected footprint's centre. It is the fixed point the entire movement is composed around, and it does not drift by a pixel. |
| **Moves first** | The rest of the compound, outward and down in luminance — the surroundings leave before the subject moves, so the visitor's eye is already on the footprint when it starts. |
| **Moves second** | The footprint enlarges along its own axis, scrubbed, until its inner edge reaches the frame. It stays a *drawing* for the whole enlargement — hairline weight, no fill. |
| **Transforms** | At the moment the footprint's inner edge passes the viewport, it becomes a **`clip-path` on the photographic layer**. The room is already loaded and already composed behind it; the footprint is not revealing a transition, it is revealing a frame that was always there. |
| **Arrives late** | The hairline outline dissolves — last, and alone, over `--dur-settle`. The drawing is the final thing to leave, which is what makes it read as having *become* the room rather than having been replaced by it. |
| **Disappears** | The compound, the legend, the count line, the surveyed ground. |
| **Scrubbed or triggered** | **Scrubbed.** The visitor walks through their own door. |
| **Pinned** | This is the hand-off between act 02's pin and act 03's. **Only one is active at any moment** (`DNA47`) — 02 releases before 03 takes hold, with the composed frame carrying the seam. |
| **Flip?** | **No** — and this is the interesting rejection. Flip is the reflex answer for "an element becomes a bigger element", and it is wrong here: Flip interpolates a box, and what has to interpolate is a *clip region on a different layer*. Flip would animate the drawing to the photograph's position; it would not make the drawing be the aperture. |
| **Masking?** | **Yes — this is the technique.** `clip-path` driven from the same path data the drawing uses, so the mask is not an approximation of the footprint, it *is* the footprint. |
| **Three.js?** | **No, and it would make this harder.** From WebGL the footprint has to be projected to screen space and handed to the DOM before the mask can exist. The 2D path already lives in the coordinate space the mask needs. |
| **Character** | Inevitable. Slow to break, continuous through, and it resolves rather than arrives — `--ease-door` on the settle. |

**The rule this whole sequence exists to satisfy:** *not* click card → modal → next
section. There is no modal, no route change, no new page, and no moment where the
visitor is somewhere they did not walk to.

---

## 4. Text behaviour

| | |
|---|---|
| **T1** | **Display lines enter by line, never by character.** SplitText splits to lines; a mask reveals each line upward from a hard edge — the edge is a door lintel, not a soft fade. 60ms between lines, maximum four lines, then the rest arrive as one. |
| **T2** | **Functional text does not perform.** Captions, spec plates, terms, labels and the record column arrive by opacity only, over 180ms, with no travel. Reading matter is never choreographed. |
| **T3** | **No text animates while an aperture is crossing** (`P6`). Type arrives *after* the door has finished, on the composed frame. |
| **T4** | **No kinetic type, no scrambles, no counters, no marquees, no letter-spacing animation.** The register is a building, not a manifesto. |
| **T5** | **Nothing enters twice.** A line that has arrived stays arrived for the session. Re-triggering on scroll-back is the single most common way a cinematic page starts feeling cheap. |
| **T6** | **Type is never the thing being scrubbed.** Scroll may reveal a line; scroll may not hold a line half-drawn — every stoppable frame is a designed frame (`MJ4`), and half a headline is not one. |

---

## 5. Image behaviour

| | |
|---|---|
| **I1** | **Images do not move.** No Ken Burns, no parallax, no scale-on-scroll, no tilt. A photograph of a room is a composed frame and moving it makes it a worse one. The page's movement budget is spent on doors. |
| **I2** | **Images arrive by aperture only** — they are revealed *by* the cut, never by a fade-up of their own. |
| **I3** | **Crops are authored per breakpoint, never `object-fit`d.** A frame that cannot hold its subject at 390px is re-shot or re-composed, not cropped by the browser (`hero declaration`, `C12`). |
| **I4** | **One grade across the whole library.** One light temperature, one contrast curve, one black point. The compound has one lighting design and the page inherits it. |
| **I5** | **A caption belongs to its frame** and sits in the frame's quiet region — never over the subject, never centred, never in a scrim box unless the scrim is measured on the composited render (`color I4`). |
| **I6** | **Loading is a matched placeholder** — the frame's own average tone at its own aspect ratio, no skeleton shimmer, no blur-up bloom. The placeholder matches what replaces it in picture as well as in box (`motion I6`). |

---

## 6. Camera behaviour

Shots use the seven-word vocabulary (`DNA27`, `DNA50`). **Each act names exactly one.**
Six of the eight acts are photographic, where "camera" means the frame the photographer
chose and the sequence of frames the cut moves between; act 02 is the only act with a
real camera in a real scene.

| Act | Shot | What actually moves |
|---|---|---|
| 00 ENTRY | **reveal** | Frame holds; the subject is discovered by light rather than approached |
| 01 ARRIVAL | **dolly** | Lateral travel along the frontage, the target tracking — the only lateral movement on the page |
| 02 COMPOUND | **interruption** | A hard grade change: photographic dusk cuts to a surveyed drawing. Then the `viewBox` is the camera for three levels — it translates and scales, and **the axis never rotates** |
| 03 THE SUITE | **push-in** | The push happens *in the transition*; the act itself is a **hold**. One locked camera, four states — see `C5` below |
| 04 MACHINE / SPACE | **macro** | Short distance, narrow field, one junction at a scale the eye cannot get in person |
| 05 THE CLUB | **orbit** | A short arc at fixed radius around the bar. An arc, never a revolution |
| 06 COMMUNITY | **interruption** | The second and last grade change, back to surveyed ground |
| 07 PRIVATE TOUR | **release** | The camera settles, damping resolves, motion stops on a composed frame (`DNA30`) |

| | |
|---|---|
| **C1** | **The camera moves; the model does not spin** (`DNA49`). This binds act 02: the plan is never a rotating object. |
| **C2** | **Scroll drives a target value; damping drives the camera** (`DNA53`). Never bind a transform directly to scroll position. |
| **C3** | **The axis is fixed and near-orthographic** (`DNA51`). Act 02's compound sits on one shallow axonometric axis and never rotates, never orbits and never free-drags — perspective on a plan is a lie about what kind of object it is, and a rotatable plan is a configurator. The `viewBox` may translate and scale; it may not turn. |
| **C4** | **`interruption` is used exactly twice**, both times to change register from photographic to surveyed. That repetition is the page's meter, not a shortage of ideas. |
| **C5** | **The peak is ONE LOCKED CAMERA and four states** (`MJ10`). The viewpoint never moves for the whole act; the space changes inside it. **DELIVERED** (*what you are given*) → **GARAGE** (*what it holds, at true proportion*) → **LOUNGE** (*what the second level becomes*) → **PERSONALIZED** (*what someone made of theirs*). Four truths, no repetition at different intensities. The locked camera is the mechanism: customisation is only legible if the frame does not move. |
| **C6** | **Cross-state motion is a dissolve between two identical frames, never a move** — *when the frames are in fact identical.* Each state arrives by a masked wipe along one architectural edge already in the photograph, so the change reads as the room being re-dressed rather than as two pictures being swapped. **This rule is suspended until same-camera assets exist — see `C6-TEMP` below, which overrides it.** |
| **C7** | **States 3 and 4 are asset-dependent.** If LOUNGE and PERSONALIZED photography does not arrive, the act is two states at 2.4vh. It is not filled with renders, and the choreography is written so that removing states 3–4 leaves states 1–2 complete. |

### `C6-TEMP` — the Act 03 rule, locked 2026-09-05

> **The four suite-state assets do not share one camera. Until they do, motion may not
> choreograph them as a spatial morph.**

The four states are a stand-in and three published developer renders shot from three
different viewpoints. `C5` asks for one locked camera because customisation is only
legible if the frame does not move — and no amount of easing makes four viewpoints into
one. **A convincing morph across them would be motion asserting a spatial continuity the
assets do not have**, which is the page lying about its own evidence, on the one act
where evidence is the whole argument.

**Permitted, until same-camera frames exist:**

| | |
|---|---|
| **hold** | the default. A state arrives and stays. Stillness is a choice here, not an absence |
| **cut** | an instant change on scroll. Honest about the discontinuity |
| **restrained crossfade** | short, low-amplitude, no scale and no travel underneath it |
| **masked editorial transition** | a wipe that reads as a *page* device — a band, a column edge — and explicitly not as a camera move within one room |

**Forbidden while the mismatch stands:** scale-matching between states · position-matching
of architectural features · a scrubbed morph · parallax under the crossfade · any easing
whose purpose is to make two viewpoints feel like one · a "camera settling" gesture at
the seam.

**When it lifts.** Four frames from one position, one lens, one light. At that moment
`C6` resumes, `C6-TEMP` is deleted rather than relaxed, and the choreography that `C5`
already specifies becomes correct without restructuring — nothing in the markup assumes
the current mismatch.

**Why it is a rule and not a note:** the mismatch is invisible in a still and only
appears in motion, so it is exactly the defect a motion pass would introduce while
believing it was improving the act.

---

## 7. Scroll behaviour

| | |
|---|---|
| **SC1** | **The reader keeps the transport** (`MJ6`). No hijacking, no snap between acts, no section that cannot be left by continuing to scroll. |
| **SC2** | **Native scroll owns the position. There is one scroll authority and no smoothing layer.** *Revised 2026-09-05 — this rule previously specified Lenis, and the first motion prototype rejected it.* Three reasons: the declared character is heavy, mechanical and **precise**, and the weight is authored in `--ease-door` rather than borrowed from momentum, where eased scrolling reads as *floaty* — which is on the NEVER list by name; the rail is an instrument bound to `scrub: true` by `SC3`, and a smoothing layer puts a second, eased position between the wheel and the marker it reports; and it is not load-bearing, because the reduced-motion path already runs without it. `scroll-site` prefers Lenis by default and that preference is **set aside here, recorded rather than silent**. `ScrollSmoother` is never present either. `window.scrollTo` works, including in tests. |
| **SC3** | **`scrub` is a decision** (`DNA48`). Apertures: `scrub: 0.6` — lag with weight. The rail marker: `scrub: true` — exact, because it is an instrument. Nothing else is scrubbed. |
| **SC4** | **No snap anywhere.** The acts are not discrete states the visitor chooses between; they are rooms passed through. |
| **SC5** | **Motion binds to roles, not to instances** (`MJ11`). Sections declare what they are (`data-act`, `data-aperture`, `data-record`) and the system reads that. Only act 00's arrival may be bound by name, because it is the page's arrival. After load, the system asserts it took hold — a silent no-op is indistinguishable from a page where motion was never designed. |
| **SC6** | **Fast scroll, reverse scroll, interrupted scroll and keyboard scroll are the four tests**, and all four must leave every act legible (`MJ4`). |

### Scroll budget (`DNA38`, `DM3`)

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

**Measured on the built page at 1440×900, not estimated.** The full audit and the
reason the figure moved from ≈13.8 is in [scene-map.md §2](scene-map.md); the short
form is that the original number never counted the footer and under-estimated the terms
act, and both of those are verified content rather than slack.

---

## 8. Pinning

| | |
|---|---|
| **PN1** | **Two pins on the page, and never two at once** (`DNA47`). Act 02 and act 03. Every other act scrolls normally. |
| **PN2** | **A pin must deliver a new truth per screen of scroll it consumes** (`MJ10`). Act 02 pins for 2.6vh and delivers three levels — compound (*scale and organisation*) · building (*granularity*) · suite (*specificity*). Act 03 pins for 3.4vh and delivers four states. A pin that advances the story by one line is a page that has stopped. |
| **PN2b** | **The two pins hand off; they never overlap.** Act 02 releases as the ENTER movement completes, and act 03 takes hold on the composed frame. At no scroll position are both pinned (`DNA47`), and the hand-off is tested at fast scroll and at reverse scroll specifically. |
| **PN3** | **Honest `pinSpacing`. No nested ScrollTrigger inside a scrubbed timeline. `invalidateOnRefresh` on anything measured. Refresh tied to real geometry change, not to every resize event** (`G8`). |
| **PN4** | **No pins on mobile.** Both pinned acts become sequences of full-screen frames there; see §11. |
| **PN5** | **A pinned act is always leavable by scrolling on.** Neither pin waits for a completion. |

---

## 9. Timing, easing and stagger

### Duration tokens — the whole scale, and nothing off it (`motion I3`, `DNA42`)

```
--dur-instant   90ms    state confirmed, focus ring
--dur-quick    180ms    hover, functional text arrival
--dur-base     320ms    UI state change, record arrival
--dur-door     640ms    THE APERTURE — the page's signature duration
--dur-settle  1200ms    an act's composed frame settling after a cut
```

Five values. A duration not on this list does not ship (`U5`).

### Easing

```
--ease-enter  cubic-bezier(.16, 1, .30, 1)     entrances — a strong out
--ease-exit   cubic-bezier(.70, 0, .84, 0)     exits — in
--ease-door   CustomEase "M0,0 C0.12,0 0.20,0.28 0.36,0.62 0.52,0.90 0.70,1 1,1"
                                               slow to break, fast through, long settle
--ease-linear none                             scrubbed instruments only
```

| | |
|---|---|
| **E1** | **Entrances ease out; exits ease in.** No exceptions, and no `ease-in-out` anywhere. |
| **E2** | **`--ease-door` carries the page's character.** It is mass: a heavy thing that resists starting and takes time to stop. It is used on apertures and on nothing else — one weighted transition asserting mass is `cinematic-industrial`'s signature, and a second one dilutes it. |
| **E3** | **Scrubbed motion is linear** unless the concept explicitly wants weight. Here it does, on exactly one thing: the aperture. The rail is linear. |
| **E4** | **No bounce, no elastic, no overshoot, anywhere.** A building does not overshoot. |

### Stagger

| | |
|---|---|
| **ST1** | **Stagger only where the order means something.** The plan's suite rows are numbered and sequential, so they stagger. A list of amenities has no inherent order, so it arrives as one mass. Staggering unordered items is a claim about sequence that the content does not support. |
| **ST2** | **Display lines: 60ms, maximum four.** Line five onward arrives with line four. |
| **ST3** | **Index rows: 24ms, capped at eight.** Row nine onward arrives together. 121 items staggered at any interval is an animation the visitor has to wait out. |
| **ST4** | **Total stagger span never exceeds 400ms**, whatever the item count. When the cap and the span disagree, the span wins. |
| **ST5** | **Stagger direction follows the eye path** — down and to the right, never from a centre, never random, never `from: "random"`. |

---

## 10. Overlaps

Two meanings, both governed.

**Timeline overlap — inside one act.**

| | |
|---|---|
| **O1** | **A timeline has one subject** (`DM8`), nameable in one sentence. Act 03's is *the room becomes yours*. |
| **O2** | **Overlap by relative position, never by absolute time.** Tweens are placed at `"<"`, `"-=0.2"`, `">"`. Absolute seconds inside a scrubbed timeline break the moment a duration changes. |
| **O3** | **Maximum two properties in flight on one element.** Opacity and one transform. Never opacity, transform, filter and clip-path together — that is a state nobody composed. |
| **O4** | **Nothing overlaps the aperture** (`P6`). The door owns its 640ms alone. |

**Chapter overlap — between two acts.**

| | |
|---|---|
| **O5** | **Acts do not cross-fade.** The outgoing act is occluded by the aperture, not dissolved through. Cross-blur between chapters is banned by name — `vault/morningstar-ventures` records exactly this weakness: *"the page can stop on long transitional frames where the outgoing text is heavily blurred and the incoming content is still faint."* |
| **O6** | **Every 25 / 50 / 75% frame of every seam is legible and identifiable** (`MJ4`). Mid-cut, the visitor can always tell which room they are in and read whatever type is on screen. |
| **O7** | **The persistent header never goes opaque over live content** (`U13`). It stays a hairline and a wordmark for the whole page; the only thing that changes across a seam is the act number beside it. |
| **O8** | **One overlay over content at a time** (`U10`). The plan rail, the header and any future consent layer are counted in the mass scheme, not added on top of it. |

---

## 11. Mobile — authored separately (`MJ8`, `DM10`, `DNA44`)

Not the desktop page at a smaller size. Re-decided, item by item.

| | |
|---|---|
| **M1** | **The compound is re-authored on mobile, not shrunk — and it survives.** Removing WebGL removed the reason it had to be absent. Desktop is a shallow axonometric compound; mobile is a **clean top-down / very shallow-perspective plan**, taller than it is wide, with the roadway running vertically. Same drawing grammar, same light-as-state language, same three levels, different projection. A 121-bay axonometric is unreadable at 390px; a top-down one is not. |
| **M1b** | **Level 02 does the work on mobile.** The compound level fits fewer bays legibly, so the building level is where a phone visitor spends their time — the `viewBox` reframes to one building and the bays are tappable at ≥44px. Selection is also reachable as a plain list beneath the drawing, which is the same control, not a substitute one. |
| **M2** | **No pins.** Both pinned acts become sequences of full-screen frames; act 03's four states become four frames the visitor scrolls through, in the same order, delivering the same four truths. Act 02's three levels survive as three frames plus a tappable list. |
| **M3** | **The rail becomes a 2px position line at the top edge**, under the header. It still moves with scroll and it is still not the centre of anything. |
| **M4** | **Aperture duration drops to 420ms.** The travel is shorter, so the same 640ms reads as sluggish rather than heavy. |
| **M4b** | **The ENTER movement is re-authored, not scaled.** On desktop the footprint enlarges into a mask. On mobile the footprint fills the width first, then the mask opens vertically along the door line — one axis instead of two, because a two-axis expansion at 390px lands as a flash rather than as a door. |
| **M5** | **Every full-bleed frame has a separately authored portrait crop.** No `object-fit` decisions, no hidden imagery (`U7`). |
| **M6** | **Content parity is absolute.** Every fact, every figure, every route present on desktop is present here, re-composed rather than removed. |

---

## 12. Reduced motion — an authored state, act by act (`DM4`, `MJ9`, `motion I1`)

Not a switch that disables the page. Each act has a still that carries the same meaning.

| Act | The authored still |
|---|---|
| 00 | The lit-aperture frame, complete. Identical to the animated end state. |
| 01 | The frontage as one wide composed frame rather than a lateral pass. |
| 02 | The compound, fully drawn, all three levels reachable, every bay's state visible at once, rows already arrived. **Selection still works — it is a control, not an animation**, and the light-as-state feedback still fires because it is a state change rather than a motion. |
| 03 | **GARAGE**, not DELIVERED: the room with the cars in it, spec plate already resolved beside it. The other three states are present as a static row of frames beneath it, captioned, so all four truths still arrive — as composition rather than as sequence. |
| 04 | The macro frame with its measured caption. |
| 05 | One frame of the club, from the arc's midpoint. |
| 06 | Identical in both modes — it never animated. |
| 07 | The composed final frame with the action live. |

| | |
|---|---|
| **R1** | **Apertures become instant cuts**, not fades. The seam is preserved as a change of frame, because the seam is the meaning. |
| **R2** | **No content is hidden, no sequence left unresolved, no control unlabelled.** A reduced-motion path that leaves something behind is a bug (`MJ9`). |
| **R3** | **The rail marker still moves** — it is orientation, not decoration, and removing it would remove information. It moves without easing and without lag. |
| **R4** | **The still is chosen and composed, not sampled.** A frame that reads as "the animation, stopped" is a failed fallback. |
| **R5** | **PLAN → SELECT → ENTER survives reduced motion as a state change.** The compound is drawn; selecting a suite lights it; the ENTER step becomes an immediate cut to act 03's composed frame with the selected suite's plate already filled. The signature loses its choreography and keeps every one of its three truths (`MJ9`). |

---

## 13. Budgets, declared before building (`DM3`, `DNA38`, `DNA72`)

| | |
|---|---|
| **Frame rate** | 60fps on desktop; **≥50fps sustained on a 2021 mid-range Android** — the worst device intended to be supported. Measured, not assumed. |
| **Act-02 compound payload** | **≤180KB** for the SVG geometry, gzipped — revised down from a 2.0MB WebGL budget by removing the renderer. It is 121 rectangles, 11 masses and a roadway; if it does not fit in 180KB it has been over-drawn. Path data is generated from the source geometry, never hand-nested. |
| **Renderer** | **None on the homepage.** Three.js is not in the dependency graph — not lazily, not conditionally. This removes ~600KB of library plus decoders, a WebGL context, a frame loop and an entire class of failure. |
| **Total page payload** | **≤4.5MB** on first load, images included, with everything below act 01 lazy — revised down from 6MB for the same reason. |
| **Largest single asset** | **≤700KB** — one photographic frame at its largest breakpoint, AVIF with a WebP fallback. |
| **LCP** | **≤2.0s** on a 4G profile. The LCP element is act 00's photograph, and nothing waits on the canvas (`DM2`). |
| **Frame loop** | One GSAP ticker, shared with Lenis. No canvas, no renderer, no second loop. |
| **SVG cost discipline** | **No SVG `filter` anywhere** — filters are the expensive part and they are what makes a large SVG stutter. Illumination is flat fills, linear and radial gradients, and stroke weight. Only the hovered or selected bay renders its light group; the other 120 are inert paths. |
| **Compound init** | The compound's geometry is inert markup in the document from first paint, and its interaction layer attaches on approach to act 02 — so the drawing is *visible* and *correct* before it is *interactive*, and a failed script leaves a complete plan rather than an empty box (`G7`, `MJ5`). |

**When a budget is exceeded, scope is cut — the budget is not raised.**

---

## 13a. Loading, and how this page fails

**The homepage hero never waits for the compound.** Removing the renderer removed most
of this problem; what remains is stated rather than assumed.

| Stage | What loads | What the visitor has |
|---|---|---|
| **First paint** | HTML, critical CSS, the header, act 00's display lines as real text, and act 00's photograph | **A complete first screen.** The LCP element is a photograph, never a canvas and never an animation (`DNA74`, `DM2`) |
| **Act 00 → 01** | Act 01's plate; the compound's SVG geometry as inert markup | The frontage, and a drawing that is already correct but not yet interactive |
| **Approaching act 02** | The interaction layer attaches; the record's data binds | Selection becomes live |
| **Act 02 → 03** | Act 03's four states, preloaded during the pin | The peak, with no wait at the seam |
| **Below 03** | Everything else, lazily | — |

**The compound's geometry is in the document from the first byte, not fetched.** It is
≤180KB of gzipped path data, which is cheaper than a single photograph, and shipping it
inline buys three things: the drawing is visible and correct before any script runs, a
failed script leaves a complete plan rather than an empty box (`G7`, `MJ5`), and there
is no loading state to design for a thing that is already there.

### The four failure paths, and what each one looks like

| Condition | What happens | What is lost |
|---|---|---|
| **JavaScript fails or is blocked** | Every act renders as its composed frame. The compound draws at level 01 with all states visible. Every route, figure and action works. | The choreography, the levels, and the selection. **No content, and no means of the task.** |
| **`prefers-reduced-motion`** | The authored stills in §12. Selection still works — it is a state change, not a motion. | Sequence, not meaning (`MJ9`). |
| **Slow connection** | Photography arrives progressively behind matched-tone placeholders at the correct aspect ratio. The compound is already there. | Nothing structural — the drawing carries the page while the photographs land. |
| **WebGL unavailable** | **Nothing happens, because nothing uses it.** This is the strongest argument in §14 of the thesis: a failure path that does not exist is better than one that is handled well. | — |

**The one thing that must never happen:** a seam long enough to hide a pending asset
(`DNA66`). If a photograph is not ready, the aperture waits at its composed frame — it
does not stretch.

---

## 14. NEVER

Each entry names the rule it would break. This list is the final gate before any
motion ships, and an item that survives it must be reported as a known compromise.

**Structure and choreography**
1. **Never an enter gate, splash hold, or "click to enter"** — `DM2`, `MJ7`.
2. **Never a preloader that holds the first read** — `DM2`. A progress state may exist; it may not be a door.
3. **Never scroll hijacking, forced pacing, or a section that must be watched out** — `MJ6`.
4. **Never snap-scroll between acts** — `SC4`; they are rooms, not slides.
5. **Never two pinned sections at once, and never a nested ScrollTrigger inside a scrubbed timeline** — `DNA47`.
6. **Never a second primary temporal idea in one viewport** — `MJ2`.
7. **Never a device whose stages repeat each other at different intensities** — `MJ10`.

**The banned effect vocabulary**
8. **Never a generic fade-up.** The entrance vocabulary is aperture and cut; `opacity+translateY` on every section is the default this page exists to avoid.
9. **Never decorative particles, dust motes, embers, floating dots or connected-node fields** — `U3`, and `cinematic-industrial`'s named cliché.
10. **Never lens flares, volumetric smoke, sparks, speed lines or wet-surface neon** — the cinematic effect stack, which is a video-game menu and says nothing about the object.
11. **Never a custom cursor, cursor trail, magnetic button or cursor-following light.**
12. **Never a scroll-driven counter, odometer or number scramble on a specification figure** — `T4`; the facts are ordinary and are set as ordinary.
13. **Never kinetic type, marquees, letter-spacing animation, or character-by-character reveals** — `T1`, `T4`.
14. **Never a horizontal-scroll section** — `U6` on the page, and it contradicts the corridor metaphor besides.
15. **Never parallax on the photographic field** — `I1`, `DM6`.
16. **Never a 3D model that rotates on its own axis** — `DNA49`; that is a configurator, not a film.
16b. **Never a free-rotating, orbit-draggable or gyroscope-driven compound.** The plan sits on one fixed axis. A plan you can spin is a CAD viewer.
17. **Never a card grid that animates in on stagger** — the reference site's structure, and the one the brief names first.
18. **Never glassmorphism, gradient buttons, glow borders or elevation shadows on a page lit by real light** — `U9`, anti-patterns `D2`/`D3`.
19. **Never a black-and-gold accent.** The palette is luminance-driven; gold on black is the cliché the brief names and the one this dialect's false version wears.

**The map — its own banned vocabulary**
19a. **Never a coloured dot, pin, marker or pill on the plan.** State is carried by illumination, by the record, and by a word (`color I2`). Availability dots are the Zillow tell.
19b. **Never a floating label over a building.** All text lives in the record column, keyed by a hairline leader to a real anchor point (`DNA60`, `DNA61`).
19c. **Never a north arrow, a scale bar, a compass rose, a grid overlay or a coordinate readout.** Those are CAD furniture; they measure nothing here and they are the fastest route to the architectural-viewer look.
19d. **Never terrain, trees, cars-on-the-plan, water, sky or a ground texture.** Minimal context is the concept; scenery is the failure.
19e. **Never a neon outline, glow, bloom or emissive edge on a selected mass.** Selection is light falling on a surface, not a surface emitting light.
19f. **Never a zoom-to-fill on selection.** The compound reframes by roughly 25%; it does not fly to a building. A map that flies is a game map.
19g. **Never a HUD** — no bracket corners, no crosshairs, no scanning lines, no `[ 01 / 11 ]` counters, no reticles. A technical-looking mark that measures nothing is the exact false version of the register this page is in.

**Reading and attention**
20. **Never perpetual ambient motion in or beside a reading zone** — `DM9`. Act 06 has no motion in it at all.
21. **Never motion behind body copy, however subtle** — anti-patterns `D9`.
22. **Never re-trigger an entrance on scroll-back** — `T5`.
23. **Never leave a stoppable frame illegible** — `MJ4`, checked at 25 / 50 / 75% of every seam.
24. **Never animate a layout property.** Transform and opacity only; anything else is a measured exception with a stated reason.

**Discipline**
25. **Never a duration or easing value that is not in §9.**
26. **Never a motion system bound to this page's own section names** — `MJ11`; bind to roles, and verify after load that the system took hold.
27. **Never ship a device the thesis gave no role** — `MJ1`. "The section felt empty" is a fear, not a job.
28. **Never let the reduced-motion path lose a fact** — `MJ9`.
29. **Never load a renderer the design does not need.** The compound is a drawing; the decision and its single reversal trigger are in [interaction-thesis.md §14](interaction-thesis.md). Reaching for WebGL because the scene is "spatial" is choosing a technology for how it sounds.
30. **Never choreograph Act 03's four states as a spatial morph** while they remain four cameras — `C6-TEMP`. Motion may not assert a continuity the assets do not have.
31. **Never let the drawing and the mask be different geometry.** The footprint that enlarges and the `clip-path` that opens are the same path data. Two approximations of one shape is a seam the visitor feels without being able to name.

---

## 15. MOTION PLAN — the order of work

1. **Storyboard in plain language.** Eight acts, sixteen frames, in sentences, before any code. If a beat cannot be described it cannot be directed.
2. **Build the static page first, and judge it on its own** (`MJ5`, `DNA39`, `G7`). Real semantic HTML, real content, the full composition, no motion. If it is not good here, motion will not rescue it.
3. **Then motion, at the lowest sufficient method** (`DNA45`): CSS transition → scroll-driven CSS animation → WAAPI → GSAP core → ScrollTrigger. The report states which level each device used and why. The aperture is the only device that starts at ScrollTrigger.
4. **Everything inside `gsap.context()` with reversible teardown and scoped selectors** (`G1`, `G2`, `DNA46`).
5. **Then act 02's scene**, last, and only after the page reads without it.
6. **Test the four scrolls** — normal, fast, interrupted mid-seam, reversed.
7. **Test the four contexts** — desktop, mobile, keyboard only, reduced motion.
8. **Remove what cannot defend its role.** Re-read the `Roles` line in §1 against what actually shipped.
9. **Critique the whole as one rhythm**, not effect by effect: where does it accelerate, where does it rest, and does the rest exist on purpose?
