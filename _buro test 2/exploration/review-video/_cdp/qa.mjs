/* ==================================================================================
   THE BUILDING QA MATRIX, driven by REAL pointer events into the canvas.

   Nothing here calls the state machine to prove the state machine. Every hover is a
   dispatched mouseMoved and every selection is a dispatched press/release at a screen
   coordinate, so a pass means a visitor with a mouse can do it.

   Three phases:
     1. a coarse raster of the compound camera, to find one live point per building
     2. every building in order: hover, click, verify, return to overview
     3. a randomised run of 30 selections in arbitrary order, which is the test the
        ordered matrix cannot do — it is where stale targets and creeping cameras show
   ================================================================================== */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
import fs from 'node:fs'
const LOGFILE = process.env.QA_LOG || 'exploration/review-video/_cdp/qa.txt'
fs.writeFileSync(LOGFILE, '')
const emit = console.log
console.log = (...a) => { const s = a.join(' '); emit(s); fs.appendFileSync(LOGFILE, s + '\n') }

const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html'
const RANDOM_N = Number(process.argv[3] || 30)

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })

const errors = []
cdp.on('Runtime.exceptionThrown', (p) => errors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text))
cdp.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') errors.push(p.args.map((a) => a.value ?? a.description).join(' ')) })

await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) {
  await sleep(500)
  const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true })
  if (r.result?.value) break
}
await sleep(6500)

const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
const move = (x, y) => cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
const click = async (x, y) => {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 })
  await sleep(70)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 })
}
const hoverNum = () => ev('window.__v5.S.hover ? window.__v5.S.hover.num : null')
const state = () => ev('(() => { const S = window.__v5.S; return { level: S.level, b: S.building ? S.building.num : null, s: S.suite ? S.suite.ref : null } })()')
const home = async () => { await ev('window.__v5.overview()'); await sleep(1500) }

/* ---- 1. what exists ---------------------------------------------------------------- */
const declared = await ev('window.__v5.compound.data.totals.buildings')
const built = await ev('window.__v5.compound.buildings.map(b => b.num)')
const counts = await ev('window.__v5.compound.buildings.map(b => b.num + ":" + b.suites.length + "(" + b.typeA + "A/" + b.typeB + "B)").join("  ")')
const totalSuites = await ev('window.__v5.compound.suites.length')
const totalA = await ev('window.__v5.compound.suites.filter(s => s.type === "A").length')
const totalSold = await ev('window.__v5.compound.suites.filter(s => s.sold).length')
console.log('DATA')
console.log('  declared buildings   ' + declared)
console.log('  built buildings      ' + built.join(' ') + '   (' + built.length + ')')
console.log('  missing              ' + (['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'].filter((n) => !built.includes(n)).join(', ') || 'NONE'))
console.log('  suites               ' + totalSuites + '   typeA ' + totalA + '   typeB ' + (totalSuites - totalA) + '   sold ' + totalSold)
console.log('  per building         ' + counts)
console.log('')

/* ---- 2. find one live point per building --------------------------------------------
   Each building's pick proxies are projected to screen space, and the projected point is
   then CONFIRMED with a real pointer move. If the centre of a run happens to sit behind
   something, a short outward spiral finds the nearest point that does answer. A building
   only counts as found when a dispatched mouseMoved actually reports it. */
