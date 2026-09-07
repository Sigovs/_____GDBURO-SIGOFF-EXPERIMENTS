/* DOES THE CAMERA ACTUALLY TRAVEL. Samples the camera's world position every 40ms across
   a transition and reports how many distinct frames it occupied and how far it moved.
   A cut shows up as one sample at the old pose and the next at the new one. */
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
const [,, URL] = process.argv
const health = await ensure(); const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
/* A THROWAWAY FIRST LEG. The first measured leg came back with ZERO samples — not a
   camera that did not move, an interval that never fired — while every leg after it
   sampled sixty times. That is the harness warming up, not the product cutting, and
   the way to prove which is to make the first leg one nobody reads. */
const legs = [
  ['(warm-up, not reported)', `window.__v5.selectBuilding(window.__v5.compound.byNum.get('05'))`],
  ['compound (again)', `window.__v5.overview()`],
  ['compound -> 03', `window.__v5.selectBuilding(window.__v5.compound.byNum.get('03'))`],
  ['03 -> 04', `window.__v5.selectBuilding(window.__v5.compound.byNum.get('04'))`],
  ['04 -> 07', `window.__v5.selectBuilding(window.__v5.compound.byNum.get('07'))`],
  ['07 -> 10', `window.__v5.selectBuilding(window.__v5.compound.byNum.get('10'))`],
  ['10 -> suite', `(() => { const v=window.__v5; v.selectSuite(v.compound.byNum.get('10').suites.find(s=>!s.sold)) })()`],
  ['suite -> overview', `window.__v5.overview()`],
]
await ev(`window.__v5.overview()`); await sleep(2400)
console.log('CAMERA TRAVEL, sampled at 40ms')
for (const [name, act] of legs) {
  await ev(`window.__v5.__samples = []; (() => { const A = window.__v5.gl
    clearInterval(window.__v5.__iv)
    window.__v5.__iv = setInterval(() => { const p = A.camera.position
      window.__v5.__samples.push([p.x, p.y, p.z]) }, 40) })()`)
  await ev(act)
  await sleep(2400)
  const s = await ev(`(() => { clearInterval(window.__v5.__iv); return window.__v5.__samples })()`)
  let moved = 0, steps = 0, biggest = 0
  for (let i = 1; i < s.length; i++) {
    const d = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1], s[i][2] - s[i - 1][2])
    if (d > 1e-4) { steps++; moved += d; biggest = Math.max(biggest, d) }
  }
  console.log('  ' + name.padEnd(20) + 'samples ' + String(s.length).padStart(3) + '  '
    + 'frames that moved ' + String(steps).padStart(3)
    + '   total travel ' + moved.toFixed(2).padStart(7)
    + '   biggest single step ' + biggest.toFixed(3)
    + '   ' + (steps >= 8 ? 'TRAVELS' : 'CUT'))
}
process.exit(0)
