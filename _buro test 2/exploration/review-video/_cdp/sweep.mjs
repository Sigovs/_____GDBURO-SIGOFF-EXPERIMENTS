/* Which way should the rest frame look? Sweep the azimuth, refit each one, and capture
   it. Judged by looking, not by argument. Also reports how much of the frame the DOOR
   faces occupy, because the doors are the product and a hero frame that shows the back
   of every building is selling the wrong elevation. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
import fs from 'node:fs'

const DIR = 'exploration/audit/sweep'
fs.mkdirSync(DIR, { recursive: true })
for (const f of fs.readdirSync(DIR)) fs.unlinkSync(DIR + '/' + f)

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 60; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(5500)
const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
await ev("document.getElementById('dock').style.display='none'")

/* how much of the door frontage is turned toward the camera, as a share of all frontage */
const facing = `(() => {
  const gl = window.__v5.gl, T = window.__v5.THREE, cam = gl.camera
  const dir = new T.Vector3(), n = new T.Vector3(), p = new T.Vector3()
  let toward = 0, away = 0
  for (const s of window.__v5.compound.suites) {
    n.set(s.faceNormal[0], 0, s.faceNormal[1]).normalize()
    n.applyQuaternion(gl.site.quaternion)
    p.set(s.cx, 13, s.cy); gl.site.localToWorld(p)
    dir.copy(cam.position).sub(p).normalize()
    const d = n.dot(dir)
    if (d > 0.12) toward += 1; else away += 1
  }
  return Math.round((toward / (toward + away)) * 100)
})()`

const AZ = [-2.30, -1.75, -1.20, -0.58, 0.10, 0.75, 1.40, 2.10]
for (const az of AZ) {
  await ev(`(() => { const gl = window.__v5.gl; gl.setRestAzimuth(${az}); })()`)
  await sleep(1700)
  const pct = await ev(facing)
  const dist = await ev('window.__v5.gl.camera.position.length().toFixed(2)')
  const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 84 })
  const name = DIR + '/az' + String(az.toFixed(2)).replace('-', 'm').replace('.', '_') + '-doors' + pct + '.jpeg'
  fs.writeFileSync(name, Buffer.from(r.data, 'base64'))
  console.log('  az ' + az.toFixed(2).padStart(6) + '   doors toward camera ' + String(pct).padStart(3) + '%   dist ' + dist + '   ' + name)
}
process.exit(0)
