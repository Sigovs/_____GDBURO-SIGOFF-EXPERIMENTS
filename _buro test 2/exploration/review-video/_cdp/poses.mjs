/* THE ARRIVAL POSE, ON EVERY BUILDING. One composed frame per building, so a camera rule
   is judged against all eleven rather than against the one it was tuned on. */
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
const URL = process.argv[2], OUT = process.argv[3] || 'exploration/audit/poses'
const health = await ensure(); const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
fs.mkdirSync(OUT, { recursive: true })
const nums = (process.argv[4] || '01,02,03,04,05,06,07,08,09,10,11').split(',')
for (const n of nums) {
  await ev(`window.__v5.overview()`); await sleep(1200)
  await ev(`window.__v5.selectBuilding(window.__v5.compound.byNum.get("${n}"))`); await sleep(2600)
  const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 82 })
  fs.writeFileSync(`${OUT}/B${n}.jpeg`, Buffer.from(s.data, 'base64'))
  /* HOW MUCH OF THE FRAME IS THE BUILDING THE VISITOR JUST CHOSE, and are its doors
     actually facing the camera — the two questions an arrival pose has to answer. */
  console.log(`  B${n}  ` + await ev(`(() => {
    const A = window.__v5.gl, T = A.THREE || null
    const b = window.__v5.compound.byNum.get('${n}')
    const idx = b.suites.map((s) => s.index)
    let seen = 0, front = 0
    for (const i of idx) { const p = A.doorPoint(i, 1440, 900); if (!p) continue
      seen++; if (p[0] > -40 && p[0] < 1480 && p[1] > -40 && p[1] < 940) front++ }
    return 'doors ' + front + '/' + idx.length + ' on screen'
  })()`))
}
process.exit(0)
