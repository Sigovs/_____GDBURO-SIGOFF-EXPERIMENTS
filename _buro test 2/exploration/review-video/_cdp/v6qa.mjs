/* THE V6 CRITICAL TEST.
   compound -> building -> suite -> ENTER, using ONLY the model: no site plan, no
   navigator, no rail, no legend. Every step is a dispatched pointer event at a screen
   coordinate, and the suite is chosen by pointing at a REAL GARAGE DOOR. */
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

const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v6-architecture-ui.html'
const LOG = process.env.QA_LOG || 'exploration/review-video/_cdp/v6qa.txt'
fs.writeFileSync(LOG, '')
const emit = console.log
console.log = (...a) => { const s = a.join(' '); emit(s); fs.appendFileSync(LOG, s + '\n') }

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
const errors = []
cdp.on('Runtime.exceptionThrown', (p) => errors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text))
cdp.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') errors.push(p.args.map((a) => a.value ?? a.description).join(' ')) })
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)

const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
const move = (x, y) => cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
const click = async (x, y) => {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 })
  await sleep(70)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 })
}
const st = () => ev('(() => { const S = window.__v5.S; return { level: S.level, b: S.building ? S.building.num : null, s: S.suite ? S.suite.ref : null, hs: S.hoverSuite ? S.hoverSuite.ref : null, hov: S.hover ? S.hover.num : null } })()')
const text = (sel) => ev('(() => { const t = document.querySelector(' + JSON.stringify(sel) + '); return (!t || t.hidden) ? "(none)" : t.textContent.replace(/\\s+/g, " ").trim() })()')

if (await ev('!!document.getElementById("act-02")')) {
  await ev('document.getElementById("act-02").scrollIntoView()')
  await sleep(2200)
}

console.log('THE CRITICAL PATH — the model, and nothing else')

/* 1 · does a building teach that it is interactive? */
const proj = await ev(`(() => {
  const gl = window.__v5.gl, cam = gl.camera, V = cam.position.constructor, out = []
  const r = window.__v5.stage.getBoundingClientRect()
  gl.site.traverse((o) => {
    if (o.userData && o.userData.pick && o.userData.num === '03') {
      const p = o.getWorldPosition(new V()); p.project(cam)
      if (p.z <= 1) out.push([Math.round(r.left + (p.x * .5 + .5) * r.width), Math.round(r.top + (-p.y * .5 + .5) * r.height)])
    }
  })
  return out
})()`)
let pB = null
outer: for (const [cx, cy] of proj) {
  for (let rr = 0; rr <= 70; rr += 7) {
    for (let a = 0; a < (rr ? 12 : 1); a++) {
      const x = cx + Math.round(rr * Math.cos(a * Math.PI / 6)), y = cy + Math.round(rr * Math.sin(a * Math.PI / 6))
      if (x < 26 || x > 1414 || y < 90 || y > 700) continue
      await move(x, y)
      if ((await st()).hov === '03') { pB = [x, y]; break outer }
    }
  }
}
console.log('   building 03 answers the pointer   ' + (pB ? 'YES at ' + pB.join(',') : 'NO'))
console.log('   cursor says clickable             ' + await ev('document.querySelector("[data-stage]").dataset.hot'))
console.log('   named before any click            ' + await text('[data-tag-b]'))
if (!pB) { console.log('   CANNOT CONTINUE'); process.exit(1) }
await click(pB[0], pB[1]); await settle(ev)
console.log('   after the click                   ' + JSON.stringify(await st()))
console.log('   anything appeared at the bottom?  ' + await text('[data-prod]'))

/* 2 · is a REAL DOOR the suite control? */
const doors = await ev(`(() => {
  const gl = window.__v5.gl, v = window.__v5
  const r = v.stage.getBoundingClientRect(), out = []
  for (const s of v.S.building.suites) {
    const p = gl.doorPoint(s.index, r.width, r.height)
    if (p) out.push({ ref: s.ref, sold: s.sold, x: Math.round(r.left + p[0]), y: Math.round(r.top + p[1]) })
  }
  return out
})()`)
const total = await ev('window.__v5.S.building.suites.length')
console.log('   doors reachable on screen         ' + doors.length + ' of ' + total)
let hit = null, soldSeen = null
for (const d of doors.filter((x) => !x.sold)) {
  for (const dy of [0, 12, -12, 24, -24, 36]) {
    await move(d.x, d.y + dy)
    if ((await st()).hs === d.ref) { hit = { ...d, y: d.y + dy }; break }
  }
  if (hit) break
}
console.log('   a real door answers the pointer   ' + (hit ? hit.ref + ' at ' + hit.x + ',' + hit.y : 'NO'))
console.log('   the door names its own suite      ' + await text('[data-tag-d]'))
for (const d of doors.filter((x) => x.sold)) {
  for (const dy of [0, 12, -12, 24]) {
    await move(d.x, d.y + dy)
    if ((await st()).hs === d.ref) { soldSeen = await text('[data-tag-d]'); break }
  }
  if (soldSeen) break
}
console.log('   a sold door says so               ' + (soldSeen || '(none reachable)'))
if (!hit) { console.log('   CANNOT CONTINUE'); process.exit(1) }
await move(hit.x, hit.y); await sleep(200)
await click(hit.x, hit.y); await settle(ev)
console.log('   after clicking the door           ' + JSON.stringify(await st()))

/* 3 · is ENTER there, and is it the strongest thing on screen? */
const en = await ev(`(() => {
  const b = document.querySelector('[data-enter]'); if (!b) return null
  const r = b.getBoundingClientRect(), cs = getComputedStyle(b)
  return { w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, text: b.textContent.replace(/\\s+/g, ' ').trim() }
})()`)
console.log('   ENTER                             ' + JSON.stringify(en))
console.log('   the product panel says            ' + await text('[data-prod]'))
console.log('')

console.log('WHAT WAS NOT NEEDED TO GET HERE')
console.log('   site plan opened                  ' + await ev('window.__v5.S.plan'))
console.log('   a building navigator exists       ' + await ev('!!document.querySelector("[data-nav-b]")'))
console.log('   a legend exists                   ' + await ev('!!document.querySelector("[data-bay-head]")'))
console.log('')

/* 4 · the visible control count, per level */
const count = () => ev(`(() => {
  const host = window.__v5.host
  const vis = (el) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0'
  }
  const controls = [...host.querySelectorAll('button, a[href], [role="button"]')].filter(vis)
  const panels = [...host.querySelectorAll('[data-dock], [data-prod], [data-rail], [data-nav]')].filter(vis)
  return { controls: controls.length, panels: panels.length }
})()`)
await ev('window.__v5.overview()'); await settle(ev)
console.log('VISIBLE CONTROLS AND PANELS')
console.log('   compound   ' + JSON.stringify(await count()))
await ev('window.__v5.selectBuilding(window.__v5.compound.byNum.get("03"))'); await settle(ev)
console.log('   building   ' + JSON.stringify(await count()))
await ev('(() => { const v = window.__v5; v.selectSuite(v.S.building.suites.find((x) => !x.sold)) })()'); await settle(ev)
console.log('   suite      ' + JSON.stringify(await count()))
console.log('')
console.log('CONSOLE ERRORS: ' + (errors.length ? errors.length + '\n  ' + errors.slice(0, 5).join('\n  ') : 'none'))
process.exit(0)
