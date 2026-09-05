# Assets — the provenance ledger

**Every asset gets a row before it is used, not after.** `GI6` (provenance travels
with the file, permanently) and `DNA25`. A row is written when the file arrives,
because origin is the thing nobody can reconstruct three weeks later.

Synthetic imagery never depicts a real product, place or person (`GI3`). If an
asset is generated, that is stated here in the `origin` column, with the model and
the prompt's source in the brief — not "AI".

---

## Models

| file | origin | licence | commercial use | converted | notes |
|---|---|---|---|---|---|
| lion-statue-decimated.glb | ../______3D ASSET LIBRARY/props/statues/lion_statue | royalty-free (stated by Alex, 2026-09-02, for the whole library) | yes | default flags, no --scale | Pipeline proof: 0.9 MB FBX to 0.1 MB glb, 18,956 tris, 1 prim. |
| midnight-division---nfs-unbound-inspired-scene.glb | `assets/source/Midnight+Division+-+NFS+Unbound+Inspired+Scene.blend`. Origin not yet recorded — a download name, vendor unwritten. | _origin not yet recorded_ | — | default flags | **Over budget:** 2.9 MB, 3,816 tris, 8 prims, 8 mats, 5 textures at 2048px. `DNA73` caps mobile textures at 1024px. Needs `--texture-size 1024`, or the hero split out to load alone. Not used on any page. |
| kr700pa-rig2.glb | `assets/robo hand/KR700PA.stp` — **CGTrader, Royalty Free License**, confirmed by Alex 2026-09-02 | Royalty Free (CGTrader) | yes | `tools/step-to-glb.mjs --rig`, then `gltf-transform weld` + `draco` | 442 KB, 137,703 tris, 9 primitives after per-link merge, no textures. Articulated: 9 links, two closed parallelogram loops. Hinge centres derived by `tools/rod-ends.mjs`, link assignment by `tools/rig-assign.mjs`, both recorded in `rig.json`. Validated in `lab/rig.html`: worst rod gap 0.000 mm and worst tool-plate tilt 0.000° across 564 poses. |
| KR700PA-survey.glb | same source, survey export (no --rig) | Royalty Free (CGTrader) | yes | `tools/step-to-glb.mjs`, no --rig | 5.0 MB, 107 solids as 107 flat nodes. An instrument, not a deliverable — the file the rig is authored against. Git-ignored. |

**Columns.** `origin` — where the file came from, by name, with a URL where one
exists. `licence` — the actual licence, not "free". `commercial use` — yes / no /
attribution required. `converted` — the `npm run convert` flags used, so the
conversion is reproducible.

## Environments (HDRI)

| file | origin | licence | what it says about where the object lives |
|---|---|---|---|
| _(none yet)_ | | | |

The last column is not decoration. **What is reflected is a design decision**
(`DNA58`) — a default studio HDRI under a nocturne art direction is a mismatch and
it is visible in the render.

## Textures

| file | origin | licence | colour space |
|---|---|---|---|
| _(none yet)_ | | | |

Colour maps are tagged sRGB, data maps (normal, roughness, metalness, AO) are
linear (`DNA56`). The intake bench flags a file that has this backwards.

---

> **Licensing and provenance are Alex's, and they are settled before an asset
> reaches this repo.** He works across roughly 50 brands and clears rights on his
> side. Recorded 2026-09-02 on his direct instruction.
>
> **This file is a RECORD, not a gate.** Write the row — origin, licence,
> conversion flags — because origin is the one thing nobody can reconstruct three
> weeks later (`GI6`). Write what Alex states as the origin, verbatim, and do not
> annotate it with what such a licence "typically" permits, do not mark an asset
> do-not-ship, and do not raise licensing as a question, a caveat or a blocker
> before a build, a push or a deploy. If a row's origin is blank, ask for the
> origin as a fact — not for permission.

## The library this project draws from

`../______3D ASSET LIBRARY/` holds the shared collection — vehicles, environments,
mountains, props, VDB cloud fields. **Nothing there is web-ready:** it is `.blend`,
`.fbx` and `.obj` at 38-300 MB per folder, and the VDB volumes have no browser
path at all without being baked to a texture atlas or replaced by a shader.

So a library asset is copied into `assets/source/`, converted, inspected against
the budget, and given a row above. The copy is deliberate — the library is not a
dependency of this project, and a project that reaches sideways into a shared
folder breaks the moment it is opened on the other machine.
