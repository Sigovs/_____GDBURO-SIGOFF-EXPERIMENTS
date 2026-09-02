#!/usr/bin/env node
// Copies the Draco, Basis/KTX2 and meshopt decoders out of the installed three
// package into public/decoders/, so the loaders in src/engine/loaders.js resolve
// them from our own origin instead of a CDN.
//
// Runs on postinstall. It is a no-op — never an error — when three is not
// installed yet, because npm runs postinstall before we have finished asking for
// three on a cold clone.

import { cp, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'decoders');

const SETS = [
  ['node_modules/three/examples/jsm/libs/draco/gltf', join(OUT, 'draco')],
  ['node_modules/three/examples/jsm/libs/basis', join(OUT, 'basis')],
];

const exists = async (p) => access(p).then(() => true, () => false);

let copied = 0;
for (const [from, to] of SETS) {
  const src = join(ROOT, from);
  if (!(await exists(src))) continue;
  await mkdir(to, { recursive: true });
  await cp(src, to, { recursive: true });
  copied++;
}

// meshopt ships as a single ES module beside the loaders
const meshopt = join(ROOT, 'node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
if (await exists(meshopt)) {
  await mkdir(OUT, { recursive: true });
  await cp(meshopt, join(OUT, 'meshopt_decoder.module.js'));
  copied++;
}

console.log(copied ? `decoders: ${copied} set(s) copied into public/decoders/` : 'decoders: three not installed yet — skipped');
