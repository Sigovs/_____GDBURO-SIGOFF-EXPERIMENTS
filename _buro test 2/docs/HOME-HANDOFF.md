# HOME HANDOFF — Luxe Corsa / `_buro test 2`

Written 2026-09-05 on the work Mac, at the checkpoint tagged
`luxe-corsa-motion-prototype-01`. Everything a fresh Claude Code session on the home
Mac needs in order to continue **without relying on conversation memory**.

Read this first, then the five approved documents listed under **Approved authority**.

---

## Project

**Luxe Corsa — `_buro test 2/`.** A high-end redesign experiment: the private-paddock
concept for a real proposition — 121 private auto suites in 11 buildings, Lake Zurich,
Illinois, with a members' clubhouse. Unaffiliated design study, not a Luxe Corsa
publication, and the footer says so.

The thesis, unchanged since it was approved: *the visitor is not browsing a site about
a private compound — they are being admitted through one.*

---

## Current state

| | |
|---|---|
| **Static page** | approved, all eight acts complete |
| **Motion** | prototype implemented for **Acts 00–03 only**, plus the signature |
| **Acts 04–07** | **intentionally not motion-propagated.** They have apertures and arrival opacity and nothing else. This is deliberate: the grammar is established before it is spread |
| **Aperture containment** | fixed and verified. 4 shells, 0% painted leak, both viewports. **Do not rewrite this system** |
| **Approved scroll budget** | **14.9vh** (measured 14.88 at 1440×900). Do not silently restore 13.8 — that figure never counted the footer and under-estimated act 06 |
| **Act 03** | governed by **`C6-TEMP`** — see below |
| **Three.js** | **rejected** for the homepage compound. Not in the dependency graph. One named reversal trigger only, in `interaction-thesis.md §14` |
| **Scroll** | **native browser scroll.** Lenis rejected — reasons in `motion-dna.md SC2` |

### `C6-TEMP` — the rule that binds Act 03

The four suite-state assets (DELIVERED / GARAGE / LOUNGE / PERSONALIZED) are one
stand-in and three developer renders **from three different viewpoints**. They are not
one camera.

**Permitted:** hold · cut · restrained crossfade · masked editorial transition.
**Forbidden:** spatial morph · scale-matching · position-matching · fake camera
continuity · parallax beneath the crossfade · camera-settling gestures.

It lifts only when four frames from one position, one lens and one light exist — and
then it is **deleted, not relaxed**. Full text in `motion-dna.md §6`.

---

## Current motion stack

```
GSAP · ScrollTrigger · CustomEase · SplitText · gsap.matchMedia()
```

No Flip. No ScrollSmoother. No Lenis. No Three.js.
`gsap.matchMedia()` — **not** the deprecated `ScrollTrigger.matchMedia()`.

One custom ease, `door`, carries the page's character (mass) and is used on apertures
and nothing else.

---

## Approved authority

These five are the decision record. They outrank anything a session remembers.

```
docs/interaction-thesis.md    concept, dialect, signature, the Three.js decision
docs/motion-dna.md            the motion rules, budget, NEVER list, C6-TEMP
docs/scene-map.md             the eight acts, ledgers, asset list
docs/visual-direction.md      palette, type, grid, the plan's drawing grammar
docs/keyframe-storyboard.md   five frozen frames, four transitions
```

Also in-project: `assets/ASSETS.md` — the provenance ledger. Every shipped frame's
origin, and the known compromises.

---

## Design DNA dependency — READ THIS BEFORE THE NEXT DESIGN PASS

The work Mac resolves canonical Design DNA from:

```
/Users/alex/Desktop/WORK/design_dna
```

It holds `TASTE.md`, `.claude/rules/design-dna.md` (`DNA1`–`DNA89`), the `skills/`
tree, the `dialects/` and the `vault/`. **It is not vendored into this project** — by
design, so the project cannot drift from a stale copy.

> **The home Mac must have Design DNA available before the next major design or motion
> pass.** Clone it from `https://github.com/Sigovs/design_dna` and put it where the
> project's `CLAUDE.md` resolution order can find it, or update that order to point at
> wherever it lands. Without it, an agent will produce work that looks finished and
> obeys nothing, with no error to notice — which is the exact failure the DNA repo
> exists to prevent.

---

## Skills / toolchain

