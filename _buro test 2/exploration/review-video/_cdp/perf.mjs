/* FRAME COST, MEASURED. Renders for a few seconds at a given state and reports the frame
   time the page actually achieved, plus what the renderer says it is drawing. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const health = await ensure(); const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: process.argv[2] })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(9000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
for (const [name, setup] of [['compound', 'window.__v5.overview()'], ['building 03', `window.__v5.selectBuilding(window.__v5.compound.byNum.get('03'))`]]) {
  await ev(setup); await sleep(2600)
  const r = await ev(`(async () => {
    const A = window.__v5.gl
    const t = []
    await new Promise((res) => { let last = performance.now(), n = 0
      const step = () => { const now = performance.now(); t.push(now - last); last = now
        if (++n < 150) requestAnimationFrame(step); else res() }
      requestAnimationFrame(step) })
    t.sort((a, b) => a - b)
    const med = t[Math.floor(t.length / 2)], p95 = t[Math.floor(t.length * 0.95)]
    let tris = 0, meshes = 0
    A.scene.traverse((o) => { if (!o.isMesh) return; meshes++
      const g = o.geometry
      tris += ((g.index ? g.index.count : g.attributes.position.count) / 3) * (o.isInstancedMesh ? o.count : 1) })
    return JSON.stringify({ medianMs: +med.toFixed(2), fps: Math.round(1000 / med), p95Ms: +p95.toFixed(2),
      drawCalls: A.renderer.info.render.calls, triangles: Math.round(tris), meshes,
      geometries: A.renderer.info.memory.geometries, textures: A.renderer.info.memory.textures })
  })()`)
  console.log('  ' + name.padEnd(12) + r)
}
process.exit(0)
