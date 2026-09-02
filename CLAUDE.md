# Buro Lab — 3D / Scroll

> Built to Alex's design system. The rules are **not vendored here** — they are
> resolved live, so this project never drifts from a stale copy.

# DESIGN DNA

**Read before producing anything visual** — a page, a component, a scene, CSS,
tokens, an image — and before any art direction, palette, type scale, spacing
ramp, motion or composition decision.

1. `C:\____WORK\_____GDBURO SIGOFF\design_dna\TASTE.md`
   — the manifest: operating rules, the two tiers, the Design Read, the dialect index.
2. `C:\____WORK\_____GDBURO SIGOFF\design_dna\.claude\rules\design-dna.md`
   — the build standard, `DNA1`–`DNA89`.
3. `C:\____WORK\_____GDBURO SIGOFF\design_dna\skills` — load the skills the task actually touches.
4. Fallback if this machine has no working copy: https://github.com/Sigovs/design_dna

**Say which path resolved, in one line, at the top of the report.**

## For scroll-driven or cinematic work

Load the **`scroll-site`** skill first. It carries the stack, the scaffold, the
concept gate and the definition of done.

## The concept gate

**`BRIEF.md` is complete before the first line of markup (`DNA1`).** An empty
section in it is an unfinished gate, not a detail to fill in later.

## Order of authority

1. Truth and access — contrast, provenance, reduced motion, discoverability.
2. `TASTE.md` and the INVARIANT tier of the skills.
3. The build standard, `DNA1`–`DNA89`.
4. The selected dialect, and this project's own direction below.
5. Plugins — `frontend-design`, Scrollcraft, `threejs-webgl`,
   `gsap-scrolltrigger`. **Reference only. They bind nothing** and are never the
   reason for a design decision. Neither is a library name.

## Working style

Never ask yes/no or confirmation questions to resolve taste — make the senior
call and note it in the report. Questions about **facts** — scope, content,
constraints, contradictions, missing assets — are expected. Three at most.

## Project direction

_A project direction is a brief executed inside the invariants, never instead of
them._

**Recorded 2026-09-02, on Alex's direct instruction. Not inferred from anything.**

> **Elegance, precision and visual satisfaction come first.**
>
> Judge every decision not by whether it works technically, but by whether it is
> a pleasure to look at **in every intermediate frame**.

### The ranking

| | | |
|---|---|---|
| 1 | **Elegant composition** | the arrangement itself |
| 2 | **Precise visual plasticity** | how forms, edges, weight and surface are handled |
| 3 | **Visually satisfying motion** | the movement is pleasurable, not merely functional |
| 4 | **Cinematic depth and continuity** | the space is coherent and travels unbroken |
| 5 | **Legibility of the story** | the visitor follows what is being said |
| 6 | **Technical implementation** | the means |

**This is a ranking of what the invariants leave open, not a licence to go under
them.** It settles genuine ties — when a cleaner composition and an easier
implementation disagree, the composition wins, and nobody has to ask. Three notes
on where it does and does not reach:

- **The intermediate-frame test is already the standard, and it is the strictest
  one in the system.** `MJ4` — every frame a visitor can stop on is a designed
  frame — and `DNA87`, which reviews the scroll by *stopping* at ~8 positions and
  judging each as a composed frame. Ranking it first is not a new demand; it makes
  the existing one the operative test of this project. A page that only reads at
  full speed is a video the visitor is not allowed to pause, and it fails here.
- **Rank 5 has a floor that rank 1 cannot push through.** The first screen says
  what this is, or the Read declares that withholding it is the subject (`C18`);
  the means of the visitor's task survive the composition (`C14`); comprehension
  never waits on choreography (`MJ7`); no scene gates the first read (`DM2`).
  Below those, story clarity yields to the four above it. At them, it does not.
  Ranking legibility fifth orders *how much room* the story gets — never whether
  the visitor can tell what they are looking at.
- **Rank 6 is not permission to miss the performance and access floors.** They are
  layer 1 and 2, above this direction entirely (`DNA72`–`DNA81`, `DM3`, `DM5`,
  `color I1`). In practice they do not compete with rank 3 anyway — they serve it.
  A scene that drops frames, tears on a resize, or hitches at a seam is not
  technically imperfect and visually satisfying; it is visually unsatisfying, and
  it fails at rank 3 before anyone reaches rank 6.

**What this direction does not decide.** The aesthetic family, the dialect, the
mandate and the dimensionality role are the Design Read's to declare in
`BRIEF.md`. "Elegant" is a standard, not a family (`DNA2`), and it does not
silently become `auction-editorial` — an absent brief is not a compatible brief.

### Business goal, audience, what must not change

TODO — the gate is still shut without these. They are facts, not taste, and they
are the one thing this file cannot decide on Alex's behalf.
