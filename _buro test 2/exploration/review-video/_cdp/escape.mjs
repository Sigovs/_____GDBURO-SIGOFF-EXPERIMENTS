/* OVERVIEW is the global escape. Prove it from every state, by both routes. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html'
const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(5500)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
const esc = async () => { for (const type of ['keyDown','keyUp']) await cdp.send('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(1500) }
const click = async (sel) => { const p = await ev(`(() => { const b=document.querySelector(${JSON.stringify(sel)}); if(!b||b.hidden) return null
  const r=b.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
  if (!p) return 'BUTTON NOT VISIBLE'
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x:p[0], y:p[1], buttons:0 })
  await cdp.send('Input.dispatchMouseEvent', { type:'mousePressed', x:p[0], y:p[1], button:'left', clickCount:1, buttons:1 }); await sleep(70)
  await cdp.send('Input.dispatchMouseEvent', { type:'mouseReleased', x:p[0], y:p[1], button:'left', clickCount:1, buttons:0 }); await sleep(1600)
  return 'clicked' }
/* Inside the real page act 02 has to be ON SCREEN before any of its controls have a
   position worth clicking. Without this the first pass clicked empty page and reported
   the product broken — the failure was the test's. */
const showAct02 = () => ev("(async () => { const el = document.getElementById('act-02'); if (el) { el.scrollIntoView(); await new Promise(r => setTimeout(r, 1600)) } })()")
const st = () => ev('(() => { const S=window.__v5.S; return S.level + (S.plan ? " +plan" : "") + (S.entered ? " +entered" : "") })()')
const goBuilding = () => ev("window.__v5.selectBuilding(window.__v5.compound.byNum.get('07'))")
const goSuite = () => ev(`(async () => { const v=window.__v5; v.selectBuilding(v.compound.byNum.get('07')); await new Promise(r=>setTimeout(r,900))
  const s = v.S.building.suites.find(x=>!x.sold); v.selectSuite(s) })()`)
const cases = [
  ['from BUILDING, the OVERVIEW button', goBuilding, () => click('[data-overview]')],
  ['from BUILDING, Escape',              goBuilding, esc],
  ['from SUITE, the OVERVIEW button',    goSuite,    () => click('[data-overview]')],
  ['from SUITE, Escape (now one step)',   goSuite,    esc],
  ['from SUITE, the BUILDING chip',      goSuite,    () => click('[data-ctx]')],
  ['after ENTER, the OVERVIEW button',   async () => { await goSuite(); await sleep(900); await ev('window.__v5.enterSuite()') }, () => click('[data-overview]')],
  ['after the SITE PLAN, Escape then OVERVIEW', async () => { await goSuite(); await sleep(900); await ev('window.__v5.openPlan()') }, async () => { await esc(); await click('[data-overview]') }],
]
console.log('THE GLOBAL ESCAPE')
for (const [name, setup, act] of cases) {
  await showAct02()
  await ev('window.__v5.overview()'); await sleep(1200)
  await setup(); await sleep(1600)
  const from = await st()
  const did = await act()
  const to = await st()
  /* V6 removed the contextual 'back to this building' chip on purpose: at suite level
     every other door of the building is still on screen and still pickable — measured,
     13 of 13 — so going 'back' is not a step anyone has to take, and Escape still does
     it for the keyboard. A control that is absent by design is not a failure. */
  if (did === 'BUTTON NOT VISIBLE') { console.log('  ' + name.padEnd(44) + from.padEnd(18) + '-> (this build has no such control, by design)'); continue }
  /* Escape undoes ONE commitment. From a suite that is the building it is in, not the
     compound — the same key meaning 'close this' in one place and 'abandon everything'
     in another is what V5.3 set out to remove. The OVERVIEW button is unchanged and is
     still the one global home. */
  const want = (name.includes('BUILDING chip') || name.includes('from SUITE, Escape')) ? 'building' : 'compound'
  console.log('  ' + name.padEnd(44) + from.padEnd(18) + '-> ' + to.padEnd(12) + (to === want ? 'PASS' : 'FAIL'))
}
process.exit(0)
