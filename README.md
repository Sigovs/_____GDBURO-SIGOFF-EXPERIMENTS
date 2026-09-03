# Buro Lab — INDEX1 · KR 700 PA

## → Live

### **https://sigovs.github.io/gd_buro_tests/**

Rig bench: **https://sigovs.github.io/gd_buro_tests/lab/rig.html**

Also in the file tree as `!LIVE-SITE.url` (Windows) and `!LIVE-SITE.webloc`
(Mac) — double-click either. They sort to the top of the file list on purpose,
and they are committed, so the link is there on whichever machine the folder is
opened from rather than living in somebody's chat history.

Deployed from `master` to the `gh-pages` branch of
[Sigovs/gd_buro_tests](https://github.com/Sigovs/gd_buro_tests). Redeploy with
`npm run deploy`.

---

Machine study 01: a KUKA KR 700 PA palletiser, reconstructed from a 107-solid
STEP file with no assembly tree, re-articulated on hinge centres derived from its
own rod ends, and shot as six camera stations around roughly 490° of travel. Its
arm sweeps three metres and its tool plate never tilts, and the page exists to
make you see the not-tilting.

```
npm install
npm run dev        http://localhost:5180
```

| | |
|---|---|
| `/` | **INDEX1** — the page |
| `/lab/rig.html` | **rig bench** — the articulation, driven directly, one axis at a time |
| `/lab/` | **intake bench** — scale, budget and material audit for an incoming object |
| `/lab/shots.html` | **shot bench** — the seven shots, driven by scroll |

## Bringing a 3D object in

```
cp <thing>.fbx assets/source/      # .fbx .obj .blend .glb
npm run convert                    # Blender headless -> glb -> gltf-transform
npm run inspect                    # the budget table
```

Then open `/lab/` and look at it against the 1 m reference. Add its row to
[assets/ASSETS.md](assets/ASSETS.md) — origin and licence, before it is used.

Nothing in `../______3D ASSET LIBRARY/` is web-ready: it is `.blend`, `.fbx` and
`.obj` at 38–300 MB per folder, and the VDB cloud volumes have no browser path at
all without being baked. Copy in, convert, inspect.

## Where the rules live

Resolved live from `../design_dna` — `TASTE.md`, `.claude/rules/design-dna.md`,
`skills/`. Nothing is vendored here, so this project cannot drift from a stale
copy. See [CLAUDE.md](CLAUDE.md) for the resolution order and
[docs/ENGINE.md](docs/ENGINE.md) for what the engine already handles and what it
deliberately leaves out.

## The concept gate

[BRIEF.md](BRIEF.md) is complete and it was complete before the first line of
markup (`DNA1`). It carries the Design Read, the feeling curve, the peak, the
page grammar, the signature move, both shot lists, the budget and the claims
ledger — including the numbers considered and then *rejected* for want of a
source, which is the half of a ledger that usually goes unwritten.

Every figure on the page was measured from the file in this repository. No
manufacturer specification is quoted anywhere, and the designation's implied
700 kg payload is deliberately absent from the render.
