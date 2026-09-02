# Buro Lab — 3D / scroll base

A base, not a page. The engine, the asset pipeline and two instruments; the site
itself does not exist yet and will not until `BRIEF.md` is complete (`DNA1`).

```
npm install
npm run dev        http://localhost:5180
```

| | |
|---|---|
| `/` | the workshop door — replaced by the site's index once there is one |
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

## What is not here yet, on purpose

Tokens, type scale, palette, hero, page. The token layer is extracted from the
hero once the hero exists (`PROCESS.md` §4) — inventing it now is how a palette
gets discovered as wrong at the one moment it matters.
