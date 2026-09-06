#!/usr/bin/env node
/* ==================================================================================
   BUILD, AND PUT THE RESULT WHERE THIS FOLDER PUBLISHES FROM.

     node tools/publish.mjs

   WHAT WAS WRONG BEFORE. This folder was published as SOURCE: GitHub Pages served
   index.html, index.html loaded /src/site/main.js, and main.js starts with
   `import './index.css'` — which is a Vite feature, not a browser one. Chrome
   refused it outright ("Expected a JavaScript-or-Wasm module script but the server
   responded with a MIME type of text/css") and the published Luxe Corsa card led to
   a page with no motion, no compound and no act 02 at all. It had never worked.

   WHAT PUBLISHING IS NOW. Build the three pages, flatten them to the top of this
   folder as indexN.html beside assets2/, regenerate the portal, commit. GitHub
   serves the repository whole, so there is no branch to force and nothing that can
   orphan a folder. Same convention as _buro test 1 and _buro test 3.

   WHY COPY RATHER THAN BUILD STRAIGHT TO THE ROOT. dist/ is emptied on every build.
   Pointed at the project root that would delete the source it was built from, which
   is a thing you get to do exactly once.

   WHY THE PAGES ARE FLATTENED. Two of the three are built from nested source paths,
   so Vite emits them with ../../assets2/ references and their runtime BASE_URL
   resolves against their own directory. Moving them to the top and rewriting those
   references is what makes ./models/ and ./draco/ correct for all three at once.
   ================================================================================== */

import { rmSync, cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')
const ASSETS = 'assets2'

const REGISTER = JSON.parse(readFileSync(join(ROOT, 'variants.json'), 'utf8'))
if (!REGISTER.variants?.length) {
  console.error('\n  variants.json lists nothing to publish.\n')
  process.exit(1)
}

/* npm is npm.cmd on Windows and current Node refuses to spawn it without a shell,
   so Vite's own entry is called through this same node binary instead. */
const VITE = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
console.log('\n  building ' + REGISTER.variants.length + ' pages  ->  ' + ASSETS + '/\n')
execFileSync(process.execPath, [VITE, 'build'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, VITE_ASSETS_DIR: ASSETS },
})

/* Only the built asset folder is copied. models/ and draco/ are not build output —
   they are committed at the top of this folder and published from there, which is why
   there is no publicDir and no second copy of 9.8 MB of geometry in the repository. */
for (const item of [ASSETS]) {
  const from = join(DIST, item)
  if (!existsSync(from)) continue
  rmSync(join(ROOT, item), { recursive: true, force: true })
  cpSync(from, join(ROOT, item), { recursive: true })
  console.log('  published  ' + item + '/')
}

for (const v of REGISTER.variants) {
  const built = join(DIST, v.from)
  if (!existsSync(built)) {
    console.error('\n  build produced no ' + v.from + ' — ' + v.file + ' not published.\n')
    process.exit(1)
  }
  let html = readFileSync(built, 'utf8')
  /* Whatever depth the source sat at, the published file sits at the top. */
  const up = relative(dirname(built), DIST).split(/[\\/]/).filter(Boolean)
  if (up.length) {
    const prefix = up.map(() => '..').join('/') + '/'
    const before = html
    html = html.split(prefix + ASSETS + '/').join('./' + ASSETS + '/')
    if (before === html && html.includes(prefix)) {
      console.error('  WARNING  ' + v.file + ' still holds ' + prefix + ' references')
    }
  }
  writeFileSync(join(ROOT, v.file), html)
  console.log('  published  ' + v.file.padEnd(12) + '<- ' + v.from)
}

mkdirSync(join(ROOT, 'previews'), { recursive: true })
execFileSync(process.execPath, [join(ROOT, 'tools', 'build-hub.mjs')], { cwd: ROOT, stdio: 'inherit' })

console.log('\n  commit and push — Pages serves this folder from the repository as it stands.\n')
