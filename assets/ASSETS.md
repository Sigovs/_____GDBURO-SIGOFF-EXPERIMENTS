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
| midnight-division---nfs-unbound-inspired-scene.glb | `assets/source/Midnight+Division+-+NFS+Unbound+Inspired+Scene.blend` — **arrived 2026-09-02 from outside this machine's WORK tree; not from the shared library.** The `+`-separated filename is a download name. Actual vendor unrecorded. | **unknown** | **unknown — do not ship** | default flags | **Over budget:** 2.9 MB, 3,816 tris, 8 prims, 8 mats, 5 textures at 2048px. `DNA73` caps mobile textures at 1024px. Needs `--texture-size 1024`, or the hero split out to load alone. **See the derivative-work note below — this one is not only a licence question.** |
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

> **Licence status of the shared library, recorded 2026-09-02 on Alex's statement:**
> everything in `../______3D ASSET LIBRARY/` is royalty-free and free to use.
> That covers the licence column for library assets. It does **not** cover an
> asset from anywhere else, and it does not cover the per-vendor attribution some
> royalty-free licences still require — where a vendor is known, name it in the
> origin column so attribution stays possible.

> **The KR 700 PA licence was confirmed by Alex on 2026-09-02:** obtained free
> from CGTrader under its Royalty Free License, and cleared for this project. The
> `midnight-division` asset below is still unresolved and is not used on any page.

> **`midnight-division` carries a second question the licence column cannot
> answer.** The file names itself *NFS Unbound Inspired Scene* — it is a
> derivative of a real, current commercial product. A permissive licence from
> whoever modelled it governs *their* work; it does not grant anything about the
> property it derives from, and a fan asset shipped on a commercial page is a
> different exposure from a fan asset opened in Blender. This is Alex's call and a
> factual one, not a taste one. It is flagged here rather than in a report because
> a report is read once and this file is read every time the asset is picked up.

> **The library path in this document does not currently resolve.**
> `../______3D ASSET LIBRARY/` was not found from this machine on 2026-09-02, so
> the origin cell for `lion-statue-decimated.glb` cannot be re-verified here — it
> presumably lives on the Mac or on external storage. Recorded so the gap is
> visible; the row is not being downgraded on the strength of a failed `ls`.

## The library this project draws from

`../______3D ASSET LIBRARY/` holds the shared collection — vehicles, environments,
mountains, props, VDB cloud fields. **Nothing there is web-ready:** it is `.blend`,
`.fbx` and `.obj` at 38-300 MB per folder, and the VDB volumes have no browser
path at all without being baked to a texture atlas or replaced by a shader.

So a library asset is copied into `assets/source/`, converted, inspected against
the budget, and given a row above. The copy is deliberate — the library is not a
dependency of this project, and a project that reaches sideways into a shared
folder breaks the moment it is opened on the other machine.
