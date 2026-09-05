# The engine — what it already holds, and what it deliberately does not

This is a base, not a page. Its job is that the ordinary 3D mistakes are already
impossible or already visible, so the work left is the design work.

The rule identifiers below are `DNA1`–`DNA89` in the build standard and the skill
codes in `TASTE.md`. They are cited, never restated — the authority is that file.

---

## The map

```
src/engine/
  loop.js          one rAF for the page; idles on hidden tab and offscreen canvas
  stage.js         renderer, scene, camera, resize, teardown, colour management
  environment.js   HDRI + PMREM, and a three-point rig declared as ratios
  ground.js        contact shadow (rendered + blurred), and a shadow catcher
  materials.js     paint / glass / metal / matte floors, and the intake audit
  camera-rig.js    damped rig — scroll sets a target, damping moves the camera
  shots.js         the seven shots, and the shot list that plays them
  loaders.js       glb + Draco + KTX2 + meshopt, measure / normalise / count
  budget.js        the live draw-call and fps readout, against DNA73's targets

src/motion/
  context.js       gsap.context + scoped selectors + geometry-aware refresh
  media.js         desktop / mobile / reduced branches, never a scaled-down copy
  tokens.js        durations, easings, scrub values — one family for the page
  scroll.js        Lenis, off by default, with the reason written down

tools/
  convert.mjs      Blender headless -> glb -> gltf-transform optimize
  inspect.mjs      the budget table for everything in assets/models/
  decoders.mjs     copies Draco/Basis/meshopt out of three into public/

lab/               the instruments. Not the site, and never shipped as one.
```

---

## What is already handled

| | Where | Rule |
|---|---|---|
| sRGB output, ACES Filmic, exposure as a design value | `stage.js` | `DNA56` |
| DPR capped at 2 desktop / 1 mobile | `stage.js` | `DNA73` |
| resize observed on the canvas, not the window | `stage.js` | — |
| one rAF, shared with GSAP's ticker | `loop.js` | `DNA54` |
| loop stops on hidden tab **and** offscreen canvas | `loop.js` | `DNA75` |
| geometries, materials and textures disposed on unmount | `stage.js` | `DNA75` |
| an environment map is never optional | `environment.js` | `DNA55`, `DNA83` |
| contact shadow as a real render, not a blurred blob | `ground.js` | `DNA59` |
| clearcoat / transmission floors for paint and glass | `materials.js` | `DNA57` |
| unlit and legacy materials flagged at intake | `materials.js` | `DNA83` |
| colour maps sRGB, data maps linear — checked | `materials.js` | `DNA56` |
| camera and target move; nothing spins | `camera-rig.js`, `shots.js` | `DNA49` |
| scroll drives a target, damping drives the camera | `camera-rig.js` | `DNA53` |
| a full-revolution orbit warns in the console | `shots.js` | `DNA49` |
| the shot list's spans **are** the scroll budget | `shots.js` | `DNA38` |
| every act can produce its composed still | `shots.js` | `DNA43`, `DNA79` |
| all motion inside `gsap.context` with a scope | `motion/context.js` | `G1`, `G2`, `DNA46` |
| refresh tied to real geometry change | `motion/context.js` | `DNA47`, `G8` |
| mobile branches rather than scales | `motion/media.js` | `DNA44`, `DNA70`, `G5` |
| durations and easings from tokens | `motion/tokens.js` | `DNA42` |
| smooth scroll off by default | `motion/scroll.js` | `MJ6` |
| draw calls and fps live, against the target | `budget.js` | `DNA72`, `DNA73` |
| payload and texture size checked before the build | `tools/inspect.mjs` | `DNA72` |

---

## What it deliberately does not have, and why

**No page, no hero, no tokens, no type scale.** `DNA1` — no markup before the
concept exists in writing, and `PROCESS.md` step 4: the token layer is extracted
from the hero once the hero exists. A token file written now would be invented,
and an invented palette is the thing that gets discovered as wrong in the hero.

**No post-processing.** Bloom is the first thing reached for and the last thing
needed. It costs a full-screen pass, it is off on mobile anyway (`DNA73`), and a
scene that needs bloom to look lit usually needs its environment map fixed.

**No auto-rotate anywhere except the intake bench**, where the object is being
inspected rather than presented.

**No loading screen.** LCP never sits behind a canvas (`DNA74`), so the first
headline is HTML text that is present in the document and styled to its final
size. A loading screen is what a page builds when it got that backwards.

**No smooth-scroll by default.** See `motion/scroll.js` — the reason is written
where the switch is.

---

## The order the build runs in

From the `scroll-site` skill, and not negotiable by convenience:

1. **`BRIEF.md`** — the concept gate. Design Read, concept, feeling curve, peak,
   grammar, signature move, shot list, mobile shot list, budget, asset origin,
   claims ledger.
2. **The static page.** Real semantic HTML, real content, the full composition,
   **no motion.** If it is not good here, motion will not rescue it (`DNA39`).
3. **Then motion**, once each device has a declared role (`MJ1`).
4. **Then 3D**, if the dimensionality role is MAIN or SUPPORT.

A scene built first becomes the thing the page is arranged around, and that is how
the first read ends up gated on a canvas.
