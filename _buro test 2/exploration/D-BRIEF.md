# Direction D — HYBRID, INTERACTIVE

## The one question

**Can the real functionality of C survive at A's visual mass?**

C proved the functionality: a persistent control system, a clear level state, and a way
to browse a building with many suites. It paid for that with a docked 396 px device that
never leaves the frame. A proved the restraint: the model is the page, information is
earned by descending, and there is no column, panel or table anywhere. It paid for that
by never having to browse twenty-three suites.

D is the test of whether those two bills can be settled at once.

## The wager

**The register is a rail, not a list.**

Everything else follows from that one move. A list of 23 suites is a column; it forces a
panel, and a panel forces a permanent inspector. A *rail* of 23 marks is 140 px of a
horizontal band — it browses the same 23 suites, hovers and selects them, shows which are
sold, and costs one row of the bottom sill. The moment the register stops being a list,
C's functionality fits inside A's silhouette, and no other compromise is needed.

## The form

One horizontal **sill** on the bottom edge of the stage. No background plate: the stage's
own bottom gradient is its ground, so it reads as type on the photograph rather than as a
bar over it (from A). It has no fixed height — three heights, one per level, and it only
ever grows downward from a registration hairline that crosses the full frame (from B).

- **COMPOUND** — one figure, one strapline, one invitation. ~11 % of the stage.
- **BUILDING** — the register appears. ~17 %.
- **SUITE** — the spec row appears, laid horizontally so it can never become a table. ~21 %.
- **ENTERED** — everything retires to a single line. ~7 %.

The model canvas is full-bleed behind all of it, so the model is never cropped by the
interface; the interface is printed on its lower edge.

## What is borrowed, and from where

| From C | compact instrument logic · browse many suites · reliable text ground · explicit level state |
| From A | model-first hierarchy · minimal visual mass · progressive disclosure · no permanent inspector |
| From B | editorial confidence · the figure set large · architectural callout language · one registration line |

## What this is NOT

Not a dashboard. Not a right column. Not a permanent table. No floating cards. No mono
text used as texture — every mono string in the frame carries a fact, at 12 px or larger.

## What is real

The model, the data and the state logic are the production ones, imported read-only:

    /src/site/compound.js      buildCompound(), TYPE_SPEC
    /src/site/compound3d.js    initCompound3D()

`src/` is not modified. The presentation layer — every rule and every element below the
canvas — is authored here and is D's own, so the exploration cannot leak into production
and production's rejected Act 02 composition cannot leak into the exploration.

## Verdict to reach

If the sill reads as an edge of the picture and the register browses 23 suites without
ever becoming a panel, the answer is yes. If the register has to scroll, or the spec row
has to wrap into two ranks, or ENTER needs a fourth height, the answer is no and C's
docked device was paying for something real.
