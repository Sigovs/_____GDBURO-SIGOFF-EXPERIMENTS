# Buro Lab — INDEX1 · KR 700 PA

## → index1.html

**The page is `index1.html`** at the top of this folder — a built page, published
as it stands:

**https://sigovs.github.io/_____GDBURO-SIGOFF-EXPERIMENTS/_buro%20test%201/index1.html**

`index.html` beside it is the **portal**: every version with a picture of each,
generated from [variants.json](variants.json). Both are served from this folder
as part of the repository, which GitHub Pages publishes whole.

> **A variant is a file, not a branch and not a folder.** `indexN.html` here,
> with its assets in `assetsN/` and its card picture in `previews/indexN.jpg` —
> the naming every `_buro test` uses. This project used to publish variants as
> folders on a `gh-pages` branch of a separate repository, `gd_buro_tests`. That
> repository is gone and its Pages site answers 404; nothing addresses it any
> more.

> **The SOURCE of the page is `src/index1.html`**, not the `index1.html` you see
> at the top of the folder. They cannot share a path: one is a Vite entry with
> bare imports and `import.meta.glob`, which no browser can run, and the other is
> the build that Pages actually serves. `vite.config.js` sets `root: src/` so the
> build lands on the published name with no renaming step to get wrong.

| | |
|---|---|
| `npm run dev` | the source, at http://localhost:5200/index1.html |
| `npm run publish` | build → copy to the top of this folder → rebuild the portal |
| `npm run hub` | rebuild `index.html` alone |
| `npm run shoot` | screenshot every version into `previews/` |
| `npm run new-variant -- index2.html "Name" "note"` | register a version |

### Adding a variant

Register it, build it, shoot it, rebuild the portal. [variants.json](variants.json)
is the source of truth: a name that is not `indexN.html` is refused, and a card
whose file is not on disk says so instead of linking into a 404.

Publishing is a normal commit. There is no second remote, no branch to force, and
nothing that can orphan a folder.

---

Machine study 01: a KUKA KR 700 PA palletiser, reconstructed from a 107-solid
STEP file with no assembly tree, re-articulated on hinge centres derived from its
own rod ends, and shot as six camera stations around roughly 490° of travel. Its
arm sweeps three metres and its tool plate never tilts, and the page exists to
make you see the not-tilting.

```
npm install
npm run dev        http://localhost:5200/index1.html
```

| | |
|---|---|
| `/index1.html` | **INDEX1** — the page |
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
