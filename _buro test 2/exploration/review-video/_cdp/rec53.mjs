/* V5.3 — the navigation walk. Overview, three buildings without ever going home, a
   suite, back to its building, another building, the plan, a switch from inside the
   plan, out, home. Real cursor, real events; nothing calls the state machine. */
import { connect, recorder, sleep, moveTo, clickAt, CURSOR_JS } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html'
const DIR = 'exploration/review-video/_cdp/frames-v53'
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
const S = () => ev('(() => { const S=window.__v5.S; return { level:S.level, b:S.building?S.building.num:null, prev:S.preview?S.preview.num:null, plan:S.plan } })()')
const pointOn = async (num, want = 'prev') => {
  const proj = await ev(`(() => { const gl=window.__v5.gl, cam=gl.camera, V=cam.position.constructor, out=[]
    const r = window.__v5.stage.getBoundingClientRect()
    gl.site.traverse(o => { if(o.userData && o.userData.pick && o.userData.num === ${JSON.stringify(num)}) {
      const p=o.getWorldPosition(new V()); p.project(cam)
      if (p.z <= 1) out.push([Math.round(r.left+(p.x*.5+.5)*r.width), Math.round(r.top+(-p.y*.5+.5)*r.height)]) } })
    return out })()`)
  for (const [cx, cy] of proj) for (let rr = 0; rr <= 70; rr += 7) for (let a = 0; a < (rr ? 12 : 1); a++) {
    const x = cx + Math.round(rr * Math.cos(a * Math.PI / 6)), y = cy + Math.round(rr * Math.sin(a * Math.PI / 6))
    if (x < 26 || x > VW - 26 || y < 92 || y > VH - 240) continue
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
    const st = await S()
    if ((want === 'prev' && st.prev === num) || (want === 'hover' && st.b === null)) return [x, y]
    if (want === 'hover') { const h = await ev('window.__v5.S.hover ? window.__v5.S.hover.num : null'); if (h === num) return [x, y] }
  }
  return null
}
const at = (sel) => ev(`(() => { const b=document.querySelector(${JSON.stringify(sel)}); if(!b||b.hidden) return null
  const r=b.getBoundingClientRect(); if(!r.width) return null; return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)

const rec = recorder(cdp, DIR)
await rec.start({ maxWidth: VW, maxHeight: VH })
let cur = [720, 460]

await ev('window.__v5.overview()'); await sleep(2600)

/* 03, from the compound */
let p = await pointOn('03', 'hover')
if (p) { cur = await moveTo(cdp, cur, p, 28, 17); await sleep(900); await clickAt(cdp, p); await sleep(2600) }

/* 04 and 05 — from inside, never going home */
for (const nn of ['04', '05']) {
  const q = await pointOn(nn)
  if (q) { cur = await moveTo(cdp, cur, q, 24, 17); await sleep(1000); await clickAt(cdp, q); await sleep(2300) }
  else { const nb = await at('[data-nav-b="' + nn + '"]'); if (nb) { cur = await moveTo(cdp, cur, nb, 20, 17); await sleep(700); await clickAt(cdp, nb); await sleep(2300) } }
}

/* a suite in 05, then back to its building */
const bay = await ev(`(() => { const bs=[...document.querySelectorAll('[data-bays] [data-bay]')].filter(b=>b.dataset.sold!=='true')
  const b=bs[Math.min(2,bs.length-1)]; const r=b.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
cur = await moveTo(cdp, cur, bay, 20, 16); await sleep(900); await clickAt(cdp, bay); await sleep(2800)
const ctx = await at('[data-ctx]')
if (ctx) { cur = await moveTo(cdp, cur, ctx, 22, 17); await sleep(700); await clickAt(cdp, ctx); await sleep(2200) }

/* 07 through the navigator — the declared fallback when the camera hides a building */
const n7 = await at('[data-nav-b="07"]')
if (n7) { cur = await moveTo(cdp, cur, n7, 24, 17); await sleep(900); await clickAt(cdp, n7); await sleep(2600) }

/* the plan, a switch from inside it, and out */
const pl = await at('[data-plan-open]') || await at('[data-plan-open]')
if (pl) { cur = await moveTo(cdp, cur, pl, 22, 17); await sleep(600); await clickAt(cdp, pl); await sleep(2600) }
else { await ev('window.__v5.openPlan()'); await sleep(2600) }
const g10 = await ev(`(() => { const el=document.querySelector('.plan__map g[data-building="10"] .phit'); if(!el) return null
  const r=el.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
if (g10) { cur = await moveTo(cdp, cur, g10, 26, 17); await sleep(1200); await clickAt(cdp, g10); await sleep(3000) }

/* home */
const ovb = await at('[data-overview]')
if (ovb) { cur = await moveTo(cdp, cur, ovb, 24, 17); await sleep(700); await clickAt(cdp, ovb); await sleep(3000) }

const n = await rec.stop()
console.log(JSON.stringify({ frames: n, dir: DIR, end: await S() }))
process.exit(0)
