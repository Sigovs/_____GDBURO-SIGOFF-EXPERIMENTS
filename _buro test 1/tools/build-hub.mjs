#!/usr/bin/env node
// Builds the PORTAL — index.html in the project root — from variants.json.
//
//   node tools/build-hub.mjs      or      npm run hub
//
// It lists every version in this folder with a picture of each, and links to
// them by filename. "Live" is asked of the disk: the file is either lying there
// beside this page or it is not. It used to be asked of a gh-pages branch on a
// separate repository, with a `git fetch` to find out; both are gone.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildHub, previewFor } from './hub.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const REGISTER = JSON.parse(readFileSync(join(ROOT, 'variants.json'), 'utf8'));

const isLive = (v) => existsSync(join(ROOT, v.file));

const html = buildHub(REGISTER, { root: ROOT, isLive });

writeFileSync(join(ROOT, 'index.html'), html);

console.log(`\n  index.html  —  ${REGISTER.variants.length} version(s)`);
for (const v of REGISTER.variants) {
  const shot = previewFor(ROOT, v.file);
  console.log(`    ${v.file.padEnd(18)} ${isLive(v) ? 'built' : 'MISSING'}  ${shot ? '' : ' NO PREVIEW — npm run shoot'}`);
}
console.log('');
