#!/usr/bin/env node
// Where does each solid actually attach?
//
// A rod is only "attached" if we know where its ends ARE. The bounding box does
// not say: a diagonal rod's box corners are empty air, and a hinge centre is the
// middle of a bore, not the corner of a cuboid.
//
// So, per solid: find the principal axis by PCA over the vertices, project onto
// it, take the outer 6% at each end, and return the centroid of each cap. For a
// rod those two points are the hinge centres. For a blocky casting they are just
// the two ends of its longest dimension, which is still the right answer to
// "where would something attach".
//
//   node tools/rod-ends.mjs "assets/robo hand/KR700PA.stp" [--solids 0,17,28,91]

import { readFileSync } from 'node:fs';
import occtimportjs from 'occt-import-js';

const [, , file, ...rest] = process.argv;
if (!file) {
  console.error('usage: node tools/rod-ends.mjs <file.stp> [--solids a,b,c] [--json out.json]');
  process.exit(1);
}
const arg = (n) => (rest.includes(n) ? rest[rest.indexOf(n) + 1] : null);
const only = arg('--solids')?.split(',').map(Number) ?? null;
const jsonOut = arg('--json');

const occt = await occtimportjs();
const result = occt.ReadStepFile(new Uint8Array(readFileSync(file)), {
  linearUnit: 'millimeter',
  linearDeflectionType: 'bounding_box_ratio',
  linearDeflection: 0.001,
  angularDeflection: 0.5,
});
if (!result.success) { console.error('OCCT could not read this file'); process.exit(1); }

/** Largest-eigenvalue eigenvector of a 3x3 symmetric matrix, by power iteration. */
function principalAxis(cov) {
  let v = [1, 1, 1];
  for (let k = 0; k < 200; k++) {
    const n = [
      cov[0] * v[0] + cov[1] * v[1] + cov[2] * v[2],
      cov[1] * v[0] + cov[3] * v[1] + cov[4] * v[2],
      cov[2] * v[0] + cov[4] * v[1] + cov[5] * v[2],
    ];
    const len = Math.hypot(...n) || 1;
    v = n.map((c) => c / len);
  }
  return v;
}

const rows = result.meshes.map((mesh, index) => {
  const p = mesh.attributes.position.array;
  const n = p.length / 3;

  const c = [0, 0, 0];
  for (let i = 0; i < p.length; i += 3) { c[0] += p[i]; c[1] += p[i + 1]; c[2] += p[i + 2]; }
  c[0] /= n; c[1] /= n; c[2] /= n;

  // upper triangle: xx xy xz yy yz zz
  const cov = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i] - c[0], y = p[i + 1] - c[1], z = p[i + 2] - c[2];
    cov[0] += x * x; cov[1] += x * y; cov[2] += x * z;
    cov[3] += y * y; cov[4] += y * z; cov[5] += z * z;
  }
  for (let i = 0; i < 6; i++) cov[i] /= n;

  const axis = principalAxis(cov);

  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    const t = (p[i] - c[0]) * axis[0] + (p[i + 1] - c[1]) * axis[1] + (p[i + 2] - c[2]) * axis[2];
    if (t < lo) lo = t;
    if (t > hi) hi = t;
  }

  const band = (hi - lo) * 0.06;
  const capA = [0, 0, 0]; let na = 0;
  const capB = [0, 0, 0]; let nb = 0;
  for (let i = 0; i < p.length; i += 3) {
    const t = (p[i] - c[0]) * axis[0] + (p[i + 1] - c[1]) * axis[1] + (p[i + 2] - c[2]) * axis[2];
    if (t <= lo + band) { capA[0] += p[i]; capA[1] += p[i + 1]; capA[2] += p[i + 2]; na++; }
    else if (t >= hi - band) { capB[0] += p[i]; capB[1] += p[i + 1]; capB[2] += p[i + 2]; nb++; }
  }
  for (let i = 0; i < 3; i++) { capA[i] /= na || 1; capB[i] /= nb || 1; }

  const r1 = (v) => v.map((x) => +x.toFixed(1));
  return {
    index,
    length: +(hi - lo).toFixed(1),
    axis: axis.map((x) => +x.toFixed(3)),
    centroid: r1(c),
    endA: r1(capA),
    endB: r1(capB),
    triangles: mesh.index.array.length / 3,
  };
});

const shown = only ? rows.filter((r) => only.includes(r.index)) : rows;
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

console.log(pad('#', 5) + padL('len', 8) + '   ' + pad('end A (x,y,z)', 26) + pad('end B (x,y,z)', 26) + 'axis');
console.log('-'.repeat(96));
for (const r of shown.sort((a, b) => b.length - a.length)) {
  console.log(
    pad(r.index, 5) + padL(r.length, 8) + '   ' +
    pad(r.endA.join(', '), 26) + pad(r.endB.join(', '), 26) + r.axis.join(', '),
  );
}

if (jsonOut) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(jsonOut, JSON.stringify(rows, null, 2));
  console.log('\nwrote ' + jsonOut);
}
