#!/usr/bin/env node
// Build INDEX1 and publish it to the gh-pages branch.
//
//   npm run deploy
//
// The deploy had been a sequence of commands typed by hand, which is how the
// base path gets forgotten once and the whole page 404s on its own assets. It is
// a script so the two things that are easy to get wrong are not decisions:
// GITHUB_PAGES=1 is set here rather than remembered, and .nojekyll is written
// every time rather than when someone thinks of it — without it GitHub Pages
// runs Jekyll, which silently drops any path beginning with an underscore.
//
// dist/ carries its own throwaway repository. gh-pages holds built output that
// has no history worth keeping and would otherwise double the size of every
// clone of the source branch, so it is force-pushed as a single commit each time.

import { execFileSync } from 'node:child_process';
import { rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const REMOTE = 'https://github.com/Sigovs/gd_buro_tests.git';
const BRANCH = 'gh-pages';
const URL = 'https://sigovs.github.io/gd_buro_tests/';

// git runs WITHOUT a shell, and that is load-bearing on Windows: with
// `shell: true` the arguments are re-parsed by cmd, so `user.name=Aleksandrs
// Sigovs` and the commit message split on their spaces and the commit fails.
// And npm is not spawned at all. It is npm.cmd on Windows, which current Node
// refuses to spawn without a shell (EINVAL) and warns about with one, so the
// build calls Vite's own entry through this same node binary instead. Fewer
// moving parts, and GITHUB_PAGES is set on the child's env rather than left to
// whoever types the command — forgetting it is what makes the deployed page
// request its assets from the domain root and 404 on every one of them.
const git = (args, cwd = ROOT) =>
  execFileSync('git', args, { cwd, stdio: 'inherit' });

const VITE = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const build = () =>
  execFileSync(process.execPath, [VITE, 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, GITHUB_PAGES: '1' },
  });

const quiet = (args, cwd = ROOT) =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

// The commit the deploy came from, so the live page can always be traced back to
// a revision rather than to "whatever was on that machine that afternoon".
let source = 'unknown';
let dirty = false;
try {
  source = quiet(['rev-parse', '--short', 'HEAD']);
  dirty = quiet(['status', '--porcelain']).length > 0;
} catch { /* not a repo, or no git — the deploy still works, it is just unlabelled */ }

console.log(`\n  building for ${URL}`);
if (dirty) console.log('  note: the working tree is dirty, so this deploy is not reproducible from a commit\n');

rmSync(DIST, { recursive: true, force: true });
build();

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('\n  dist/index.html is missing — the build produced nothing to publish.');
  process.exit(1);
}

// Jekyll is on by default on Pages and eats underscore-prefixed paths.
writeFileSync(join(DIST, '.nojekyll'), '');

// A throwaway repository, rebuilt every time. Anything left in dist/.git from a
// previous run would carry that run's remote and branch state into this one.
rmSync(join(DIST, '.git'), { recursive: true, force: true });

const label = `deploy: ${source}${dirty ? ' (dirty tree)' : ''}`;

git(['init', '-q'], DIST);
git(['checkout', '-qb', BRANCH], DIST);
git(['add', '-A'], DIST);
git(['-c', 'user.name=Aleksandrs Sigovs', '-c', 'user.email=sigovs@gmail.com',
  'commit', '-q', '-m', label], DIST);
git(['remote', 'add', 'origin', REMOTE], DIST);
git(['push', '-q', '--force', 'origin', BRANCH], DIST);

const files = readdirSync(DIST).filter((f) => f !== '.git');
console.log(`\n  published ${files.length} entries to ${BRANCH}  [${label}]`);
console.log(`  ${URL}`);
console.log('  Pages usually serves the new build within a minute.\n');
