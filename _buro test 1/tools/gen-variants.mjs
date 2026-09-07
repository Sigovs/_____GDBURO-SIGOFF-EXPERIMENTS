#!/usr/bin/env node
// Writes the direction pages: src/indexA.html, src/indexB.html, src/indexC.html.
//
//   node tools/gen-variants.mjs
//
// WHY THESE PAGES ARE GENERATED AND index1.html IS NOT.
//
// The three directions are the SAME document with different copy in it. They
// share the masthead, the readout, the stage, the record table and the whole
// boot sequence; what differs is which words sit in which beat, and which
// direction module and stylesheet the page loads. Hand-maintaining three copies
// of the record table is how the three of them drift apart — the measured
// figures are the one thing that must read identically on all three, because
// they are the same measurements.
//
// So the beats are declared here and the markup is emitted STATICALLY, into a
// file that is committed. Static because the no-JS view and the reduced-motion
// path both need the copy and the measurements present in the document without
// running anything; committed because a build must never depend on a generator
// having been run by hand first — see the note in publish.mjs, which runs this.
//
// THE REGISTER NAMES THE FILES. variants.json is the source of truth for what is
// published; an entry with a `direction` key is one of these pages, and the name
// under src/ is the name it publishes as. Adding a fourth direction is: a new
// src/directions/d.js, a new site/dir-d.css, a BEATS entry here, and a register
// entry with "direction": "d".

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const REGISTER = JSON.parse(readFileSync(join(ROOT, 'variants.json'), 'utf8'));

/* ── the measurements ─────────────────────────────────────────────────────
   One list, three pages. Every figure here was measured from the file in this
   repository; none is a manufacturer specification. See assets/ASSETS.md. */
const RECORD_ROWS = [
  ['Overall height', '2 744 mm'], ['Overall span', '3 070 mm'],
  ['Linkage members', '3 × 1 300 mm'], ['Driven axes', '4'],
  ['Closed loops', '2'], ['Solids in source', '107'],
  ['Triangles', '137 613'], ['Draw-call floor', '9'],
  ['Payload', '442 KB'], ['Worst plate tilt, full range', '0.000°'],
];

const record = () => `
  <section class="beat beat--record" id="record" data-in="0.05" data-out="0.98">
    <div class="record">
      <h2 class="record__head"><span class="plate-on">Measured, not quoted</span></h2>
      <p class="note" data-r>Every figure below was measured from the file in this repository. No manufacturer
        specification is used. The designation &ldquo;KR&nbsp;700&nbsp;PA&rdquo; conventionally implies a
        700&nbsp;kg payload, and that figure does not appear here, because an implication is not a source.</p>
      <table class="plate">
        <caption class="visually-hidden">Measured properties of the KR 700 PA model</caption>
        <tbody>
${RECORD_ROWS.map(([k, v]) => `          <tr><th scope="row">${k}</th><td class="fig">${v}</td></tr>`).join('\n')}
        </tbody>
      </table>
      <p class="provenance"><em>KR 700 PA</em>, obtained from CGTrader under its Royalty&nbsp;Free License.
        STEP converted with <code>tools/step-to-glb.mjs</code>; hinge centres derived by
        <code>tools/rod-ends.mjs</code> and the hierarchy recorded in <code>assets/robo&nbsp;hand/rig.json</code>.
        KUKA and KR&nbsp;700&nbsp;PA are marks of their owner, used to name the machine accurately and not
        under licence or endorsement.</p>
    </div>
    <div class="orbit" data-orbit><span class="orbit__hint">Drag to rotate · 360°</span></div>
    <footer class="colophon"><p><span class="wordmark">Buro&nbsp;Lab</span> — machine study 01</p></footer>
  </section>`;

// index1's mark, inline so the page takes no /favicon.ico 404 on its way public.
const ICON = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27%3E%3Crect width=%2716%27 height=%2716%27 fill=%27%230a0c0d%27/%3E%3Crect x=%271%27 y=%277.5%27 width=%2714%27 height=%271%27 fill=%27%23f2903f%27/%3E%3C/svg%3E";

const page = (d, beats) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KR 700 PA — ${d.title} · Buro Lab</title>
<meta name="description" content="A KUKA KR 700 PA palletiser, reconstructed from a 107-solid CAD file and re-articulated on its real hinge centres.">
<link rel="icon" href="${ICON}">
<link rel="stylesheet" href="./site/variant.css">
<link rel="stylesheet" href="./site/dir-${d.letter}.css">
</head>
<body class="dir-${d.letter}">
<a class="skip" href="#record">Skip to the measurements</a>

<header class="masthead">
  <span class="wordmark">Buro&nbsp;Lab</span>
  <span class="masthead__meta">Machine study 01 · ${d.letter.toUpperCase()}</span>
</header>
<span class="readout" data-readout aria-hidden="true"></span>

<div class="stage" aria-hidden="true"><canvas id="scene"></canvas></div>

<main>
${beats}
${record()}
</main>

<script type="module">
  import direction from './directions/${d.letter}.js';
  import { bootVariant } from './site/vboot.js';
  bootVariant(direction);
</script>
</body>
</html>
`;

const beat = (id, extra, inner, opts = {}) => `
  <section class="beat beat--${id}${extra ? ' ' + extra : ''}" id="${id}" data-in="${opts.in ?? 0.12}" data-out="${opts.out ?? 0.80}" data-enter="${opts.enter ?? 'rise'}">
    <div class="type">
