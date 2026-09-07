# Buro Lab — INDEX1 · KR 700 PA

## → the four published pages

`index.html` at the top of this folder is the **portal**: every version with a
picture of each, generated from [variants.json](variants.json). Start there.

**https://sigovs.github.io/_____GDBURO-SIGOFF-EXPERIMENTS/_buro%20test%201/**

| | | |
|---|---|---|
| **[The level line](https://sigovs.github.io/_____GDBURO-SIGOFF-EXPERIMENTS/_buro%20test%201/index1.html)** | `index1.html` | six camera stations, the datum in the room |
| **[Monumental](https://sigovs.github.io/_____GDBURO-SIGOFF-EXPERIMENTS/_buro%20test%201/indexA.html)** | `indexA.html` | direction A — the machine as architecture |
| **[Editorial](https://sigovs.github.io/_____GDBURO-SIGOFF-EXPERIMENTS/_buro%20test%201/indexB.html)** | `indexB.html` | direction B — the type is the composition |
| **[Machine film](https://sigovs.github.io/_____GDBURO-SIGOFF-EXPERIMENTS/_buro%20test%201/indexC.html)** | `indexC.html` | direction C — the machine as footage |

A, B and C are three DIRECTIONS taken off index1, meant to be opened beside each
other rather than in succession. They share one bootstrap — `src/site/vboot.js` —
and differ in `src/directions/{a,b,c}.js` and `src/site/dir-{a,b,c}.css`. The
letter names the direction end to end: the direction module, the stylesheet and
the published page all carry it, so there is no mapping between the file you are
editing and the page you are opening.

Their markup is GENERATED. `tools/gen-variants.mjs` writes `src/index{A,B,C}.html`
from one set of beat declarations and one copy of the record table — three
hand-maintained copies of the same measurements is how the measurements drift
apart. The files are committed, because a build must not depend on a generator
having been run by hand; `npm run publish` runs the generator first, so the
output cannot fall behind the declarations.

All of it is served from this folder as part of the repository, which GitHub
Pages publishes whole.

> **A variant is a file, not a branch and not a folder.** `indexN.html` here,
> with its card picture in `previews/indexN.jpg` — the naming every `_buro test`
> uses. The chunks all land in one `assets1/`, because the four pages are built in
> one pass and share three.js, the decoders and the model between them.
>
> This project used to publish variants as folders on a `gh-pages` branch of a separate repository, `gd_buro_tests`. That
> repository is gone and its Pages site answers 404; nothing addresses it any
> more.

> **The SOURCE of the page is `src/index1.html`**, not the `index1.html` you see
> at the top of the folder. They cannot share a path: one is a Vite entry with
> bare imports and `import.meta.glob`, which no browser can run, and the other is
> the build that Pages actually serves. `vite.config.js` sets `root: src/` so the
> build lands on the published name with no renaming step to get wrong.

| | |
|---|---|
| `npm run dev` | the source, at http://localhost:5200/index1.html — index2/3/4.html beside it |
| `npm run publish` | build EVERY registered version in one pass → copy to the top of this folder → rebuild the portal |
| `npm run hub` | rebuild `index.html` alone |
| `npm run shoot` | screenshot every version into `previews/` (`--local` shoots the dev server; `BURO_DEV=…` if it is not on 5200) |
| `npm run new-variant -- index5.html "Name" "note"` | register a version |

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
