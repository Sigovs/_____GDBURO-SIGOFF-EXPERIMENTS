#!/usr/bin/env node
// Reads a STEP file with OCCT and reports what is actually in it — one row per
// solid, with its colour, bounding box, centroid and triangle count.
//
// This exists because KR700PA.stp carries no assembly tree: one PRODUCT, zero
// NEXT_ASSEMBLY_USAGE_OCCURRENCE, 107 MANIFOLD_SOLID_BREP. The kinematic
// hierarchy has to be reconstructed from geometry, and geometry is what this
// prints. Nothing is decided here — it is the survey the rigging reads.
//
//   node tools/step-report.mjs "assets/robo hand/KR700PA.stp" [--json out.json]

import { readFileSync, writeFileSync } from 'node:fs';
import occtimportjs from 'occt-import-js';

const [, , file, ...rest] = process.argv;
if (!file) {
  console.error('usage: node tools/step-report.mjs <file.stp> [--json out.json]');
  process.exit(1);
}
const jsonOut = rest.includes('--json') ? rest[rest.indexOf('--json') + 1] : null;

const occt = await occtimportjs();
const bytes = new Uint8Array(readFileSync(file));

console.log('reading ' + file + ' (' + (bytes.length / 1024 / 1024).toFixed(1) + ' MB)…');
const result = occt.ReadStepFile(bytes, {
  linearUnit: 'millimeter',
  linearDeflectionType: 'bounding_box_ratio',
  linearDeflection: 0.001,
  angularDeflection: 0.5,
});

if (!result.success) {
  console.error('OCCT could not read this file');
  process.exit(1);
}

const hex = (c) => (c ? '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('') : '—');

const solids = result.meshes.map((mesh, i) => {
  const p = mesh.attributes.position.array;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let v = 0; v < p.length; v += 3) {
    for (let a = 0; a < 3; a++) {
      if (p[v + a] < min[a]) min[a] = p[v + a];
      if (p[v + a] > max[a]) max[a] = p[v + a];
    }
  }
  const size = max.map((m, a) => m - min[a]);
  return {
    index: i,
    name: mesh.name || '(unnamed)',
    colour: hex(mesh.color),
    triangles: mesh.index.array.length / 3,
    vertices: p.length / 3,
    min: min.map((n) => +n.toFixed(1)),
    max: max.map((n) => +n.toFixed(1)),
    size: size.map((n) => +n.toFixed(1)),
    centre: min.map((n, a) => +((n + max[a]) / 2).toFixed(1)),
  };
});

// ── whole-model extent, so the robot's own coordinate frame is legible ──────
const world = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
for (const s of solids) {
  for (let a = 0; a < 3; a++) {
    world.min[a] = Math.min(world.min[a], s.min[a]);
    world.max[a] = Math.max(world.max[a], s.max[a]);
  }
}

console.log('');
console.log('solids   : ' + solids.length);
console.log('triangles: ' + solids.reduce((n, s) => n + s.triangles, 0).toLocaleString());
console.log('extent   : ' + world.min.map((n) => n.toFixed(0)).join(', ') + '  ->  ' + world.max.map((n) => n.toFixed(0)).join(', ') + '  (mm)');
console.log('size     : ' + world.max.map((m, a) => (m - world.min[a]).toFixed(0)).join(' × ') + ' mm');
console.log('');

const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

console.log(pad('#', 4) + pad('name', 26) + pad('colour', 9) + padL('tris', 8) +
  padL('cx', 8) + padL('cy', 8) + padL('cz', 8) + padL('sx', 8) + padL('sy', 8) + padL('sz', 8));
console.log('-'.repeat(95));

// sorted by height so the kinematic chain reads down the page
for (const s of [...solids].sort((a, b) => a.centre[2] - b.centre[2])) {
  console.log(
    pad(s.index, 4) + pad(s.name.slice(0, 24), 26) + pad(s.colour, 9) + padL(s.triangles, 8) +
    padL(s.centre[0], 8) + padL(s.centre[1], 8) + padL(s.centre[2], 8) +
    padL(s.size[0], 8) + padL(s.size[1], 8) + padL(s.size[2], 8),
  );
}

// ── colour census: the paint tells you which parts belong to which casting ──
const byColour = new Map();
for (const s of solids) {
  const entry = byColour.get(s.colour) ?? { count: 0, tris: 0 };
  entry.count++;
  entry.tris += s.triangles;
  byColour.set(s.colour, entry);
}
console.log('');
console.log('colours:');
for (const [colour, { count, tris }] of [...byColour].sort((a, b) => b[1].count - a[1].count)) {
  console.log('  ' + pad(colour, 10) + padL(count, 4) + ' solids   ' + padL(tris.toLocaleString(), 10) + ' tris');
}

if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify({ world, solids }, null, 2));
  console.log('\nwrote ' + jsonOut);
}
