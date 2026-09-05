#!/usr/bin/env node
// Which link does each solid belong to?
//
// The first rig answered this by eye, from a table of centroids, and it was
// wrong in a way that only appears once the joints move: a bracket assigned to
// the boom when it is bolted to the rocker does not look misplaced at rest — it
// looks perfect at rest, and then detaches the moment the arm swings.
//
// So the answer is measured. A handful of large, unambiguous solids are named as
// SEEDS for each link. Every other solid is assigned to the seed it is physically
// closest to — minimum distance between its vertices and the seed's vertices, not
// between centroids, because a long bracket's centroid can sit nearer the wrong
// link than any part of the bracket actually does.
//
//   node tools/rig-assign.mjs "assets/robo hand/KR700PA.stp"

import { readFileSync } from 'node:fs';
import occtimportjs from 'occt-import-js';

// The load-bearing castings and rods, each unmistakable in the survey.
const SEEDS = {
  base:      [41, 71],       // the floor slab and the cylinder
  column:    [1, 93, 52],    // the carousel body and the strut up to the rear-rod pivot
  lowerArm:  [8, 91],        // the tall casting, and the rod that shares its two pivots
  boom:      [13, 95],       // the 1681 beam and the energy chain on its flank
  rocker:    [18, 51],       // the plate carrying rearTop and tieStart
  rearRod:   [0, 28],        // the rear vertical pair
  tieRod:    [17],           // the 1435 rod along the top
  flange:    [14, 16],       // the wrist assembly
};

const file = process.argv[2];
if (!file) { console.error('usage: node tools/rig-assign.mjs <file.stp>'); process.exit(1); }

const occt = await occtimportjs();
const result = occt.ReadStepFile(new Uint8Array(readFileSync(file)), {
  linearUnit: 'millimeter',
  linearDeflectionType: 'bounding_box_ratio',
  linearDeflection: 0.004,   // coarse on purpose: this is a proximity test, not a render
  angularDeflection: 0.8,
});
if (!result.success) { console.error('OCCT could not read this file'); process.exit(1); }

// Decimate each solid to a manageable point cloud — 107 solids compared pairwise
// at full density is minutes of work to answer a question that needs millimetres.
const cloud = result.meshes.map((m) => {
  const p = m.attributes.position.array;
  const n = p.length / 3;
  const step = Math.max(1, Math.floor(n / 400));
  const out = [];
  for (let i = 0; i < n; i += step) out.push([p[i * 3], p[i * 3 + 1], p[i * 3 + 2]]);
  return out;
});

const seedOf = new Map();
for (const [link, list] of Object.entries(SEEDS)) for (const i of list) seedOf.set(i, link);

function minDistance(a, b) {
  let best = Infinity;
  for (const p of a) {
    for (const q of b) {
      const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
      if (d < best) best = d;
    }
  }
  return Math.sqrt(best);
}

const assignment = {};
for (const link of Object.keys(SEEDS)) assignment[link] = [];

const report = [];
for (let i = 0; i < cloud.length; i++) {
  if (seedOf.has(i)) { assignment[seedOf.get(i)].push(i); report.push({ i, link: seedOf.get(i), d: 0, seed: true }); continue; }

  let best = null;
  let second = null;
  for (const [link, list] of Object.entries(SEEDS)) {
    let d = Infinity;
    for (const s of list) d = Math.min(d, minDistance(cloud[i], cloud[s]));
    if (!best || d < best.d) { second = best; best = { link, d }; }
    else if (!second || d < second.d) second = { link, d };
  }
  assignment[best.link].push(i);
  report.push({ i, link: best.link, d: best.d, rival: second?.link, rivalD: second?.d });
}

// A solid that is nearly as close to a rival link is the one that will detach.
// Print those loudest — they are the rows worth a human's attention.
const contested = report
  .filter((r) => !r.seed && r.rivalD !== undefined && r.rivalD - r.d < 25)
  .sort((a, b) => (a.rivalD - a.d) - (b.rivalD - b.d));

for (const [link, list] of Object.entries(assignment)) {
  console.log(link.padEnd(10) + String(list.length).padStart(3) + '  ' + list.sort((a, b) => a - b).join(' '));
}

console.log('\ncontested — within 25mm of a rival link, check these by eye in the debug view:');
if (!contested.length) console.log('  (none)');
for (const r of contested) {
  console.log(`  solid ${String(r.i).padStart(3)}  -> ${r.link.padEnd(10)} ${r.d.toFixed(1)}mm   rival ${r.rival} ${r.rivalD.toFixed(1)}mm`);
}

console.log('\nJSON:');
console.log(JSON.stringify(
  Object.fromEntries(Object.entries(assignment).map(([k, v]) => [k, v.sort((a, b) => a - b)])),
));