await home()
await move(720, 430); await sleep(300)
const proj = await ev(`(() => {
  const gl = window.__v5.gl, cam = gl.camera
  const V = cam.position.constructor
  const out = {}
  gl.site.traverse(o => {
    if (!o.userData || !o.userData.pick) return
    const p = o.getWorldPosition(new V()); p.project(cam)
    const sx = (p.x * .5 + .5) * innerWidth, sy = (-p.y * .5 + .5) * innerHeight
    ;(out[o.userData.num] = out[o.userData.num] || []).push([Math.round(sx), Math.round(sy)])
  })
  return out
})()`)
const spots = new Map()
const SPIRAL = []
for (let r = 0; r <= 90; r += 9) {
  if (r === 0) { SPIRAL.push([0, 0]); continue }
  for (let a = 0; a < 12; a++) SPIRAL.push([Math.round(r * Math.cos(a * Math.PI / 6)), Math.round(r * Math.sin(a * Math.PI / 6))])
}
for (const n of built) {
  for (const [cx, cy] of proj[n] || []) {
    for (const [dx, dy] of SPIRAL) {
      const x = cx + dx, y = cy + dy
      if (x < 24 || x > 1416 || y < 90 || y > 720) continue
      await move(x, y)
      if (await hoverNum() === n) { spots.set(n, [x, y]); break }
    }
    if (spots.has(n)) break
  }
}
console.log('LIVE POINTS — projected from each building own pick proxy, then confirmed with a real pointer')
for (const n of built) console.log('  ' + n + '  ' + (spots.has(n) ? 'at ' + spots.get(n).join(',') : 'NO POINT ANSWERED'))
console.log('')

/* ---- 3. ordered matrix -------------------------------------------------------------- */
console.log('MATRIX 01-11 — hover, click, verify, overview')
let hoverPass = 0, clickPass = 0
const rows = []
for (const n of built) {
  const p = spots.get(n)
  if (!p) { rows.push([n, 'FAIL no point', 'SKIP']); continue }
  await move(p[0] - 40, p[1] - 40); await sleep(60)
  await move(p[0], p[1]); await sleep(260)
  const h = await hoverNum()
  await click(p[0], p[1]); await sleep(1400)
  const st = await state()
  const hOK = h === n, cOK = st.level === 'building' && st.b === n
  if (hOK) hoverPass++
  if (cOK) clickPass++
  rows.push([n, hOK ? 'PASS' : 'FAIL (' + h + ')', cOK ? 'PASS' : 'FAIL (' + st.level + '/' + st.b + ')'])
  await home()
}
for (const r of rows) console.log('  ' + r[0] + '   hover ' + r[1].padEnd(16) + 'click ' + r[2])
console.log('  ---> hover ' + hoverPass + '/' + built.length + '   click ' + clickPass + '/' + built.length)
console.log('')

/* ---- 4. adjacent transfer ----------------------------------------------------------- */
console.log('HOVER TRANSFER — straight from one building to another, no rest in between')
const live = built.filter((n) => spots.has(n))
let tOK = 0, tN = 0
for (let i = 0; i < live.length; i++) {
  const a = spots.get(live[i]), b = spots.get(live[(i + 1) % live.length])
  await move(a[0], a[1]); await sleep(200)
  const h1 = await hoverNum()
  await move(b[0], b[1]); await sleep(200)
  const h2 = await hoverNum()
  tN++
  const ok = h1 === live[i] && h2 === live[(i + 1) % live.length]
  if (ok) tOK++
  else console.log('  STALE  ' + live[i] + ' -> ' + live[(i + 1) % live.length] + '   got ' + h1 + ' -> ' + h2)
}
console.log('  ---> ' + tOK + '/' + tN + ' clean transfers')
console.log('')

/* ---- 5. the randomised run ----------------------------------------------------------- */
console.log('RANDOM RUN — ' + RANDOM_N + ' selections in arbitrary order')
await home()
let rOK = 0
const misses = []
for (let i = 0; i < RANDOM_N; i++) {
  const n = live[Math.floor(Math.random() * live.length)]
  const p = spots.get(n)
  await move(p[0] + (Math.random() * 20 - 10), p[1] + (Math.random() * 12 - 6)); await sleep(120)
  await move(p[0], p[1]); await sleep(220)
  await click(p[0], p[1]); await sleep(1100)
  const st = await state()
  if (st.level === 'building' && st.b === n) rOK++
  else misses.push(n + '->' + st.b + '@' + st.level)
  await home()
}
console.log('  ---> ' + rOK + '/' + RANDOM_N + ' correct' + (misses.length ? '   misses: ' + misses.join('  ') : ''))
console.log('')

