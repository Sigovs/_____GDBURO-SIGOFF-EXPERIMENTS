/* V6 — THE WALK THE BRIEF ASKS TO SEE.

   Overview, hover a building, select it, hover a REAL GARAGE DOOR on the model, select
   that suite, ENTER, then switch straight to another building without going home, and
   home at the end. Every step is a real pointer at a real screen coordinate: nothing in
   here calls the state machine, so what the video shows is what a visitor can do.
*/
import { connect, recorder, sleep, moveTo, clickAt, CURSOR_JS } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v6-architecture-ui.html'
const DIR = 'exploration/review-video/_cdp/frames-v6'
const VW = 1440, VH = 900
const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6500)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
await ev(CURSOR_JS)
const S = () => ev('(() => { const S=window.__v5.S; return { level:S.level, b:S.building?S.building.num:null, s:S.suite?S.suite.ref:null, plan:S.plan } })()')

/* WHERE IS BUILDING N ON SCREEN. The pick proxies carry the number, so the search starts
   at the projected centre of one and spirals out until the model actually reports that
   building as hovered — a projected centre can land on a roof that is behind another. */
const pointOn = async (num) => {
  const proj = await ev(`(() => { const gl=window.__v5.gl, cam=gl.camera, V=cam.position.constructor, out=[]
    const r = window.__v5.stage.getBoundingClientRect()
    gl.site.traverse(o => { if(o.userData && o.userData.pick && o.userData.num === ${JSON.stringify(num)}) {
      const p=o.getWorldPosition(new V()); p.project(cam)
      if (p.z <= 1) out.push([Math.round(r.left+(p.x*.5+.5)*r.width), Math.round(r.top+(-p.y*.5+.5)*r.height)]) } })
    return out })()`)
  for (const [cx, cy] of proj) for (let rr = 0; rr <= 70; rr += 7) for (let a = 0; a < (rr ? 12 : 1); a++) {
    const x = cx + Math.round(rr * Math.cos(a * Math.PI / 6)), y = cy + Math.round(rr * Math.sin(a * Math.PI / 6))
    if (x < 26 || x > VW - 26 || y < 92 || y > VH - 120) continue
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
    const h = await ev('(() => { const S=window.__v5.S; return (S.preview&&S.preview.num) || (S.hover&&S.hover.num) || null })()')
    if (h === num) return [x, y]
  }
  return null
}
/* WHERE IS A REAL DOOR. api.doorPoint projects the leaf itself; the spiral confirms the
   model answers with that suite rather than with the bay behind it. */
const pointOnDoor = async (ref) => {
  const seed = await ev(`(() => { const gl=window.__v5.gl, r=window.__v5.stage.getBoundingClientRect()
    const s = window.__v5.compound.suites.find(x => x.ref === ${JSON.stringify(ref)}); if(!s) return null
    const p = gl.doorPoint(s.index, r.width, r.height); return p ? [Math.round(r.left+p[0]), Math.round(r.top+p[1])] : null })()`)
  if (!seed) return null
  for (let rr = 0; rr <= 26; rr += 4) for (let a = 0; a < (rr ? 10 : 1); a++) {
    const x = seed[0] + Math.round(rr * Math.cos(a * Math.PI / 5)), y = seed[1] + Math.round(rr * Math.sin(a * Math.PI / 5))
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
    const h = await ev('(() => { const S=window.__v5.S; return S.hoverSuite ? S.hoverSuite.ref : null })()')
    if (h === ref) return [x, y]
  }
  return seed
}
const at = (sel) => ev(`(() => { const b=document.querySelector(${JSON.stringify(sel)}); if(!b||b.hidden) return null
  const r=b.getBoundingClientRect(); if(!r.width) return null; return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)

const rec = recorder(cdp, DIR)
await rec.start({ maxWidth: VW, maxHeight: VH })
let cur = [720, 460]
const beats = []
const beat = async (name) => beats.push(name + '  ' + JSON.stringify(await S()))

await ev('window.__v5.overview()'); await sleep(2800)
await beat('01 rest')

/* hover 03 from the compound, hold, then select it */
let p = await pointOn('03')
if (p) { cur = await moveTo(cdp, cur, p, 30, 17); await sleep(1500); await beat('02 hover 03'); await clickAt(cdp, p); await sleep(3000) }
await beat('03 building 03')

/* a REAL garage door on the model — hover it, read its tag, then choose it */
const firstFree = await ev(`(() => { const b=window.__v5.compound.byNum.get('03')
  const s = b.suites.find(x => !x.sold); return s ? s.ref : null })()`)
let d = await pointOnDoor(firstFree)
if (d) { cur = await moveTo(cdp, cur, d, 26, 17); await sleep(1800); await beat('04 door hover ' + firstFree)
  await clickAt(cdp, d); await sleep(3000) }
await beat('05 suite ' + firstFree)

/* ENTER — held on screen, then pressed */
const en = await at('[data-enter]')
if (en) { cur = await moveTo(cdp, cur, en, 22, 17); await sleep(1400); await clickAt(cdp, en); await sleep(3400) }
await beat('06 entered')

/* straight to another building, from inside — no Overview in between */
await ev('window.__v5.backToBuilding()'); await sleep(2000)
/* WHICHEVER NEIGHBOURS ARE ACTUALLY IN THE FRAME. Naming two building numbers in advance
   assumes a camera pose; the first cut asked for 04 and 06 from inside 03, neither was on
   screen, and the walk silently skipped the one move the brief most wants to see. The
   pose decides which neighbours are reachable, so the walk asks the pose. */
let switched = 0
for (const nn of ['04', '02', '05', '01', '06', '07', '08', '09', '10', '11']) {
  if (switched >= 2) break
  const q = await pointOn(nn)
  if (!q) continue
  cur = await moveTo(cdp, cur, q, 26, 17); await sleep(1200); await clickAt(cdp, q); await sleep(2900)
  await beat('07 switched to ' + nn); switched++
}

/* home */
const ovb = await at('[data-overview]')
if (ovb) { cur = await moveTo(cdp, cur, ovb, 24, 17); await sleep(800); await clickAt(cdp, ovb); await sleep(3200) }
await beat('08 home')

const n = await rec.stop()
console.log('frames ' + n + '  ->  ' + DIR)
for (const b of beats) console.log('  ' + b)
process.exit(0)
