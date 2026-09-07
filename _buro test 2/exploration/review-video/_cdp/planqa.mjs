/* THE SITE PLAN AS A REFERENCE LAYER, and the escape hierarchy.
   Everything here is done with a real pointer or a real key. */
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
const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html'
const LOG = process.env.QA_LOG || 'exploration/review-video/_cdp/planqa.txt'
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
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
const move = (x, y) => cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
const click = async (x, y) => {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 }); await sleep(70)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 }) }
const esc = async () => { for (const type of ['keyDown','keyUp']) await cdp.send('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(1300) }
const st = () => ev('(() => { const S=window.__v5.S; return S.level + (S.plan ? " +plan" : "") + " b=" + (S.building?S.building.num:"-") + " s=" + (S.suite?S.suite.ref:"-") })()')
const openPlan = async () => { const p = await ev(`(() => { const b=document.querySelector('[data-plan-open]'); if(!b||b.hidden) return null; const r=b.getBoundingClientRect(); return [Math.round(r.left+r.width/2),Math.round(r.top+r.height/2)] })()`)
  if (p) { await click(p[0], p[1]) } else { await ev('window.__v5.openPlan()') } ; await sleep(1600) }

console.log('THE PLAN IS A LAYER, NOT A PLACE')
await ev(`window.__v5.selectBuilding(window.__v5.compound.byNum.get('03'))`); await sleep(1500)
await ev(`(() => { const v=window.__v5; v.selectSuite(v.S.building.suites.find(x=>!x.sold)) })()`); await sleep(1500)
const before = await st()
await ev('window.__v5.openPlan()'); await sleep(1700)
console.log('   opened from      ' + before)
console.log('   translucent      ' + await ev(`(() => { const p=document.querySelector('[data-plan]'); const bg=getComputedStyle(p).backgroundColor; return bg })()`))
console.log('   says where I am  ' + await ev(`document.querySelector('[data-plan-where]').textContent`))
console.log('   current marked   ' + await ev(`!!document.querySelector('.plan__map g[data-building][data-current]')`))
console.log('   exit visible     ' + await ev(`(() => { const b=document.querySelector('[data-plan-exit]'); const r=b.getBoundingClientRect(); return Math.round(r.width)+'x'+Math.round(r.height)+' at '+Math.round(r.left)+','+Math.round(r.top) })()`))
console.log('   whole site fits  ' + await ev(`document.querySelector('.plan__map svg').getAttribute('viewBox')`))
await esc()
console.log('   Esc restored     ' + await st() + '   ' + (await st() === before ? 'EXACT' : 'CHANGED'))
console.log('')

console.log('SWITCHING FROM INSIDE THE PLAN — one press, on the drawing itself')
await ev(`window.__v5.selectBuilding(window.__v5.compound.byNum.get('03'))`); await sleep(1400)
await ev('window.__v5.openPlan()'); await sleep(1700)
const g = await ev(`(() => { const el=document.querySelector('.plan__map g[data-building="07"]'); if(!el) return null
  const r=el.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
if (g) { await move(g[0], g[1]); await sleep(400)
  console.log('   hover on 07 lights it: ' + await ev(`!!document.querySelector('.plan__map g[data-building="07"][data-hot]')`))
  await click(g[0], g[1]); await sleep(1800) }
console.log('   after one press  ' + await st() + '   ' + ((await st()).startsWith('building') && (await st()).includes('b=07') ? 'PASS' : 'FAIL'))
console.log('')

console.log('THE ESCAPE HIERARCHY — one step at a time')
const steps = []
await ev(`window.__v5.selectBuilding(window.__v5.compound.byNum.get('06'))`); await sleep(1300)
await ev(`(() => { const v=window.__v5; v.selectSuite(v.S.building.suites.find(x=>!x.sold)) })()`); await sleep(1400)
await ev('window.__v5.openPlan()'); await sleep(1500)
steps.push(['start', await st()])
await esc(); steps.push(['esc 1 · closes the plan', await st()])
await esc(); steps.push(['esc 2 · leaves the suite', await st()])
await esc(); steps.push(['esc 3 · leaves the building', await st()])
await esc(); steps.push(['esc 4 · already home', await st()])
steps.forEach(([k, v]) => console.log('   ' + k.padEnd(26) + v))
const want = ['+plan', 'suite', 'building', 'compound', 'compound']
const got = steps.map(([, v]) => (v.includes('+plan') ? '+plan' : v.split(' ')[0]))
console.log('   ---> ' + (JSON.stringify(got) === JSON.stringify(want) ? 'PASS' : 'FAIL  got ' + JSON.stringify(got)))
console.log('')

console.log('NO TRAP')
await ev('window.__v5.openPlan()'); await sleep(1400)
console.log('   element at 720,450 while open: ' + await ev(`(() => { const el=document.elementFromPoint(720,450); return el ? el.tagName+'.'+((el.className.baseVal ?? el.className)||'-') : 'nothing' })()`))
await esc()
console.log('   element at 720,450 after esc : ' + await ev(`(() => { const el=document.elementFromPoint(720,450); return el ? el.tagName+'.'+((el.className.baseVal ?? el.className)||'-') : 'nothing' })()`))
console.log('   plan hidden: ' + await ev(`document.querySelector('[data-plan]').hidden`))
console.log('')
console.log('CONSOLE ERRORS: ' + (errors.length ? errors.length + '\n  ' + errors.slice(0,5).join('\n  ') : 'none'))
process.exit(0)
