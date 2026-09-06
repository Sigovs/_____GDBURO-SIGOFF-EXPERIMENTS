/* Is the whole compound actually in the frame? Projects every corner of every pick
   proxy and every civic mass and reports the screen bounding box, plus which buildings
   fall outside the safe area. A building a visitor cannot see is a building a visitor
   cannot choose. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 60; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(5500)
const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
await ev('window.__v5.overview()'); await sleep(1800)
console.log(await ev(`(() => {
  const gl = window.__v5.gl, T = window.__v5.THREE, cam = gl.camera
  const W = innerWidth, H = innerHeight
  const box = new T.Box3(), v = new T.Vector3()
  const rep = []
  let X0 = 1e9, X1 = -1e9, Y0 = 1e9, Y1 = -1e9
  const shot = (o, label) => {
    box.setFromObject(o)
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9
    for (const sx of [box.min.x, box.max.x]) for (const sy of [box.min.y, box.max.y]) for (const sz of [box.min.z, box.max.z]) {
      v.set(sx, sy, sz).project(cam)
      const px = (v.x * .5 + .5) * W, py = (-v.y * .5 + .5) * H
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py)
    }
    X0 = Math.min(X0, x0); X1 = Math.max(X1, x1); Y0 = Math.min(Y0, y0); Y1 = Math.max(Y1, y1)
    const out = (x0 < 0 || x1 > W || y0 < 0 || y1 > H)
    rep.push('   ' + label.padEnd(16) + '  x ' + Math.round(x0) + '..' + Math.round(x1) + '   y ' + Math.round(y0) + '..' + Math.round(y1) + (out ? '   <-- OUT OF FRAME' : ''))
  }
  const done = new Set()
  gl.site.traverse(o => {
    if (o.userData && o.userData.pick && !done.has(o.userData.num)) {
      done.add(o.userData.num)
      const g = o.parent
      shot(g, 'building ' + o.userData.num)
    }
  })
  gl.site.traverse(o => { if (o.userData && o.userData.kind === 'civic') shot(o, 'civic ' + o.userData.of) })
  return 'STAGE ' + W + ' x ' + H + '   camera dist=' + gl.camera.position.length().toFixed(2) + '\\n'
    + rep.join('\\n')
    + '\\n   ---------------- whole compound   x ' + Math.round(X0) + '..' + Math.round(X1)
    + '   y ' + Math.round(Y0) + '..' + Math.round(Y1)
    + '\\n   margins: left ' + Math.round(X0) + '  right ' + Math.round(W - X1)
    + '  top ' + Math.round(Y0) + '  bottom ' + Math.round(H - Y1)
})()`))
process.exit(0)