${inner}
    </div>
  </section>`;

/*
  THE BEATS. Each key is a direction letter; the ids match the shot ids in
  src/directions/<letter>.js, because the scroll film keys its ScrollTriggers to
  '#' + shot.id. A beat here with no matching shot there is a section the camera
  never visits.

  The FIRST beat's type is revealed by the intro rather than by the scroll — see
  src/site/vintro.js — so its data-in only governs the exit on the way back up.
*/
const BEATS = {
  // A — MONUMENTAL. Almost no interface. Two words at the opening, two at the
  // close, and the callouts carrying everything between.
  a: [
    beat('open', '', `      <h1 class="mono-title" data-r>KR 700 PA</h1>\n      <p class="lede" data-r>A palletiser, measured.</p>`, { in: 0.04, out: 0.62 }),
    beat('under', '', `      <p class="whisper" data-r>You stand under it.</p>`, { in: 0.30, out: 0.86, enter: 'slide' }),
    beat('mass', '', ``, { in: 0.2, out: 0.9 }),
    beat('loops', '', `      <h2 class="statement" data-r>Two loops.<br>One motion.</h2>`, { in: 0.20, out: 0.86 }),
    beat('plan', '', ``, { in: 0.2, out: 0.9 }),
    beat('grain', '', ``, { in: 0.2, out: 0.9 }),
    beat('stand', '', `      <h2 class="statement statement--end" data-r>The hand<br>never tilts.</h2>`, { in: 0.18, out: 0.88 }),
  ],

  // B — RADICAL EDITORIAL. The type is the composition: cropped past the edges,
  // the machine moving through it.
  b: [
    beat('open', '', `      <h1 class="bleed" data-r>KR700PA</h1>\n      <p class="kicker" data-r>KUKA · palletiser · 2 744 mm</p>`, { in: 0.04, out: 0.62, enter: 'crop' }),
    beat('height', 'beat--figleft', `      <p class="figlabel" data-r>Standing still</p>\n      <h2 class="fig-huge" data-r>2744</h2>\n      <p class="figunit" data-r>millimetres</p>`, { in: 0.14, out: 0.82, enter: 'crop' }),
    beat('axes', 'beat--split', `      <h2 class="word word--1" data-r>FOUR</h2>\n      <h2 class="word word--2" data-r>AXES</h2>\n      <p class="aside" data-r>Two closed linkages. The plate holds flat while the arm drives.</p>`, { in: 0.12, out: 0.84, enter: 'slide' }),
    beat('reach', 'beat--figtop', `      <h2 class="fig-huge fig-huge--top" data-r>3070</h2>\n      <p class="figlabel figlabel--right" data-r>Across, at full reach</p>`, { in: 0.16, out: 0.82, enter: 'drop' }),
    beat('grain', '', `      <h2 class="statement" data-r>Precision<br>is mechanical.</h2>`, { in: 0.22, out: 0.80, enter: 'slide' }),
    beat('level', 'beat--behind', `      <h2 class="bleed bleed--end" data-r>NEVER TILTS</h2>\n      <p class="kicker kicker--end" data-r>0.000° across the full range</p>`, { in: 0.14, out: 0.86, enter: 'crop' }),
  ],

  // C — MACHINE FILM. One quiet line per beat, low and small. The camera and the
  // light carry it.
  c: [
    beat('open', '', `      <h1 class="filmtitle" data-r>KR 700 PA</h1>\n      <p class="caption" data-r>A machine hall, at night.</p>`, { in: 0.06, out: 0.66 }),
    beat('push', '', `      <p class="caption" data-r>Two and three quarter metres, standing still.</p>`, { in: 0.28, out: 0.84 }),
    beat('work', '', `      <p class="caption" data-r>Four axes. Two closed loops. One motion.</p>`, { in: 0.24, out: 0.84 }),
    beat('shape', '', `      <p class="caption" data-r>Three metres of reach, and nothing wasted.</p>`, { in: 0.26, out: 0.84 }),
    beat('skin', '', `      <p class="caption" data-r>Precision is mechanical.</p>`, { in: 0.30, out: 0.82 }),
    beat('release', '', `      <h2 class="filmend" data-r>The hand that never tilts.</h2>`, { in: 0.18, out: 0.88 }),
  ],
};

const TITLES = { a: 'monumental', b: 'editorial', c: 'machine film' };

let wrote = 0;
for (const v of REGISTER.variants) {
  if (!v.direction) continue;          // index1.html is hand-authored, not generated
  const letter = v.direction;
  const beats = BEATS[letter];
  if (!beats) {
    console.error(`  ${v.file}: variants.json asks for direction "${letter}" and there are no beats for it.`);
    process.exitCode = 1;
    continue;
  }
  for (const dep of [`src/directions/${letter}.js`, `src/site/dir-${letter}.css`]) {
    if (existsSync(join(ROOT, dep))) continue;
    console.error(`  ${v.file}: missing ${dep}`);
    process.exitCode = 1;
  }
  writeFileSync(join(SRC, v.file), page({ letter, title: TITLES[letter] ?? letter }, beats.join('\n')));
  console.log(`  wrote  src/${v.file}  — direction ${letter.toUpperCase()}`);
  wrote++;
}

if (!wrote) console.log('  no registered variant carries a "direction" key — nothing generated.');