**User-scope installations — these live on the machine, not in this repo, and will
need installing again on the home Mac:**

| | |
|---|---|
| `design-dna`, `scroll-site`, and the taste skills | symlinks into `design_dna/skills/`. Come with the DNA clone |
| **official GreenSock `gsap-skills`** | Claude Code plugin. `/plugin marketplace add` + `/plugin install`. This is the GSAP **API authority** for the project |
| **Playwright CLI** | `npm install -g @playwright/cli@latest`, then `playwright-cli install --skills` in the project. Note: on macOS 13 ARM the browser-install step fails on ffmpeg — **browsing still works**, only video recording is unavailable |
| **Genjutsu 3.3.0** | plugin, user scope |
| **Context7 / `find-docs`** | MCP, user scope — used to verify current GSAP/Lenis API behaviour |
| **Chrome DevTools MCP** | user scope — Lighthouse and performance traces |

**Not in this repo, and worth knowing why:** `.claude/` is excluded by a **global**
gitignore on the work Mac (`~/.gitignore_global` line 3, `.claude/`). So the project's
`.claude/settings.json` and the installed `.claude/skills/playwright-cli/` did **not**
travel with this checkpoint. Re-create them on the home Mac with
`playwright-cli install --skills` from the project root. Nothing depends on them at
build time — they are agent tooling, not project source.

**Project-scope, and it did travel:** everything in `package.json`, `tools/`, `src/`,
`docs/` and `assets/`.

`gsap` and `lenis` are both still in `package.json`. **Lenis is installed and
unused** — deliberately, so the decision is reversible; nothing imports it.

---

## Verified state at this checkpoint

Measured, not asserted, at **1440×900** and **390×844**:

- zero console errors, zero warnings
- no horizontal overflow at either viewport
- 4 aperture shells, **0% painted leakage**, both viewports
- no duplicate pin-spacers after a full forward-and-back scroll sweep (2 before, 2 after)
- reduced motion clean — 0 aperture shells, 0 leaves, no overflow
- no-JS baseline usable — `[data-arrive]{opacity:1}` by default, hidden only under
  `.js-motion`, which JS adds
- scroll budget stable at 14.88vh across the sweep

Run the dev server with `npm run dev`. Rebuild assets with `npm run assets`
(`extract-plan.py` then `build-frames.py`); both need Python 3 with Pillow.

---

## Known motion weaknesses to address next

1. **The compound's opening frame is too faint when the camera is tight.**
   `vector-effect: non-scaling-stroke` keeps hairlines at 1px while the shapes are
   larger, so there is less line per unit area and the drawing reads lighter close up
   than it does at rest.
2. **The recognition hold at ~0.38–0.52 of act 02's pin lacks an authored beat.** It is
   currently absence rather than a designed pause, and the recognition — *the line that
   has been following me is this place* — is the act's whole reason to exist.
3. **The ENTER midpoint uses `background-size: cover`**, so mid-transition the visitor
   sees an arbitrary crop of the suite rather than a composed frame. It resolves
   correctly at full open; the middle is unauthored.
4. **Act 03's four source frames use different camera positions.** `C6-TEMP` must
   remain in force until same-camera assets exist. The honest crossfade now makes the
   viewpoint jump *more* visible, which is correct and is not a bug to hide.

---

## Next design / motion step

**Do NOT immediately propagate motion to Acts 04–07.**

In order:

1. Resolve **compound opening legibility** (weakness 1).
2. Author the **recognition hold** (weakness 2).
3. **Re-verify the opening sequence** — acts 00 → 01 → 02 → ENTER → 03, screenshots at
   both viewports, against `keyframe-storyboard.md`.
4. **Only then** decide whether the established grammar is strong enough to propagate
   into Acts 04–07.

The grammar that would travel, if it is: the aperture as the only structural seam;
beats that never land together; the camera as a resolve rather than opacity; one owner
per animated property; selection never bound to scroll; stagger only where an order
exists.

---

## Repository

This project lives inside `Sigovs/_____GDBURO-SIGOFF-EXPERIMENTS`, branch `main`,
alongside `_buro test 1/`, `_buro test 3/` and `dimamid-site/`. That repository's
history and this project's history were **unrelated** and were joined with a merge at
this checkpoint; both are preserved and nothing was rewritten.
