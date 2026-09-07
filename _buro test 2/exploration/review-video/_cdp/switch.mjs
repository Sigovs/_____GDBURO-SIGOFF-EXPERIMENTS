/* DIRECT SWITCHING, with a real pointer and no Overview in between.
   A building is selected, then every OTHER building is pointed at and pressed from
   inside that state. A pass means the visitor never had to go home. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
import fs from 'node:fs'
const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html'
const RANDOM_N = Number(process.argv[3] || 30)
const LOG = process.env.QA_LOG || 'exploration/review-video/_cdp/switch.txt'
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

/* Inside the real page act 02 has to be ON SCREEN before any of its controls have a
   position worth pointing at. Without this the test clicks empty page and reports the
   product broken — the failure is the test's. */
const showAct02 = async () => {
  const has = await (async () => { const r = await cdp.send('Runtime.evaluate', { expression: "!!document.getElementById('act-02')", returnByValue: true }); return r.result?.value })()
  if (!has) return
  await cdp.send('Runtime.evaluate', { expression: "document.getElementById('act-02').scrollIntoView()" })
  await sleep(2200)
}
await showAct02()
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
const state = () => ev('(() => { const S = window.__v5.S; return { level: S.level, b: S.building ? S.building.num : null, s: S.suite ? S.suite.ref : null, prev: S.preview ? S.preview.num : null } })()')
const nums = await ev('window.__v5.compound.buildings.map(b => b.num)')

/* a live point on a building FROM WHEREVER THE CAMERA IS NOW */
const pointOn = async (num) => {
  const proj = await ev(`(() => { const gl=window.__v5.gl, cam=gl.camera, V=cam.position.constructor, out=[]
    const r = window.__v5.stage.getBoundingClientRect()
    gl.site.traverse(o => { if(o.userData && o.userData.pick && o.userData.num === ${JSON.stringify(num)}) {
      const p=o.getWorldPosition(new V()); p.project(cam)
      if (p.z <= 1) out.push([Math.round(r.left+(p.x*.5+.5)*r.width), Math.round(r.top+(-p.y*.5+.5)*r.height)]) } })
    return out })()`)
  for (const [cx, cy] of proj) {
    for (let rr = 0; rr <= 70; rr += 7) {
      for (let a = 0; a < (rr ? 12 : 1); a++) {
        const x = cx + Math.round(rr * Math.cos(a * Math.PI / 6)), y = cy + Math.round(rr * Math.sin(a * Math.PI / 6))
        if (x < 24 || x > 1416 || y < 92 || y > 690) continue
        await move(x, y)
        const st = await state()
        if (st.prev === num) return [x, y]
      }
    }
  }
  return null
}
/* THE DECLARED FALLBACK, whichever one this build has. V5.3 offers a numbered strip;
   V6 removed it and offers two chevrons that step to the neighbour along the drive.
   Both are real controls and both are driven here by a real pointer — the point of
   the test is that a building can always be reached without going home. */
const navClick = async (num) => {
  const p = await ev(`(() => { const b=document.querySelector('[data-nav-b="${num}"]'); if(!b) return null
    const r=b.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
  if (p) { await move(p[0], p[1]); await sleep(160); await click(p[0], p[1]); await sleep(1100); return true }
  /* no strip: walk with the chevrons, the short way round */
  const list = nums
  for (let guard = 0; guard < list.length; guard++) {
    const cur = (await state()).b
    if (cur === num) return true
    const i = list.indexOf(cur), j = list.indexOf(num)
    if (i < 0 || j < 0) return false
    const fwd = (j - i + list.length) % list.length
    const dir = fwd <= list.length - fwd ? 1 : -1
    const sel = dir === 1 ? '[data-step="1"]' : '[data-step="-1"]'
    const q = await ev(`(() => { const b=document.querySelector(${JSON.stringify(sel)}); if(!b||b.hidden) return null
      const r=b.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
    if (!q) return false
    await move(q[0], q[1]); await sleep(120); await click(q[0], q[1]); await sleep(1000)
  }
  return (await state()).b === num
}

await ev('window.__v5.overview()'); await sleep(1700)
await ev(`window.__v5.selectBuilding(window.__v5.compound.byNum.get('${nums[0]}'))`); await sleep(1600)

console.log('ADJACENT SWITCHING — no Overview between, ever')
let ok = 0, tot = 0, viaModel = 0, viaNav = 0
const seq = [...nums, ...[...nums].reverse().slice(1)]
for (let i = 0; i + 1 < seq.length; i++) {
  const from = seq[i], to = seq[i + 1]
  const cur = await state()
  if (cur.b !== from) { await navClick(from); await sleep(400) }
  const p = await pointOn(to)
  let how = 'model'
  if (p) { await click(p[0], p[1]); await sleep(1200) }
  else { how = 'navigator'; await navClick(to) }
  const st = await state()
  tot++
  const good = st.level === 'building' && st.b === to && st.s === null
  if (good) { ok++; how === 'model' ? viaModel++ : viaNav++ }
  console.log('   ' + from + ' -> ' + to + '   ' + (good ? 'PASS' : 'FAIL (' + st.level + '/' + st.b + ')') + '   via ' + how)
}
console.log('   ---> ' + ok + '/' + tot + '   (' + viaModel + ' by clicking the model, ' + viaNav + ' by the navigator)')
console.log('')

console.log('RANDOM DIRECT SWITCHING — ' + RANDOM_N + ', never going home')
let rok = 0
const miss = []
for (let i = 0; i < RANDOM_N; i++) {
  const to = nums[Math.floor(Math.random() * nums.length)]
  const cur = await state()
  if (cur.b === to) { i--; continue }
  const p = await pointOn(to)
  if (p) { await click(p[0], p[1]); await sleep(1100) } else { await navClick(to) }
  const st = await state()
  if (st.level === 'building' && st.b === to && st.s === null) rok++
  else miss.push(cur.b + '->' + to + ' got ' + st.b)
}
console.log('   ---> ' + rok + '/' + RANDOM_N + (miss.length ? '   misses: ' + miss.slice(0, 6).join('  ') : ''))
console.log('')
console.log('STALE STATE AFTER A SWITCH WITH A SUITE CHOSEN')
await navClick(nums[2]); await sleep(600)
await ev(`(() => { const v=window.__v5; const s=v.S.building.suites.find(x=>!x.sold); v.selectSuite(s) })()`); await sleep(1400)
const before = await state()
await navClick(nums[5]); await sleep(900)
const after = await state()
const bays = await ev(`(() => { const bs=[...document.querySelectorAll('[data-bays] [data-bay]')]; return bs.length ? bs[0]._s.building : null })()`)
console.log('   before ' + JSON.stringify(before))
console.log('   after  ' + JSON.stringify(after))
console.log('   mini bays now belong to building ' + bays + '   ' + (bays === after.b ? 'PASS' : 'STALE'))
console.log('   ENTER present after switch: ' + (await ev('!!document.querySelector("[data-enter]")')) + '   (must be false)')
console.log('')
console.log('CONSOLE ERRORS: ' + (errors.length ? errors.length + '\n  ' + errors.slice(0, 5).join('\n  ') : 'none'))
process.exit(0)
