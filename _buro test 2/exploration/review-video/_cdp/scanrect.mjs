/* EVERYTHING VISIBLE INSIDE A RECTANGLE OF THE FRAME. Raycasts a grid and reports the
   distinct FRONT-MOST objects found, with their world scale and material — the way to
   name an artifact instead of describing it. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const [,, URL, SETUP, X, Y, W, H] = process.argv
const health = await ensure(); const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
if (SETUP) { await ev(SETUP); await sleep(3200) }
console.log(await ev(`(() => {
  const A = window.__v5.gl, T = window.__v5.THREE
  const r = window.__v5.stage.getBoundingClientRect()
  const rc = new T.Raycaster()
  const seen = new Map()
  for (let y = ${Y}; y < ${Y} + ${H}; y += 2) for (let x = ${X}; x < ${X} + ${W}; x += 2) {
    rc.setFromCamera(new T.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), A.camera)
    const hits = rc.intersectObject(A.scene, true).filter(h => h.object.visible && h.object.material && h.object.material.colorWrite !== false)
    if (!hits.length) continue
    const o = hits[0].object
    const s = new T.Vector3(), p = new T.Vector3()
    o.getWorldScale(s); o.getWorldPosition(p)
    const chain = []; let q = o.parent; while (q) { chain.push(q.name || q.type); q = q.parent }
    const key = (o.name || o.uuid.slice(0, 8)) + '|' + [s.x, s.y, s.z].map(v => v.toFixed(3)).join('/')
    if (!seen.has(key)) seen.set(key, { n: 0, line: (o.name || '(unnamed ' + o.uuid.slice(0, 6) + ')').padEnd(22)
      + ' mat#' + (o.material.color ? o.material.color.getHexString() : '?')
      + ' scale ' + [s.x, s.y, s.z].map(v => v.toFixed(3)).join('/')
      + ' at ' + [p.x, p.y, p.z].map(v => v.toFixed(2)).join('/')
      + ' in ' + chain.slice(0, 3).join('<') })
    seen.get(key).n++
  }
  return [...seen.values()].sort((a, b) => b.n - a.n).map(v => String(v.n).padStart(5) + ' px  ' + v.line).join(String.fromCharCode(10))
})()`))
process.exit(0)
