# Buro Lab — INDEX1 · KR 700 PA

## → index.html

**Click `index.html` in the file tree.** That is the portal: every version, with
a picture of each, and links straight to the published build. It needs no server
and no build — open it as a file.

The same page is published at
**https://sigovs.github.io/gd_buro_tests/** for sharing.

> **The site itself is `index1.html`**, not `index.html`. The portal took the
> index name because that is the file a person clicks without being told to. Run
> the site with `npm run dev`; the deploy renames the built entry back to
> `index.html` inside each version folder, so `/v01-level-line/` still resolves.

| | |
|---|---|
| `npm run hub` | rebuild `index.html` |
| `npm run shoot` | screenshot every version into `previews/` |
| `npm run new-variant -- v02-slug "Name" "note"` | register a version |
| `npm run deploy -- v02-slug` | publish it |
| `npm run deploy -- --list` | what is registered and where |

### Adding a variant

Register it, build it, publish it, shoot it, rebuild the portal. The register in
[variants.json](variants.json) is the source of truth in both directions: an
unregistered slug is refused rather than published as an untitled folder, and a
folder whose entry is deleted is removed by the next deploy.

Each version is published to its own path — `/v01-level-line/` — and both copies
of the portal are regenerated from one template, so they cannot drift.

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
