/* The V5.3 state sheet — every state the navigation brief asks to see, reached the way a
   visitor reaches it, and each shot captioned with the state it actually captured. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
import fs from 'node:fs'
const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html'
const DIR = 'exploration/study/shots53'
fs.mkdirSync(DIR, { recursive: true })
const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
const errors = []
cdp.on('Runtime.exceptionThrown', (p) => errors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text))
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1.5, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
const move = (x, y) => cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
const click = async (x, y) => {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 }); await sleep(70)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 }) }
let n = 0
const shot = async (name, wait = 1300) => {
  await sleep(wait)
  const st = await ev('(() => { const S=window.__v5.S; return S.level + (S.plan?" +plan":"") + "  b=" + (S.building?S.building.num:"-") + "  preview=" + (S.preview?S.preview.num:"-") + "  s=" + (S.suite?S.suite.ref:"-") })()')
  const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 })
  const f = DIR + '/N' + (++n) + '-' + name + '.jpeg'
  fs.writeFileSync(f, Buffer.from(r.data, 'base64'))
  console.log('  ' + f.padEnd(50) + st)
}
const navPt = (num) => ev(`(() => { const b=document.querySelector('[data-nav-b="${num}"]'); if(!b) return null
  const r=b.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)

await ev(`window.__v5.selectBuilding(window.__v5.compound.byNum.get('03'))`)
await shot('BUILDING-03-SELECTED', 2200)
const p4 = await navPt('04')
await move(p4[0], p4[1]); await shot('NAVIGATOR-04-PREVIEW-FROM-03', 900)
await ev(`window.__v5.previewBuilding(window.__v5.compound.byNum.get('04'))`)
await shot('04-PREVIEWED-ON-THE-MODEL', 900)
await click(p4[0], p4[1]); await shot('04-SELECTED-DIRECTLY', 2000)
await ev(`(() => { const v=window.__v5; v.selectSuite(v.S.building.suites.find(x=>!x.sold)) })()`)
await shot('SUITE-IN-04', 2000)
await ev('window.__v5.openPlan()')
await shot('SITE-PLAN-AS-A-LAYER', 2000)
const g10 = await ev(`(() => { const el=document.querySelector('.plan__map g[data-building="10"] .phit'); if(!el) return null
  const r=el.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
if (g10) { await move(g10[0], g10[1]); await shot('PLAN-10-UNDER-THE-POINTER', 800); await click(g10[0], g10[1]) }
await shot('SWITCHED-TO-10-FROM-THE-PLAN', 2400)
await ev('window.__v5.overview()')
await shot('OVERVIEW-RETURN', 2400)
console.log('CONSOLE ERRORS: ' + (errors.length ? errors.join(' | ') : 'none'))
process.exit(0)
