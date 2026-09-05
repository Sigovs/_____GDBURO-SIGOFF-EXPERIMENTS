#!/usr/bin/env node
// The budget table. DNA72 — the budget is declared before the build; this is how
// it stays declared instead of becoming a postmortem.
//
//   npm run inspect            every .glb in assets/models/
//   npm run inspect -- car     one of them
//
// Reports per file: payload, triangles, meshes, draw-call floor, materials,
// textures and the largest texture — plus a verdict against DNA73's targets
// (desktop under ~100 draw calls, mobile under ~50, mobile textures <= 1024px).
//
// The draw-call figure is a FLOOR, not the count: it is primitives, before
// instancing helps and before transparency, shadows and post-processing add
// passes. A model at the limit here is already over it in a scene.

import { readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, extname, basename } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3d';
import { MeshoptDecoder } from 'meshoptimizer';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = join(ROOT, 'assets', 'models');

const TARGET = { drawCalls: { desktop: 100, mobile: 50 }, mobileTexture: 1024, payloadMB: 6 };

const filter = process.argv.slice(2).filter((a) => !a.startsWith('--'));

if (!existsSync(MODELS)) {
  console.log('inspect: assets/models/ does not exist yet — run `npm run convert` first');
  process.exit(0);
}

const files = readdirSync(MODELS)
  .filter((f) => extname(f).toLowerCase() === '.glb' && !f.endsWith('.raw.glb'))
  .filter((f) => !filter.length || filter.some((t) => f.toLowerCase().includes(t.toLowerCase())))
  .map((f) => join(MODELS, f));

if (!files.length) {
  console.log('inspect: no .glb in assets/models/ — run `npm run convert`');
  process.exit(0);
}

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'meshopt.decoder': MeshoptDecoder,
  });

const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

console.log('');
console.log(pad('asset', 26) + padL('MB', 7) + padL('tris', 10) + padL('prims', 7) + padL('mats', 6) + padL('tex', 5) + padL('max px', 8) + '  verdict');
console.log('-'.repeat(78));

let worst = [];

for (const file of files) {
  const doc = await io.read(file);
  const root = doc.getRoot();

  let triangles = 0;
  let primitives = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      primitives++;
      const indices = prim.getIndices();
      const position = prim.getAttribute('POSITION');
      const count = indices ? indices.getCount() : position?.getCount() ?? 0;
      triangles += count / 3;
    }
  }

  const textures = root.listTextures();
  let maxPx = 0;
  for (const tex of textures) {
    const size = tex.getSize();
    if (size) maxPx = Math.max(maxPx, size[0], size[1]);
  }

  const sizeMB = statSync(file).size / 1024 / 1024;
  const notes = [];
  if (sizeMB > TARGET.payloadMB) notes.push(`${sizeMB.toFixed(1)}MB over ${TARGET.payloadMB}MB`);
  if (primitives > TARGET.drawCalls.mobile) notes.push(`${primitives} prims over mobile ${TARGET.drawCalls.mobile}`);
  if (maxPx > TARGET.mobileTexture) notes.push(`${maxPx}px textures need a mobile variant`);

  const verdict = notes.length ? 'over: ' + notes.join('; ') : 'ok';
  if (notes.length) worst.push(basename(file));

  console.log(
    pad(basename(file), 26) +
    padL(sizeMB.toFixed(1), 7) +
    padL(Math.round(triangles).toLocaleString(), 10) +
    padL(primitives, 7) +
    padL(root.listMaterials().length, 6) +
    padL(textures.length, 5) +
    padL(maxPx || '—', 8) +
    '  ' + verdict,
  );
}

console.log('');
console.log(`targets: DNA73 — desktop < ${TARGET.drawCalls.desktop} draw calls, mobile < ${TARGET.drawCalls.mobile}, mobile textures <= ${TARGET.mobileTexture}px.`);
console.log('prims is a FLOOR for draw calls, not the count — shadows, transparency and post add passes.');
if (worst.length) {
  console.log('');
  console.log('over budget: ' + worst.join(', '));
  console.log('  --texture-size 1024 on convert, or split the mesh so the hero loads alone.');
}
