#!/usr/bin/env node
/* previews/indexN.jpg — one shot per published version, for the portal.

   Shot from the PUBLISHED files over a plain static server, not from the dev server:
   the picture on the card has to be the page a visitor will actually get. Act 02 is
   given time to build its model and is put into its resting compound view first, so
   the card shows the compound rather than a half-loaded canvas.

     node tools/shoot-previews.mjs [baseUrl]
*/
import { connect, sleep } from '../exploration/review-video/_cdp/cdp.mjs'
import { ensure } from '../exploration/review-video/_cdp/chrome.mjs'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const BASE = (process.argv[2] || 'http://127.0.0.1:5199/_buro%20test%202/').replace(/\/?$/, '/')
const R = JSON.parse(readFileSync(join(ROOT, 'variants.json'), 'utf8'))
mkdirSync(join(ROOT, 'previews'), { recursive: true })

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })

const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  return r.exceptionDetails ? null : r.result?.value
}

for (const v of R.variants) {
  const url = BASE + v.file
  await cdp.send('Page.navigate', { url })
  /* wait for the model if this page has one, otherwise just for layout */
  let ready = false
  for (let i = 0; i < 40; i++) {
    await sleep(500)
    if (await ev('!!window.__v5')) { ready = true; break }
  }
  /* A card has to show what makes this build different. Two of these are the whole
     site and both open on the same photograph; the difference is act 02, so that is
     where they are shot. */
  if (v.shotAt && v.shotAt !== 'top') {
    await ev('(() => { const el = document.querySelector(' + JSON.stringify(v.shotAt) + '); if (el) el.scrollIntoView() })()')
    await sleep(2600)
  }
  await sleep(ready ? 6500 : 3500)
  if (ready) {
    /* the resting compound, and nothing hovered — a card should show the subject */
    await ev('window.__v5.overview()')
    await sleep(2200)
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 40, y: 980, buttons: 0 })
    await sleep(700)
  }
  await ev("(() => { const st = document.createElement('style'); st.textContent = '::-webkit-scrollbar{width:0;height:0}'; document.head.appendChild(st) })()")
  await sleep(250)
  const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 86 })
  const out = join(ROOT, 'previews', v.file.replace(/\.html?$/i, '') + '.jpg')
  writeFileSync(out, Buffer.from(shot.data, 'base64'))
  console.log('  shot  ' + v.file.padEnd(12) + (ready ? 'model ready' : 'static').padEnd(12) + (v.shotAt || 'top') + '   -> previews/' + v.file.replace(/\.html?$/i, '') + '.jpg')
}
process.exit(0)
