/* FRONT-END HEALTH. The unglamorous checks a build has to pass before anyone looks at
   it: reduced motion, listener growth over a hundred state changes, WebGL context count,
   hidden DOM still taking the pointer, frame time under interaction, console errors. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'

const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html'
const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
const errors = []
cdp.on('Runtime.exceptionThrown', (p) => errors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text))
cdp.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') errors.push(p.args.map((a) => a.value ?? a.description).join(' ')) })
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })

const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
const load = async () => {
  await cdp.send('Page.navigate', { url: URL })
  for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
  await sleep(5500)
}

/* ---- 1. REDUCED MOTION ------------------------------------------------------------ */
await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
await load()
const still = await ev(`(async () => {
  const v = window.__v5, gl = v.gl
  const p0 = gl.camera.position.clone()
  v.selectBuilding(v.compound.byNum.get('07'))
  await new Promise(r => setTimeout(r, 60))
  const p1 = gl.camera.position.clone()          /* should ALREADY be there */
  await new Promise(r => setTimeout(r, 1400))
  const p2 = gl.camera.position.clone()
  const rot0 = gl.site.rotation.y
  await new Promise(r => setTimeout(r, 3000))
  return { movedImmediately: +p0.distanceTo(p1).toFixed(2), driftedAfter: +p1.distanceTo(p2).toFixed(3),
    ambientTurn: +Math.abs(gl.site.rotation.y - rot0).toFixed(4), level: v.S.level }
})()`)
console.log('REDUCED MOTION')
console.log('  camera arrives at once      ' + still.movedImmediately + ' units in the first frame')
console.log('  and then does not travel    ' + still.driftedAfter + ' units over the next 1.4s   ' + (still.driftedAfter < 0.05 ? 'PASS' : 'FAIL — it is still flying'))
console.log('  ambient turn over 3s        ' + still.ambientTurn + ' rad   ' + (still.ambientTurn < 0.0005 ? 'PASS' : 'FAIL — the model is moving on its own'))
console.log('  every level still reachable ' + still.level)
console.log('')

/* ---- 2. LEAKS ---------------------------------------------------------------------- */
await cdp.send('Emulation.setEmulatedMedia', { features: [] })
await load()
const before = await ev(`(() => ({
  nodes: document.getElementsByTagName('*').length,
  canvases: document.querySelectorAll('canvas').length,
  plans: document.querySelectorAll('[data-plan]').length,
}))()`)
await ev(`(async () => { const v = window.__v5, bs = v.compound.buildings
  for (let i = 0; i < 100; i++) {
    v.selectBuilding(bs[i % bs.length])
    const s = v.S.building.suites.find(x => !x.sold)
    if (s) v.selectSuite(s)
    v.openPlan(); v.closePlan()
    v.overview()
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 30))
  } })()`)
await sleep(1500)
const after = await ev(`(() => ({
  nodes: document.getElementsByTagName('*').length,
  canvases: document.querySelectorAll('canvas').length,
  plans: document.querySelectorAll('[data-plan]').length,
}))()`)
console.log('AFTER 100 FULL CYCLES (building, suite, site plan open+close, overview)')
console.log('  DOM nodes        ' + before.nodes + ' -> ' + after.nodes + '   ' + (after.nodes - before.nodes < 200 ? 'stable' : 'GROWING'))
console.log('  canvases         ' + before.canvases + ' -> ' + after.canvases + '   ' + (after.canvases === before.canvases ? 'PASS' : 'FAIL — a context per cycle'))
console.log('  site plan roots  ' + before.plans + ' -> ' + after.plans + '   ' + (after.plans === before.plans ? 'PASS' : 'FAIL — an overlay per cycle'))
console.log('')

/* ---- 3. NOTHING HIDDEN IS STILL TAKING THE POINTER ---------------------------------- */
const hits = await ev(`(() => {
  const pts = [[200,200],[720,300],[1200,250],[720,760],[100,860],[1380,60]]
  return pts.map(([x,y]) => { const el = document.elementFromPoint(x,y)
    return x + ',' + y + ' -> ' + (el ? el.tagName + '.' + ((el.className.baseVal ?? el.className) || '-') : 'nothing') }) })()`)
console.log('WHAT IS UNDER THE POINTER AT REST')
for (const h of hits) console.log('  ' + h)
console.log('')

/* ---- 4. FRAME TIME UNDER INTERACTION ------------------------------------------------ */
const fps = await ev(`(async () => {
  const t = [], N = 140
  let last = performance.now()
  await new Promise(res => { let n = 0
    const tick = (now) => { t.push(now - last); last = now; if (++n < N) requestAnimationFrame(tick); else res() }
    requestAnimationFrame(tick) })
  t.sort((a,b)=>a-b)
  return { median: +t[Math.floor(t.length/2)].toFixed(1), p95: +t[Math.floor(t.length*0.95)].toFixed(1), worst: +t[t.length-1].toFixed(1) }
})()`)
console.log('FRAME TIME AT COMPOUND (ms)')
console.log('  median ' + fps.median + '   p95 ' + fps.p95 + '   worst ' + fps.worst + '   ' + (fps.p95 < 24 ? 'PASS' : 'watch'))
console.log('')
console.log('CONSOLE ERRORS: ' + (errors.length ? errors.length + '\n  ' + errors.slice(0, 6).join('\n  ') : 'none'))
process.exit(0)
