/* The state sheet: every state the brief asks to see, captured from the live page with
   real pointer input where the state is reachable by pointer. Writes into
   exploration/study/shots/ and reports any console error it saw on the way. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
import fs from 'node:fs'

const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html'
const DIR = process.argv[3] || 'exploration/study/shots'
const PRE = process.argv[4] || 'Z'
fs.mkdirSync(DIR, { recursive: true })

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
const errors = []
cdp.on('Runtime.exceptionThrown', (p) => errors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text))
cdp.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') errors.push(p.args.map((a) => a.value ?? a.description).join(' ')) })
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1.5, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 60; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)

const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
const move = (x, y) => cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
const click = async (x, y) => {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 })
  await sleep(70)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 })
}
let n = 0
const shot = async (name, wait = 1100) => {
  await sleep(wait)
  const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 })
  const f = DIR + '/' + PRE + (++n) + '-' + name + '.jpeg'
  fs.writeFileSync(f, Buffer.from(r.data, 'base64'))
  console.log('  ' + f)
}

/* a live point on a given building, via its own pick proxy */
const pointOn = async (num) => {
  const proj = await ev(`(() => { const gl=window.__v5.gl, cam=gl.camera, V=cam.position.constructor, out=[]
    gl.site.traverse(o => { if(o.userData && o.userData.pick && o.userData.num === ${JSON.stringify(num)}) {
      const p=o.getWorldPosition(new V()); p.project(cam); out.push([Math.round((p.x*.5+.5)*innerWidth), Math.round((-p.y*.5+.5)*innerHeight)]) } })
    return out })()`)
  for (const [cx, cy] of proj) {
    for (let r = 0; r <= 80; r += 8) {
      for (let a = 0; a < (r ? 12 : 1); a++) {
        const x = cx + Math.round(r * Math.cos(a * Math.PI / 6)), y = cy + Math.round(r * Math.sin(a * Math.PI / 6))
        if (x < 30 || x > 1410 || y < 90 || y > 700) continue
        await move(x, y)
        if (await ev('window.__v5.S.hover ? window.__v5.S.hover.num : null') === num) return [x, y]
      }
    }
  }
  return null
}

await ev('window.__v5.overview()'); await sleep(1600)
await move(720, 860)
await shot('COMPOUND-REST', 1600)

const p = await pointOn('03')
console.log('  hover point for 03: ' + (p ? p.join(',') : 'NONE'))
if (p) { await shot('BUILDING-HOVER', 700); await click(p[0], p[1]) }
else { await ev(`window.__v5.selectBuilding(window.__v5.compound.byNum.get('03'))`) }
await shot('BUILDING-SELECTED', 2200)

/* premium and standard suite hover, from the dock's own controls */
const bayAt = async (which) => ev(`(() => {
  const bs=[...document.querySelectorAll('#bays .bay')].filter(b => b.dataset.sold!=='true' && b.dataset.type===${JSON.stringify(which)})
  if(!bs.length) return null
  const r=bs[Math.min(1, bs.length-1)].getBoundingClientRect()
  return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
const pa = await bayAt('A')
if (pa) { await move(pa[0], pa[1]); await shot('SUITE-HOVER-PREMIUM', 900) }
const pb = await bayAt('B')
if (pb) { await move(pb[0], pb[1]); await shot('SUITE-HOVER-STANDARD', 900) }
if (pb) { await click(pb[0], pb[1]); await shot('SUITE-SELECTED', 1800) }
await move(720, 400)
await shot('ENTER-VISIBLE', 900)

await ev('window.__v5.openPlan()')
await shot('SITE-PLAN', 1800)
await ev('window.__v5.closePlan()')
await shot('BACK-TO-3D', 1400)
await ev('window.__v5.overview()')
await shot('OVERVIEW-RETURN', 2000)

console.log('CONSOLE ERRORS: ' + (errors.length ? errors.join(' | ') : 'none'))
process.exit(0)
