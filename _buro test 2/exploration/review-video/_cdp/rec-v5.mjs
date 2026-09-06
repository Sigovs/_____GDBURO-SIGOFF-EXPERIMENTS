/* A 60-90 SECOND WALK THROUGH ACT 02, driven by a visible cursor and real events.
   Nothing here calls the state machine: every hover is a dispatched move and every
   selection is a dispatched press, so what the video shows is what a visitor can do. */
import { connect, recorder, sleep, moveTo, clickAt, CURSOR_JS } from './cdp.mjs'
import { ensure } from './chrome.mjs'

const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html'
const DIR = process.argv[3] || 'exploration/review-video/_cdp/frames-v5'
const VW = 1440, VH = 900

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6500)

const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
await ev(CURSOR_JS)
const hoverNum = () => ev('window.__v5.S.hover ? window.__v5.S.hover.num : null')
/* a point that really answers for this building, found the way the QA finds it */
const pointOn = async (num) => {
  const proj = await ev(`(() => { const gl=window.__v5.gl, cam=gl.camera, V=cam.position.constructor, out=[]
    const r = window.__v5.stage.getBoundingClientRect()
    gl.site.traverse(o => { if(o.userData && o.userData.pick && o.userData.num === ${JSON.stringify(num)}) {
      const p=o.getWorldPosition(new V()); p.project(cam)
      out.push([Math.round(r.left+(p.x*.5+.5)*r.width), Math.round(r.top+(-p.y*.5+.5)*r.height)]) } })
    return out })()`)
  for (const [cx, cy] of proj) {
    for (let rr = 0; rr <= 80; rr += 8) {
      for (let a = 0; a < (rr ? 12 : 1); a++) {
        const x = cx + Math.round(rr * Math.cos(a * Math.PI / 6)), y = cy + Math.round(rr * Math.sin(a * Math.PI / 6))
        if (x < 30 || x > VW - 30 || y < 90 || y > VH - 200) continue
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
        if (await hoverNum() === num) return [x, y]
      }
    }
  }
  return null
}
const bayAt = (i) => ev(`(() => { const bs=[...document.querySelectorAll('[data-bays] [data-bay]')].filter(b=>b.dataset.sold!=='true')
  const b=bs[Math.min(${i}, bs.length-1)]; if(!b) return null; const r=b.getBoundingClientRect()
  return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
const btn = (sel) => ev(`(() => { const b=document.querySelector(${JSON.stringify(sel)}); if(!b) return null
  const r=b.getBoundingClientRect(); if(!r.width) return null
  return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)

const rec = recorder(cdp, DIR)
await rec.start({ maxWidth: VW, maxHeight: VH })
let cur = [720, 470]

await ev('window.__v5.overview()'); await sleep(2600)

/* 1. the compound at rest, then a sweep across three buildings */
for (const n of ['03', '02', '06', '10']) {
  const p = await pointOn(n)
  if (!p) continue
  cur = await moveTo(cdp, cur, p, 30, 17)
  await sleep(1050)
}
/* 2. choose one */
const p07 = await pointOn('07')
if (p07) { cur = await moveTo(cdp, cur, p07, 26, 17); await sleep(800) }
const p03 = await pointOn('03')
cur = await moveTo(cdp, cur, p03, 30, 17)
await sleep(900)
await clickAt(cdp, p03)
await sleep(3000)

/* 3. run the suite rail, premium first */
for (const i of [0, 3, 6, 9]) {
  const b = await bayAt(i)
  if (!b) continue
  cur = await moveTo(cdp, cur, b, 20, 16)
  await sleep(950)
}
const pick = await bayAt(4)
cur = await moveTo(cdp, cur, pick, 16, 16)
await sleep(500)
await clickAt(cdp, pick)
await sleep(3200)

/* 4. ENTER */
const en = await btn('[data-enter]')
if (en) { cur = await moveTo(cdp, cur, en, 26, 17); await sleep(700); await clickAt(cdp, en); await sleep(4200) }

/* 5. back out — the contextual step, then the global one */
const back = await btn('[data-ctx]')
if (back) { cur = await moveTo(cdp, cur, back, 26, 17); await sleep(500); await clickAt(cdp, back); await sleep(2600) }
const ovb = await btn('[data-overview]')
if (ovb) { cur = await moveTo(cdp, cur, ovb, 24, 17); await sleep(500); await clickAt(cdp, ovb); await sleep(3000) }

/* 6. the site plan, and back */
const pl = await btn('[data-plan-open]')
if (pl) { cur = await moveTo(cdp, cur, pl, 26, 17); await sleep(600); await clickAt(cdp, pl); await sleep(2800) }
const ex = await btn('[data-plan-exit]')
if (ex) { cur = await moveTo(cdp, cur, ex, 26, 17); await sleep(900); await clickAt(cdp, ex); await sleep(2800) }

const n = await rec.stop()
console.log(JSON.stringify({ frames: n, dir: DIR }))
process.exit(0)
