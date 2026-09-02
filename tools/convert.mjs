#!/usr/bin/env node
// The asset pipeline: source formats in assets/source/ -> optimised .glb in
// assets/models/.
//
//   npm run convert                       everything not already converted
//   npm run convert -- car.fbx            one file
//   npm run convert -- car.fbx --scale 0.01 --force
//
// Two stages, and the second is the one that matters:
//
//   1. Blender, headless, source -> .glb. FBX and .blend carry no compression
//      and frequently arrive at 100x scale; this is where that is fixed.
//   2. gltf-transform optimize — dedupe, instance, prune, Draco geometry and
//      texture compression. A 300MB library asset is not a web asset, and DNA72
//      wants the largest single asset declared before the build rather than
//      discovered in a Lighthouse run.
//
// KTX2/Basis needs KTX-Software on PATH. Without it this uses WebP, which is a
// real improvement and not the ceiling — install KTX-Software when GPU memory
// rather than download size becomes the constraint, then pass --texture ktx2.

import { spawnSync } from 'node:child_process';
import { readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative, extname, basename, isAbsolute } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'assets', 'source');
const MODELS = join(ROOT, 'assets', 'models');
const SOURCE_EXT = new Set(['.fbx', '.obj', '.blend', '.gltf', '.glb']);
const VALUE_FLAGS = new Set(['--scale', '--texture', '--texture-size']);
const GLTF_TRANSFORM = join(ROOT, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');

const BLENDER_CANDIDATES = [
  process.env.BLENDER,
  'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe',
  'C:/Program Files/Blender Foundation/Blender 4.2/blender.exe',
  '/Applications/Blender.app/Contents/MacOS/Blender',
  'blender',
].filter(Boolean);

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback);

const targets = argv.filter(
  (a, i) => !a.startsWith('--') && !VALUE_FLAGS.has(argv[i - 1]),
);

const mb = (p) => (statSync(p).size / 1024 / 1024).toFixed(1);

function findBlender() {
  for (const candidate of BLENDER_CANDIDATES) {
    if (isAbsolute(candidate) || candidate.includes('/')) {
      if (existsSync(candidate)) return candidate;
    } else {
      const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
      if (!probe.error) return candidate;
    }
  }
  return null;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return SOURCE_EXT.has(extname(entry.name).toLowerCase()) ? [full] : [];
  });
}

const blender = findBlender();
if (!blender) {
  console.error('convert: no Blender found. Set BLENDER=/path/to/blender, or install it.');
  console.error('         tried: ' + BLENDER_CANDIDATES.join(' | '));
  process.exit(1);
}

const files = walk(SOURCE).filter((f) => !targets.length || targets.some((t) => f.toLowerCase().endsWith(t.toLowerCase())));

if (!files.length) {
  console.log('convert: nothing to do — drop .fbx / .obj / .blend / .glb into assets/source/');
  process.exit(0);
}

mkdirSync(MODELS, { recursive: true });
console.log('blender : ' + blender);
console.log('sources : ' + files.length + '\n');

let failed = 0;
for (const src of files) {
  const name = basename(src, extname(src)).replace(/[+\s_]+/g, '-').toLowerCase();
  const raw = join(MODELS, name + '.raw.glb');
  const out = join(MODELS, name + '.glb');

  if (existsSync(out) && !flag('--force')) {
    console.log('skip    ' + name + '.glb  (exists — pass --force to rebuild)');
    continue;
  }

  console.log('--- ' + relative(ROOT, src) + '  (' + mb(src) + ' MB)');

  const blend = spawnSync(
    blender,
    ['-b', '--factory-startup', '--python', join(ROOT, 'tools', 'blender_export.py'),
      '--', '--in', src, '--out', raw, '--scale', String(opt('--scale', '1')), '--no-draco'],
    { encoding: 'utf8' },
  );
  if (blend.status !== 0 || !existsSync(raw)) {
    console.error('  FAILED at Blender');
    console.error((blend.stdout || '').split('\n').slice(-15).join('\n'));
    console.error(blend.stderr || '');
    failed++;
    continue;
  }
  console.log('  blender  -> ' + mb(raw) + ' MB');

  // Blender exports uncompressed above so that one tool owns geometry
  // compression — one place to change it, one place it can go wrong.
  // Called through node rather than the npx shim: Node refuses to spawn a .cmd
  // without a shell, and the shim is the only Windows entry point npx offers.
  const gt = spawnSync(
    process.execPath,
    [GLTF_TRANSFORM, 'optimize', raw, out,
      '--compress', 'draco',
      '--texture-compress', opt('--texture', 'webp'),
      '--texture-size', opt('--texture-size', '2048'),
      '--simplify', 'false'],
    { encoding: 'utf8', cwd: ROOT },
  );
  if (gt.status !== 0 || !existsSync(out)) {
    console.error('  FAILED at gltf-transform');
    console.error(gt.stdout || '');
    console.error(gt.stderr || '');
    failed++;
    continue;
  }
  console.log('  optimize -> ' + mb(out) + ' MB   ' + relative(ROOT, out));
}

console.log('\ndone. ' + (failed ? failed + ' failed. ' : '') + 'Run `npm run inspect` for the budget table,');
console.log('and record origin and licence for every new asset in assets/ASSETS.md (GI6, DNA25).');
