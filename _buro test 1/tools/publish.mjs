#!/usr/bin/env node
// Builds the current version and puts it where the folder publishes from.
//
//   npm run publish
//
// WHAT REPLACED WHAT. deploy.mjs used to clone a second repository, replace one
// folder inside its gh-pages branch and push. That repository — gd_buro_tests —
// no longer exists; its Pages site answers 404, and every link this project held
// to it was dead. This folder is now published as part of the repository it
// actually lives in, which GitHub serves whole:
//
//   https://sigovs.github.io/_____GDBURO-SIGOFF-EXPERIMENTS/_buro%20test%201/index1.html
//
// So publishing is: build, copy the build to the top of this folder, regenerate
// the portal. Committing it is a normal commit. There is no branch to force, no
// second remote, and nothing that can orphan a folder.
//
// IT PUBLISHES THE WHOLE REGISTER, NOT ONLY THE CURRENT ONE. This used to build
// just the entry marked "current", which is right when a version supersedes the
// one before it and wrong when versions stand BESIDE each other — three
// directions off one page, all four meant to be opened and compared. Building
// one at a time also meant one assets folder per version and four copies of
// three.js. One pass over every registered version emits every page into a
// single hashed folder, and the pages share what they have in common.
//
// WHY THE COPY AND NOT A BUILD STRAIGHT TO THE ROOT. dist/ is emptied on every
// build. Pointed at the project root that would delete the source it was built
// from, which is a thing you get to do exactly once.

import { rmSync, cpSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');

// THE GENERATED PAGES ARE REGENERATED FIRST, EVERY TIME.
//
// indexA/B/C.html are emitted from tools/gen-variants.mjs. They are committed —
// a build must not depend on a generator having been run by hand — but a
// committed generated file is only correct until someone edits the generator and
// not the output. Running it here makes the two impossible to get out of step,
// and makes the pages reproducible from a clean checkout by `npm run publish`
// alone. It also means they cannot go missing: the previous arrangement left
// them untracked and outside the register, so nothing rebuilt them and anything
// that swept untracked files took them away.
execFileSync(process.execPath, [join(ROOT, 'tools', 'gen-variants.mjs')], {
  cwd: ROOT, stdio: 'inherit',
});

const REGISTER = JSON.parse(readFileSync(join(ROOT, 'variants.json'), 'utf8'));

// A registered version with no source under src/ is skipped rather than failing
// the run, and the portal renders it as "missing" — which is the honest reading:
// the register says the version exists, the disk says it has not been written.
const publishing = REGISTER.variants.filter((v) => existsSync(join(ROOT, 'src', v.file)));
const unbuilt = REGISTER.variants.filter((v) => !publishing.includes(v));

if (!publishing.length) {
  console.error('\n  variants.json lists no version whose source is on disk.\n');
  process.exit(1);
}

// ONE hashed folder for all of them — the note on assetsDir in vite.config.js
// says why the per-page numbering does not apply to a single build pass.
const assetsDir = process.env.VITE_ASSETS_DIR || 'assets1';

// npm is npm.cmd on Windows and current Node refuses to spawn it without a
// shell, so Vite's own entry is called through this same node binary instead.
const VITE = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

console.log(`\n  building ${publishing.length} version(s)  ->  ${assetsDir}/`);
for (const v of publishing) console.log(`    ${v.file}`);
for (const v of unbuilt) console.log(`    ${v.file}  — no src/${v.file}, skipped`);
console.log('');
execFileSync(process.execPath, [VITE, 'build'], {
  cwd: ROOT,
  stdio: 'inherit',
  // Set here rather than trusted to whoever types the command. GITHUB_PAGES
  // drops the lab benches from the build; without it the intake table globs
  // every model in assets/, including one the ledger marks do-not-ship.
  env: { ...process.env, GITHUB_PAGES: '1', VITE_ASSETS_DIR: assetsDir },
});

// NOTHING is copied until every page asked for came out of the build. A partial
// copy leaves the folder holding some new pages and some stale ones, all pointing
// at one freshly rehashed assets folder — that is a set of 404s, not a version.
const missing = publishing.filter((v) => !existsSync(join(DIST, v.file)));
if (missing.length) {
  console.error(`\n  build produced no ${missing.map((v) => v.file).join(', ')} — nothing copied.\n`);
  process.exit(1);
}

for (const item of [...publishing.map((v) => v.file), assetsDir, 'decoders']) {
  const from = join(DIST, item);
  if (!existsSync(from)) continue;
  rmSync(join(ROOT, item), { recursive: true, force: true });
  cpSync(from, join(ROOT, item), { recursive: true });
  console.log(`  published  ${item}`);
}

execFileSync(process.execPath, [join(ROOT, 'tools', 'build-hub.mjs')], {
  cwd: ROOT, stdio: 'inherit',
});

console.log('  commit and push — GitHub Pages serves this folder from the repository as it stands.\n');
