# BRIEF — THE SEAM 02 → 03

Scope: one boundary. Not a redesign of act 03, and not a second peak.
Surface: the integrated review build (`index2.html`). `index4.html` stays the untouched
before, which is the only reason a comparison is worth anything.

---

## 1. Design Read — what is actually there

Three faults, in order of severity. Each was measured on the built page, not inferred.

**F1 · The suite does not survive the cut.** A visitor chooses suite `03 · 01`, Type A,
2,430 sq ft, from $699,000 in act 02. One act later act 03 tells them **Type B,
1,863 sq ft, from $549,000**, and draws the footprint at 23′ × 50′. Verified by
selecting a Type A suite and reading act 03's plate:

    chosen        03 · 01  Type A
    act 02 dock   2,430 sq ft   $699,000   30′ × 50′
    act 03 plate  Type B   23′ × 50′   1,863 sq ft   $549,000
    footprint     Selected footprint · 23′ × 50′

The cause is structural, not cosmetic. `syncPeak()` lives in `main.js` behind
`if (compoundEl)`. The integrated page removes `data-compound` so production's act 02
stands down — and the act 03 wiring goes with it. Nothing reconnects it. The site
contradicts itself about which product the buyer just chose, with a price.

**F2 · The cut has no subject, and the page already has a device for one.** Every other
boundary on this page is an APERTURE, and `motion.js` is explicit about what an aperture
is: *"a real thing in the world it opens onto — a door the building has. Never an
abstract wipe, never a circle."* The types are declared already:

    gate        a gate leaf sliding laterally      00 → 01
    shutter     a shutter dropping to a slot       03 → 04
    glazed      a glazed door swinging through     04 → 05
    sectional   a sectional door lifting           06 → 07
    grade       an interruption, no leaf

Act 02 carries no `data-aperture`. It is the only act on the page with a door in the
frame and no door on its seam.

**F3 · The product is stated twice, in two grammars.** Act 02's dock is a hierarchy:
identity, size, price, action. Act 03's plate is eight rows of equal weight in which
`FROM $549,000` and `ELECTRIC 100 amp service` are typographically the same event, and
there is no action at all. Two surfaces describing one purchase in two registers is the
biggest UI inconsistency on the site.

---

## 2. The concept

**THE THRESHOLD.**

Act 02 now ends OUTSIDE one specific door — ENTER puts the visitor on the apron about
forty feet from suite `03 · 01`, with that leaf lit warm and every neighbour dark. Act 03
begins INSIDE a room. Those are not two subjects. They are one event seen from two sides,
and the thing between them is the door.

So the seam is not a crossfade between editorial plates. It is a passage through an
opening, and the suite the visitor chose is what is on both sides of it.

> You stop at your door. The door lifts. The room is yours, and it says which one.

---

## 3. Reversing a decision that was correctly made

`motion.js` records a deliberate refusal at this seam: *"no morph, no scale-matching, no
position-matching… what is left, and what is permitted, is a cut with a restrained
crossfade, which is honest about the discontinuity."*

That was right, and it is being revisited for a reason rather than overridden: **it was
decided against a different act 02.** When act 02 ended on a drawing of a site plan, a
cut into a photographed interior *was* the honest report of a discontinuity — there was
nothing shared to carry. Act 02 ends at a lit sectional door now. The continuity is real,
so refusing to draw it is no longer honesty; it is a missing device.

Nothing in that refusal is resurrected. No morph, no scale-matching, no
position-matching, no parallax, no camera-settling gesture. The device used is the one
the page already owns, with the leaf it already draws.

---

## 4. What crosses the cut — and what must not

**Crosses:**
- **The suite's identity.** `03 · 01`, its type, its size, its price. This is F1 and it is
  the blocking one: a design that carries a mood across a seam and drops the price is
  worse than one that carries nothing.
- **The door.** Act 02's last frame is a lit leaf; act 03's first frame is behind it. The
  aperture is `sectional` — a door that lifts — because that is the door in the frame.
- **The warmth.** The apron pool is the only warm light in the compound; act 03's rooms
  are warm. The temperature is already continuous. Nothing currently uses it.

**Must not cross:**
- Act 02's dock. Act 03 is a room, not a configurator; carrying the control surface in
  would make act 03 a second act 02.
- The model. It ends at act 02.

---

## 5. The peak is unchanged (`DNA28`)

Act 03 remains the peak: one locked camera, four states, four truths. The seam serves
the arrival into it. If the seam becomes memorable in itself, it is wrong.

---

## 6. Grammar of the record column (`DNA36`)

The plate stops being a spec sheet and takes four ranks. What is on it does not change;
what changes is that it stops pretending eight facts are one fact.

    1  IDENTITY     Suite 03 · 01        Premium · Type A
    2  THE TWO      2,430 sq ft          From $699,000
       NUMBERS      — the pair a buyer actually holds, at display weight
    3  THE REST     footprint · mezzanine · capacity · electric · climate
                    one quiet block, mono, 14px floor, no row heavier than another
    4  ONE ACTION   Arrange to stand in 03 · 01  →

Rank 4 is new and is deliberately not a purchase. The site's own ask is act 07,
*"Come and stand in it"*, and this is a forward link to it carrying the chosen suite.
Nothing is asserted that the source does not support: no reservation, no availability
hold, no deposit (`CP7`).

---

## 7. The move (`DNA37`, `DNA50`)

One shot, named: **RELEASE**. Not a cut and not a transition — a door opening.

    act 02 pin releases with the camera already at the door
       │
       │  the sectional leaf lifts (yPercent -100, ease 'door', scrub 0.6)
       │  — the page's existing aperture, same timing as every other seam
       ▼
    act 03, first state, already carrying the chosen suite

Reversed scroll closes the door, because that is what the existing engine does and doors
close the way they opened.

**Reduced motion:** the aperture engine already turns a leaf into an instant cut rather
than a fade, on the stated grounds that the seam is the meaning. Nothing added here
changes that. F1's fix is not motion and applies in every path.

---

## 8. Budget (`DNA38`, `DM3`)

No new library, no new asset, no new image. One markup attribute pair, one shared module
of about 120 lines, one rewritten record column. The aperture leaf is a `<div>` the
engine already builds.

---

## 9. Claims ledger (`CP1`)

| Claim | Source |
| --- | --- |
| Type A · 2,430 sq ft · from $699,000 | `TYPE_SPEC` in `src/site/compound.js`, verified against luxecorsa.com/vehicle-suites/, read 2026-09-04 |
| Type B · 1,863 sq ft · from $549,000 | same |
| 30 ft and 23 ft bay widths, ratio 1.304 | published unit plans `2plan-A`, `2plan-B`; the footprint notation already draws 46 : 35 = 1.314 |
| Suite reference `03 · 01` | position in the drawing, not an address — no unit numbering is published, and none is invented |
| "Arrange to stand in…" | act 07's own CTA, `tel:+12246620000`. No reservation is claimed. |

---

## 10. Done means (`DNA86`–`DNA89`)

- A Type A suite chosen in act 02 reads as Type A, 2,430 sq ft, $699,000 in act 03 —
  asserted by a test, not by looking once.
- The same for Type B, and for a suite in a different building.
- The seam opened and closed with a real wheel, both directions, no trap.
- Reduced motion opened, and scripts-removed opened.
- AA measured on the composited render for every new text rank, at 1440×900 and
  1280×800.
- `index4.html` byte-identical in act 03 to what it is today.
