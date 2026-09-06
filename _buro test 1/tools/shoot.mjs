#!/usr/bin/env node
// Screenshots every registered variant into previews/.
//
//   node tools/shoot.mjs                 every variant, from the deployed site
//   node tools/shoot.mjs --local         from the dev server instead
//   node tools/shoot.mjs v01-level-line  just one
//
// WHY IT WAITS RATHER THAN SNAPS. This page opens on a near-black frame and
// spends two and a half seconds bringing the light up, moving the camera in and
// setting the designation. Screenshot it on load and every card in the hub is a
// black rectangle — which is exactly what the page looks like at t=0, and
// exactly nothing anyone wants to look at in a grid.
//
// So the shot is taken at a SCROLL POSITION, after the model has actually
// arrived. `scroll` in variants.json says where; the default is 0.82, which on
// this build is the hero. Before scrolling it waits for the canvas to contain
// something other than a flat field, so a slow model load delays the shot rather
// than being caught by it — a preview of a machine that had not loaded yet is
// worse than no preview, because it looks like a broken build.

import { readFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'previews');
const REGISTER = JSON.parse(readFileSync(join(ROOT, 'variants.json'), 'utf8'));
// The folder is published as part of the repository it lives in, which GitHub
// serves whole. There is no per-variant folder and no second repository any
// more, so the address of a variant is the origin plus its own filename.
const ORIGIN = 'https://sigovs.github.io/_____GDBURO-SIGOFF-EXPERIMENTS/_buro%20test%201/';

// 5200 is the port vite.config.js opens, and --local assumes it. It is also a
// port a SECOND checkout of this project can be holding — this repository is
// worked in more than one worktree, and the server answering 5200 is whichever
// one started first, which is not necessarily the one being shot. So the origin
// can be said out loud when it matters:
//
//   BURO_DEV=http://localhost:5201/ node tools/shoot.mjs --local index2.html
const DEV = process.env.BURO_DEV || 'http://localhost:5200/';

const args = process.argv.slice(2).filter((a) => a !== '--');
const local = args.includes('--local');
const only = args.find((a) => !a.startsWith('--'));

const variants = REGISTER.variants.filter((v) => !only || v.file === only);
if (!variants.length) {
  console.error(`\n  no variant matching "${only}" in variants.json\n`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const urlFor = (v) => (local ? (v.dev || DEV.replace(/\/?$/, '/') + v.file) : ORIGIN + v.file);

console.log(`\n  shooting ${variants.length} variant${variants.length === 1 ? '' : 's'} from ${local ? DEV : ORIGIN}\n`);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },   // 16:10, which is the card's aspect
  deviceScaleFactor: 2,
});

let failed = 0;

for (const v of variants) {
  const url = urlFor(v);
  process.stdout.write('  ' + v.file.padEnd(18));
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });

    // Wait for the scene to have painted. A canvas that is still one flat colour
    // is a scene that has not arrived, and it is what a naive shot catches.
    await page.waitForFunction(() => {
      const c = document.querySelector('canvas#scene');
      if (!c || !c.width) return false;
      const g = c.getContext('webgl2') || c.getContext('webgl');
      if (!g) return false;
      const px = new Uint8Array(4 * 64);
      g.readPixels(
        Math.floor(c.width / 2) - 8, Math.floor(c.height / 2) - 8,
        8, 8, g.RGBA, g.UNSIGNED_BYTE, px,
      );
      let min = 255; let max = 0;
      for (let i = 0; i < px.length; i += 4) {
        for (let k = 0; k < 3; k++) { min = Math.min(min, px[i + k]); max = Math.max(max, px[i + k]); }
      }
      return max - min > 6;
    }, null, { timeout: 30000 }).catch(() => process.stdout.write('[flat canvas] '));

    // Scroll to the frame worth showing, then let the damped camera settle.
    await page.evaluate((f) => {
      const h = document.body.scrollHeight - window.innerHeight;
      window.scrollTo({ top: h * f, behavior: 'instant' });
    }, v.scroll ?? 0.82);
    await page.waitForTimeout(2800);

    await page.screenshot({
      path: join(OUT, v.file.replace(/\.html?$/i, '') + '.jpg'),
      type: 'jpeg',
      quality: 84,
    });
    process.stdout.write('ok\n');
  } catch (e) {
    failed++;
    process.stdout.write('FAILED — ' + String(e.message).split('\n')[0] + '\n');
  }
}

await browser.close();

console.log(`\n  written to previews/${failed ? `  (${failed} failed)` : ''}`);
console.log('  rebuild the hub:  npm run hub\n');

process.exit(failed ? 1 : 0);
