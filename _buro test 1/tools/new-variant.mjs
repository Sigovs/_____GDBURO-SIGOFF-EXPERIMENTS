#!/usr/bin/env node
// Registers a new variant.
//
//   node tools/new-variant.mjs index2.html "Name" "what this one is trying"
//
// It only writes the register entry and rebuilds the hub. It does NOT branch,
// copy or scaffold any source — a variant of this project is a state of the
// source, and which mechanism holds that state (a branch, a stash, an edit in
// place) is a decision per experiment rather than one this script should make
// on your behalf.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
const FILE = join(ROOT, 'variants.json');

const [file, name, note] = process.argv.slice(2).filter((a) => a !== '--');

if (!file) {
  console.error('\n  node tools/new-variant.mjs index2.html "Name" "note"\n');
  process.exit(1);
}
// A variant is indexN.html beside this folder's other versions, which is the
// naming every _buro test uses and the name the dashboard links. Anything else
// is registered under a name nothing will look for.
if (!/^index\d+\.html$/.test(file)) {
  console.error(`\n  "${file}" is not a usable variant name.`);
  console.error('  it must be indexN.html — index2.html, index3.html.\n');
  process.exit(1);
}

const register = JSON.parse(readFileSync(FILE, 'utf8'));

if (register.variants.some((v) => v.file === file)) {
  console.error(`\n  "${file}" is already registered.\n`);
  process.exit(1);
}

// The newest goes first: presentation order is the file's order, and the thing
// being worked on is the thing you want at the top of the hub.
for (const v of register.variants) if (v.status === 'current') v.status = 'superseded';

register.variants.unshift({
  file,
  name: name || file,
  note: note || '',
  date: new Date().toISOString().slice(0, 10),
  status: 'current',
});

writeFileSync(FILE, JSON.stringify(register, null, 2) + '\n');

console.log(`\n  registered ${file} — "${name || file}"`);
console.log('  previous "current" is now "superseded"\n');

execFileSync(process.execPath, [join(ROOT, 'tools', 'build-hub.mjs')], { cwd: ROOT, stdio: 'inherit' });

console.log('  when it is ready:  npm run publish');
console.log('                     npm run shoot\n');
