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
// WHY THE COPY AND NOT A BUILD STRAIGHT TO THE ROOT. dist/ is emptied on every
// build. Pointed at the project root that would delete the source it was built
// from, which is a thing you get to do exactly once.

import { rmSync, cpSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');

const REGISTER = JSON.parse(readFileSync(join(ROOT, 'variants.json'), 'utf8'));
const current = REGISTER.variants.find((v) => v.status === 'current') || REGISTER.variants[0];

if (!current) {
  console.error('\n  variants.json lists no version to publish.\n');
  process.exit(1);
}

// index1.html -> assets1. The assets folder is named for its page, so two
// versions in one folder cannot overwrite each other's chunks — the naming
// _buro test 3 already uses (index14.html beside assets14/).
const stem = current.file.replace(/\.html?$/i, '');
const assetsDir = stem.replace(/^index/, 'assets') || 'assets';

// npm is npm.cmd on Windows and current Node refuses to spawn it without a
// shell, so Vite's own entry is called through this same node binary instead.
const VITE = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

console.log(`\n  building ${current.file}  ->  ${assetsDir}/\n`);
execFileSync(process.execPath, [VITE, 'build'], {
  cwd: ROOT,
  stdio: 'inherit',
  // Set here rather than trusted to whoever types the command. GITHUB_PAGES
  // drops the lab benches from the build; without it the intake table globs
  // every model in assets/, including one the ledger marks do-not-ship.
  env: { ...process.env, GITHUB_PAGES: '1', VITE_ASSETS_DIR: assetsDir },
});

const built = join(DIST, current.file);
if (!existsSync(built)) {
  console.error(`\n  build produced no ${current.file} — nothing copied.\n`);
  process.exit(1);
}

for (const item of [current.file, assetsDir, 'decoders']) {
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