/* ---- 6. THE SUITE RAIL ----------------------------------------------------------------
   The bay you POINT AT must be the bay you GET. This is not a formality: the dock's
   columns used to be auto-sized, so writing the hovered suite's number into the left cell
   grew that column and slid the whole row sideways under the pointer between the hover
   and the press. Every bay in a building is now hovered and pressed in turn and the two
   are compared. Sold bays are pressed too, and are required NOT to select. */
console.log('SUITE RAIL — hover a bay, press it, and check you got the one you pointed at')
await home()
const testB = await ev(`(() => { const b = window.__v5.compound.buildings.find(b =>
  b.suites.some(s=>s.type==='A'&&!s.sold) && b.suites.some(s=>s.type==='B'&&!s.sold) && b.suites.some(s=>s.sold))
  return (b || window.__v5.compound.buildings[0]).num })()`)
await ev(`window.__v5.selectBuilding(window.__v5.compound.byNum.get('${testB}'))`)
await sleep(1800)
const bayCount = await ev(`document.querySelectorAll('[data-bays] [data-bay]').length`)
let sOK = 0, sN = 0, soldOK = 0, soldN = 0
const sFail = []
for (let i = 0; i < bayCount; i++) {
  const info = await ev(`(() => { const b = document.querySelectorAll('[data-bays] [data-bay]')[${i}]
    const r = b.getBoundingClientRect()
    return { sold: b.dataset.sold === 'true', type: b.dataset.type, ref: b._s.ref,
      x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width) } })()`)
  await move(700, 300); await sleep(60)
  await move(info.x, info.y); await sleep(230)
  const hov = await ev('window.__v5.S.hoverSuite ? window.__v5.S.hoverSuite.ref : null')
  await click(info.x, info.y); await sleep(700)
  const sel = await ev('window.__v5.S.suite ? window.__v5.S.suite.ref : null')
  if (info.sold) {
    soldN++
    if (sel !== info.ref) soldOK++
    else sFail.push(info.ref + ' SOLD BUT SELECTABLE')
  } else {
    sN++
    if (hov === info.ref && sel === info.ref) sOK++
    else sFail.push(info.ref + ' pointed(' + hov + ') got(' + sel + ')')
    await ev(`window.__v5.backToBuilding()`); await sleep(700)
  }
}
console.log('  building ' + testB + ', ' + bayCount + ' bays')
console.log('  ---> available: ' + sOK + '/' + sN + ' selected the bay pointed at')
console.log('  ---> sold:      ' + soldOK + '/' + soldN + ' correctly refused selection')
if (sFail.length) sFail.forEach((f) => console.log('       ' + f))

/* premium vs standard, measured in the control itself */
const widths = await ev(`(() => {
  const bs = [...document.querySelectorAll('[data-bays] [data-bay]')]
  const a = bs.filter(b => b.dataset.type === 'A').map(b => b.getBoundingClientRect().width)
  const b2 = bs.filter(b => b.dataset.type === 'B').map(b => b.getBoundingClientRect().width)
  const avg = (x) => x.reduce((p, c) => p + c, 0) / (x.length || 1)
  return { A: +avg(a).toFixed(1), B: +avg(b2).toFixed(1), ratio: +(avg(a) / avg(b2)).toFixed(3) } })()`)
console.log('  mini-bay widths: premium ' + widths.A + 'px, standard ' + widths.B + 'px, ratio ' + widths.ratio + '  (the built ratio is 30/23 = 1.304)')
console.log('')
console.log('CONSOLE ERRORS: ' + (errors.length ? errors.length + '\n  ' + errors.slice(0, 8).join('\n  ') : 'none'))
process.exit(0)
