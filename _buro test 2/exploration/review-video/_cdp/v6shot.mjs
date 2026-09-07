import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
/* WAIT FOR THE CAMERA TO ARRIVE — but wait for it to LEAVE first.
   The first cut polled `moving` immediately after the click and found it false, because
   the interface hands the selection to the model on the next frame: settle returned
   before the flight had begun, the harness read every door position mid-flight, and
   reported a door at the far left of the frame that would not answer a click. The
   product was correct and the measurement was not. */
const settle = async (evf, max = 5000) => {
  const t0 = Date.now()
  const moving = () => evf('!!(window.__v5.gl && window.__v5.gl.moving)')
  while (Date.now() - t0 < 700 && !(await moving())) await sleep(50)
  while (Date.now() - t0 < max && (await moving())) await sleep(70)
  await sleep(300)
}
import fs from 'node:fs'
const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v6-architecture-ui.html'
const DIR = process.argv[3] || 'exploration/study/shots6'
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
const st = () => ev('(() => { const S = window.__v5.S; return S.level + "  b=" + (S.building?S.building.num:"-") + "  s=" + (S.suite?S.suite.ref:"-") + "  hs=" + (S.hoverSuite?S.hoverSuite.ref:"-") + "  hov=" + (S.hover?S.hover.num:"-") + (S.plan?"  +plan":"") })()')
let n = 0
const shot = async (name, wait = 1300) => {
  await sleep(wait)
  const s = await st()
  const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 })
  const f = DIR + '/V' + (++n) + '-' + name + '.jpeg'
  fs.writeFileSync(f, Buffer.from(r.data, 'base64'))
  console.log('  ' + f.padEnd(46) + s)
}
if (await ev('!!document.getElementById("act-02")')) { await ev('document.getElementById("act-02").scrollIntoView()'); await sleep(2200) }
const bPoint = async (num) => {
  const proj = await ev(`(() => { const gl=window.__v5.gl, cam=gl.camera, V=cam.position.constructor, out=[]
    const r = window.__v5.stage.getBoundingClientRect()
    gl.site.traverse(o => { if(o.userData && o.userData.pick && o.userData.num === ${JSON.stringify(num)}) {
      const p=o.getWorldPosition(new V()); p.project(cam); if(p.z<=1) out.push([Math.round(r.left+(p.x*.5+.5)*r.width), Math.round(r.top+(-p.y*.5+.5)*r.height)]) } })
    return out })()`)
  for (const [cx, cy] of proj) for (let rr = 0; rr <= 70; rr += 7) for (let a = 0; a < (rr ? 12 : 1); a++) {
    const x = cx + Math.round(rr*Math.cos(a*Math.PI/6)), y = cy + Math.round(rr*Math.sin(a*Math.PI/6))
    if (x < 26 || x > 1414 || y < 90 || y > 700) continue
    await move(x, y)
    const s = await ev('(() => { const S=window.__v5.S; return (S.hover&&S.hover.num) || (S.preview&&S.preview.num) || null })()')
    if (s === num) return [x, y]
  }
  return null
}
await ev('window.__v5.overview()'); await sleep(1800)
await move(30, 870)
await shot('COMPOUND-REST', 1800)
const p3 = await bPoint('03')
if (p3) { await shot('BUILDING-HOVER', 700); await click(p3[0], p3[1]) }
await shot('BUILDING-SELECTED', 2400)
const doors = await ev(`(() => { const gl=window.__v5.gl, v=window.__v5, r=v.stage.getBoundingClientRect(), out=[]
  for (const s of v.S.building.suites) { const p = gl.doorPoint(s.index, r.width, r.height)
    if (p) out.push({ ref:s.ref, sold:s.sold, x:Math.round(r.left+p[0]), y:Math.round(r.top+p[1]) }) } return out })()`)
let hit = null
for (const d of doors.filter(x => !x.sold)) { for (const dy of [0,12,-12,24,-24]) { await move(d.x, d.y+dy)
  if (await ev('window.__v5.S.hoverSuite ? window.__v5.S.hoverSuite.ref : null') === d.ref) { hit = {...d, y:d.y+dy}; break } } if (hit) break }
if (hit) { await shot('REAL-DOOR-HOVER', 900); await click(hit.x, hit.y) }
await shot('SUITE-SELECTED', 2400)
await move(1200, 300)
await shot('PRODUCT-DOCK', 900)
await ev('window.__v5.openPlan()')
await shot('SITE-PLAN', 2200)
await ev('window.__v5.closePlan()')
await ev('window.__v5.overview()')
await shot('OVERVIEW-RETURN', 2400)
console.log('CONSOLE ERRORS: ' + (errors.length ? errors.join(' | ') : 'none'))
process.exit(0)
