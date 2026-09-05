#!/usr/bin/env node
// Registers a new variant.
//
//   node tools/new-variant.mjs v02-slug "Name" "what this one is trying"
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

const [slug, name, note] = process.argv.slice(2).filter((a) => a !== '--');

if (!slug) {
  console.error('\n  node tools/new-variant.mjs v02-slug "Name" "note"\n');
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error(`\n  "${slug}" is not a usable slug — it becomes a URL path.`);
  console.error('  lower case, digits and hyphens only.\n');
  process.exit(1);
}

const register = JSON.parse(readFileSync(FILE, 'utf8'));

if (register.variants.some((v) => v.slug === slug)) {
  console.error(`\n  "${slug}" is already registered.\n`);
  process.exit(1);
}

// The newest goes first: presentation order is the file's order, and the thing
// being worked on is the thing you want at the top of the hub.
for (const v of register.variants) if (v.status === 'current') v.status = 'superseded';

register.variants.unshift({
  slug,
  name: name || slug,
  note: note || '',
  date: new Date().toISOString().slice(0, 10),
  status: 'current',
  entries: [
    { path: '', label: 'The page' },
    { path: 'lab/rig.html', label: 'Rig bench' },
  ],
});

writeFileSync(FILE, JSON.stringify(register, null, 2) + '\n');

console.log(`\n  registered ${slug} — "${name || slug}"`);
console.log('  previous "current" is now "superseded"\n');

execFileSync(process.execPath, [join(ROOT, 'tools', 'build-hub.mjs')], { cwd: ROOT, stdio: 'inherit' });

console.log(`  when it is ready:  npm run deploy -- ${slug}`);
console.log('                     npm run shoot\n');
