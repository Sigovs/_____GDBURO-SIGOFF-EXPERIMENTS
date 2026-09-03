#!/usr/bin/env node
// Build one variant and publish it beside the others.
//
//   npm run deploy                    the variant marked "current" in variants.json
//   npm run deploy -- v02-something    a named variant
//   npm run deploy -- --list           what is registered and what is live
//
// THE SHAPE OF THE PUBLISHED SITE
//
//   /                     the version index, generated from variants.json
//   /v01-level-line/      a variant
//   /v02-.../             another
//
// WHY THIS IS NOT A FORCE-PUSH ANY MORE. The deploy used to build dist/, wrap it
// in a throwaway repository and force-push the whole branch. That is fine while
// there is one thing to publish and destroys every other variant the moment
// there are two — the branch only ever contains the build that ran last. So the
// existing branch is cloned, ONE folder inside it is replaced, the index is
// regenerated from the register, and the result is pushed. Everything not named
// by this run is carried across untouched.
//
// The register is the source of truth in both directions: a slug that is not in
// variants.json is refused rather than published as an untitled folder, and a
// folder on the branch whose entry has been deleted is removed by the next
// deploy. Nothing is orphaned by hand.

import { execFileSync } from 'node:child_process';
import {
  rmSync, writeFileSync, readFileSync, existsSync, readdirSync, cpSync, mkdtempSync, statSync, renameSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { buildHub } from './hub.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const REMOTE = 'https://github.com/Sigovs/gd_buro_tests.git';
const BRANCH = 'gh-pages';
const ORIGIN = 'https://sigovs.github.io';

// git runs WITHOUT a shell, and that is load-bearing on Windows: with one, the
// arguments are re-parsed by cmd and `user.name=Aleksandrs Sigovs` splits on its
// space. npm is not spawned at all — it is npm.cmd here, which current Node
// refuses to spawn without a shell and warns about with one, so Vite's own entry
// is called through this same node binary.
const git = (args, cwd = ROOT) => execFileSync('git', args, { cwd, stdio: 'inherit' });
const gitq = (args, cwd = ROOT) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

const VITE = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const build = (base) =>
  execFileSync(process.execPath, [VITE, 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    // Set here rather than trusted to whoever types the command. Forgetting it
    // is what makes a deployed page request its assets from the domain root and
    // 404 on every one of them.
    env: { ...process.env, GITHUB_PAGES: '1', DEPLOY_BASE: base },
  });

/* ── the register ────────────────────────────────────────────────────────── */

const REGISTER = JSON.parse(readFileSync(join(ROOT, 'variants.json'), 'utf8'));
const BASE = REGISTER.base.replace(/\/+$/, '') + '/';

const args = process.argv.slice(2).filter((a) => a !== '--');
const wantList = args.includes('--list');
const slugArg = args.find((a) => !a.startsWith('--'));

const known = REGISTER.variants.map((v) => v.slug);

if (wantList) {
  console.log('\n  registered in variants.json:');
  for (const v of REGISTER.variants) {
    console.log(`    ${v.slug.padEnd(24)} ${(v.status || '').padEnd(12)} ${ORIGIN}${BASE}${v.slug}/`);
  }
  console.log(`\n  index: ${ORIGIN}${BASE}\n`);
  process.exit(0);
}

const slug = slugArg || REGISTER.variants.find((v) => v.status === 'current')?.slug || known[0];

if (!known.includes(slug)) {
  console.error(`\n  "${slug}" is not in variants.json.`);
  console.error('  Add an entry for it first — a slug that is not registered would publish as');
  console.error('  an untitled folder the index cannot describe.\n');
  console.error(`  registered: ${known.join(', ')}\n`);
  process.exit(1);
}

const variant = REGISTER.variants.find((v) => v.slug === slug);
const publicBase = `${BASE}${slug}/`;

/* ── provenance ──────────────────────────────────────────────────────────── */

let source = 'unknown';
let dirty = false;
try {
  source = gitq(['rev-parse', '--short', 'HEAD']);
  dirty = gitq(['status', '--porcelain']).length > 0;
} catch { /* not a repo — the deploy still works, it is just unlabelled */ }

console.log(`\n  variant  ${slug}  (${variant.name})`);
console.log(`  base     ${publicBase}`);
if (dirty) console.log('  note     working tree is dirty, so this deploy is not reproducible from a commit');
console.log('');

/* ── build ───────────────────────────────────────────────────────────────── */

rmSync(DIST, { recursive: true, force: true });
build(publicBase);

if (!existsSync(join(DIST, 'index1.html'))) {
  console.error('\n  dist/index1.html is missing — the build produced nothing to publish.\n');
  process.exit(1);
}

/* ── assemble the branch ─────────────────────────────────────────────────── */

const work = mkdtempSync(join(tmpdir(), 'gh-pages-'));
let fresh = false;

try {
  git(['clone', '--quiet', '--depth', '1', '--branch', BRANCH, REMOTE, work], ROOT);
} catch {
  console.log('  no existing gh-pages branch — starting one');
  fresh = true;
  git(['init', '-q'], work);
  git(['checkout', '-qb', BRANCH], work);
  git(['remote', 'add', 'origin', REMOTE], work);
}

// Replace only this variant's folder.
const target = join(work, slug);
rmSync(target, { recursive: true, force: true });
cpSync(DIST, target, { recursive: true });

// The source entry is index1.html, because index.html in the repo root is the
// portal. A served folder still has to answer on its own root, so the built page
// takes the index name HERE rather than the site being named for the deploy.
renameSync(join(target, 'index1.html'), join(target, 'index.html'));

// Drop folders whose entry has been removed from the register.
// Everything this script writes itself, so the sweep below cannot mistake it for
// an orphaned variant. `previews` belongs here: it was being deleted as unknown
// and then re-copied a few lines later, which netted to no change and would have
// wiped the pictures the moment the copy was reordered or failed.
const generated = new Set(['index.html', '.nojekyll', '.git', 'previews']);
for (const entry of readdirSync(work)) {
  if (generated.has(entry)) continue;
  const p = join(work, entry);
  if (!statSync(p).isDirectory()) continue;
  if (!known.includes(entry)) {
    console.log(`  removing ${entry}/ — no longer in variants.json`);
    rmSync(p, { recursive: true, force: true });
  }
}

// Jekyll is on by default on Pages and silently eats any path beginning with an
// underscore.
writeFileSync(join(work, '.nojekyll'), '');

/* ── the index ───────────────────────────────────────────────────────────── */

const isLive = (v) => existsSync(join(work, v.slug, 'index.html'));

// Previews are carried onto the branch so the deployed hub shows the same
// pictures the local one does. They are the content of that page — a version
// list with no pictures is variants.json with a stylesheet.
if (existsSync(join(ROOT, 'previews'))) {
  cpSync(join(ROOT, 'previews'), join(work, 'previews'), { recursive: true });
}

writeFileSync(join(work, 'index.html'), buildHub(REGISTER, {
  mode: 'remote',
  root: work,
  repoRoot: ROOT,
  isLive,
  origin: ORIGIN,
  base: BASE,
}));

/* ── publish ─────────────────────────────────────────────────────────────── */

const label = `deploy ${slug}: ${source}${dirty ? ' (dirty tree)' : ''}`;

git(['add', '-A'], work);
const staged = gitq(['status', '--porcelain'], work);

if (!staged) {
  console.log('\n  nothing changed — the branch already matches this build');
} else {
  git(['-c', 'user.name=Aleksandrs Sigovs', '-c', 'user.email=sigovs@gmail.com',
    'commit', '-q', '-m', label], work);
  git(fresh ? ['push', '-q', '--force', 'origin', BRANCH] : ['push', '-q', 'origin', BRANCH], work);
}

rmSync(work, { recursive: true, force: true });

console.log(`\n  index    ${ORIGIN}${BASE}`);
console.log(`  variant  ${ORIGIN}${publicBase}`);
console.log('  Pages usually serves the new build within a minute.\n');
