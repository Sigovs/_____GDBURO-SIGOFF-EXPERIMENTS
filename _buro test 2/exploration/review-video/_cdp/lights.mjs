/* WHICH LIGHT IS DOING THAT. An inventory of every light actually in the scene at a given
   state, with its world distance from the camera — so a wash on the terrain can be traced
   to the lamp that makes it instead of being attributed to the nearest suspect. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const health = await ensure(); const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: process.argv[2] })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
if (process.argv[3]) { await ev(process.argv[3]); await sleep(2600) }
console.log(await ev(`(() => {
  const A = window.__v5.gl || window.__v5.api; const sc = A.scene, cam = A.camera
  const out = []
  sc.traverse((o) => { if (!o.isLight) return
    const p = o.getWorldPosition(o.position.clone())
    out.push([o.type.padEnd(16), ('#' + o.color.getHexString()).padEnd(8),
      'i=' + o.intensity.toFixed(2), 'range=' + (o.distance || 0).toFixed(2),
      'fromCam=' + p.distanceTo(cam.position).toFixed(2)].join('  ')) })
  return out.join(String.fromCharCode(10))
})()`))
process.exit(0)
