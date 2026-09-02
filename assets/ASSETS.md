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
| lion-statue-decimated.glb | ../______3D ASSET LIBRARY/props/statues/lion_statue — original vendor unrecorded | **unknown** | **unknown — do not ship** | default flags, no --scale | Pipeline proof only: 0.9 MB FBX to 0.1 MB glb, 18,956 tris, 1 prim. Delete or replace once a real subject arrives, or find its licence first. |

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

## The library this project draws from

`../______3D ASSET LIBRARY/` holds the shared collection — vehicles, environments,
mountains, props, VDB cloud fields. **Nothing there is web-ready:** it is `.blend`,
`.fbx` and `.obj` at 38-300 MB per folder, and the VDB volumes have no browser
path at all without being baked to a texture atlas or replaced by a shader.

So a library asset is copied into `assets/source/`, converted, inspected against
the budget, and given a row above. The copy is deliberate — the library is not a
dependency of this project, and a project that reaches sideways into a shared
folder breaks the moment it is opened on the other machine.
