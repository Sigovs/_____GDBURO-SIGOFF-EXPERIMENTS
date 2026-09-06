/* THE WHOLE PAGE, TOP TO FOOTER, at natural reading speed — the live integrated review
   route, with V5 in act 02. Real scroll, real motion, real pointer inside act 02. */
import { connect, recorder, sleep, moveTo, clickAt, CURSOR_JS } from './cdp.mjs'
import { ensure } from './chrome.mjs'

const URL = process.argv[2] || 'http://localhost:5183/exploration/integrated/v5-full-site.html'
const DIR = 'exploration/review-video/_cdp/frames-site'
const VW = 1440, VH = 900

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(8000)

const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
await ev(CURSOR_JS)
/* eased programmatic scroll — a wheel burst reads as jitter on video, and what is being
   reviewed here is the page's own motion, not the input device */
const glide = (to, ms) => ev(`new Promise(res => { const from=scrollY, d=${ms}, t0=performance.now()
  const e=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2
  ;(function step(now){ const t=Math.min(1,(now-t0)/d); scrollTo(0, from+(${to}-from)*e(t))
    t<1?requestAnimationFrame(step):res(Math.round(scrollY)) })(performance.now()) })`)
const topOf = (id) => ev(`(() => { const el=document.getElementById(${JSON.stringify(id)}); if(!el) return null
  return Math.round(el.getBoundingClientRect().top + scrollY) })()`)
const hoverNum = () => ev('window.__v5.S.hover ? window.__v5.S.hover.num : null')
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
const btn = (sel) => ev(`(() => { const b=document.querySelector(${JSON.stringify(sel)}); if(!b) return null
  const r=b.getBoundingClientRect(); if(!r.width) return null
  return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)

const rec = recorder(cdp, DIR)
await rec.start({ maxWidth: VW, maxHeight: VH })
let cur = [720, 470]

await ev('scrollTo(0,0)')
await sleep(4200)                              /* 00 ENTRY */
await glide(await topOf('act-01'), 4200)
await sleep(3000)                              /* 01 ARRIVAL */

/* --- 02, and it is used rather than passed --- */
await glide(await topOf('act-02') + 40, 4200)
await sleep(3000)
await ev('window.__v5.overview()')
await sleep(2200)
for (const n of ['06', '02']) {
  const p = await pointOn(n)
  if (p) { cur = await moveTo(cdp, cur, p, 26, 17); await sleep(900) }
}
const p03 = await pointOn('03')
if (p03) { cur = await moveTo(cdp, cur, p03, 26, 17); await sleep(700); await clickAt(cdp, p03); await sleep(3000) }
const bay = await ev(`(() => { const bs=[...document.querySelectorAll('[data-bays] [data-bay]')].filter(b=>b.dataset.sold!=='true')
  const b=bs[4]; const r=b.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
cur = await moveTo(cdp, cur, bay, 22, 17); await sleep(900)
await clickAt(cdp, bay); await sleep(3000)
const en = await btn('[data-enter]')
if (en) { cur = await moveTo(cdp, cur, en, 24, 17); await sleep(600); await clickAt(cdp, en); await sleep(4000) }
const go = await btn('[data-go]')
if (go) { cur = await moveTo(cdp, cur, go, 22, 17); await sleep(700); await clickAt(cdp, go); await sleep(4200) }

/* --- the rest of the page --- */
for (const id of ['act-03', 'act-04', 'act-05', 'act-06', 'act-07']) {
  const t = await topOf(id)
  if (t == null) continue
  await glide(t, 4600)
  await sleep(3000)
}
await glide(await ev('document.documentElement.scrollHeight - innerHeight'), 4200)
await sleep(3600)                              /* FOOTER */
await glide(0, 5200)                           /* and back up, in one move */
await sleep(2600)

const n = await rec.stop()
console.log(JSON.stringify({ frames: n, dir: DIR }))
process.exit(0)
