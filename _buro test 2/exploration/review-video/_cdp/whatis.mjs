/* WHAT IS THAT OBJECT, exactly. A raycast at a screen coordinate that reports the whole
   chain — name, geometry, material colour, world scale, world position — so an artifact
   can be identified rather than guessed at. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const [,, URL, SETUP, ...PTS] = process.argv
const health = await ensure(); const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
if (SETUP) { await ev(SETUP); await sleep(3000) }
for (const pt of PTS) {
  const [x, y] = pt.split(',').map(Number)
  console.log(pt + '  ' + await ev(`(async () => {
    const A = window.__v5.gl, T = window.__v5.THREE
    const r = window.__v5.stage.getBoundingClientRect()
    const rc = new T.Raycaster()
    rc.setFromCamera(new T.Vector2(((${x} - r.left) / r.width) * 2 - 1, -((${y} - r.top) / r.height) * 2 + 1), A.camera)
    const hits = rc.intersectObject(A.scene, true).filter(h => h.object.visible && h.object.material && h.object.material.colorWrite !== false)
    if (!hits.length) return 'nothing'
    const out = []
    for (const h of hits.slice(0, 3)) {
      const o = h.object
      const s = new T.Vector3(), p = new T.Vector3()
      o.getWorldScale(s); o.getWorldPosition(p)
      const chain = []
      let q = o; while (q) { chain.push(q.name || q.type); q = q.parent }
      out.push('dist ' + h.distance.toFixed(2)
        + '  ' + (o.name || '(unnamed)')
        + '  mat#' + (o.material.color ? o.material.color.getHexString() : '?')
        + '  worldScale ' + [s.x, s.y, s.z].map(v => v.toFixed(3)).join('/')
        + '  at ' + [p.x, p.y, p.z].map(v => v.toFixed(2)).join('/')
        + '  chain ' + chain.join(' < '))
    }
    return out.join(String.fromCharCode(10) + '        ')
  })()`))
}
process.exit(0)
