/* Live walkthrough of V4 — the guided experience and the optional plan.
   Suites are chosen with a real pointer on a real bay; buildings are driven through the
   production hover/select entry points, because in V4 there is no rest tag to aim at —
   the model is what a visitor points at, and a script cannot hold a WebGL hover. */
import { connect, recorder, sleep, moveTo, clickAt, CURSOR_JS } from './cdp.mjs'

const VW = 1440, VH = 944, BAR = 44
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find((x) => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v4-guided-experience.html' })
for (let i = 0; i < 50; i++) {
  await sleep(600)
  const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v4', returnByValue: true })
  if (r.result?.value) break
}
await sleep(6500)

const ev = async (expression) => {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
await ev(CURSOR_JS)
await ev(`(() => {
  const st = document.createElement('style'); st.textContent = '.stage{top:${BAR}px !important}'; document.head.appendChild(st);
  const b = document.createElement('div'); b.id = '__bar';
  b.style.cssText = 'position:fixed;left:0;right:0;top:0;height:${BAR}px;z-index:2147483647;background:#0d0f11;' +
    'border-bottom:1px solid #2a2e33;display:flex;align-items:center;gap:26px;padding:0 20px;' +
    'font:12px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.06em;color:#e8ecef';
  b.innerHTML = '<b style="color:#6fe08a">V4 — LIVE on the corrected model</b>' +
    '<span id="__b2" style="color:#8ab4ff"></span><span id="__b4" style="margin-left:auto;color:#7d848b"></span>';
  document.documentElement.appendChild(b);
  window.__bar = (s) => { document.getElementById('__b2').textContent = s || '';
    const st2 = window.__v4.state;
    document.getElementById('__b4').textContent =
      (st2.plan ? 'SITE PLAN · ' : '') + 'level=' + st2.level +
      '  subject=' + (st2.suite ? st2.suite.ref : (st2.building ? st2.building.num : '-')); };
})()`)
const cap = (s) => ev('window.__bar(' + JSON.stringify(s) + ')')
const rectOf = (sel) => ev(`(() => { const n = document.querySelector(${JSON.stringify(sel)});
  if (!n || n.hidden) return null; const r = n.getBoundingClientRect();
  return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; })()`)

const rec = recorder(cdp, 'exploration/review-video/_cdp/frames-v4')
await rec.start({ maxWidth: VW, maxHeight: VH })
let cur = [720, 300]

await cap('COMPOUND — no leaders at rest. The model is what you point at.')
await sleep(4400)

await ev(`window.__v4.hoverBuilding(window.__v4.compound.byNum.get('03'))`)
await cap('HOVER 03 — one leader draws, and every other building steps back')
await sleep(3800)

await ev(`window.__v4.selectBuilding(window.__v4.compound.byNum.get('03'))`)
await cap('SELECT 03 — camera moves, the leader turns red, the bays appear')
await sleep(4400)
await cap('MINIATURE GARAGE BAYS — the wide ones are PREMIUM, Type A')
await sleep(3200)

const bay = await ev(`(() => { const b = [...document.querySelectorAll('.bay')].filter(x => x.dataset.sold !== 'true')[10];
  const r = b.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; })()`)
cur = await moveTo(cdp, cur, bay, 30, 20)
await cap('HOVER A BAY — it opens and names itself; the real door answers in the model')
await sleep(3200)
await cap('CLICK IT')
await clickAt(cdp, bay)
await sleep(4200)
await cap('SUITE SELECTED — type, area, price, and ENTER arms')
await sleep(3400)

const go = await rectOf('#go')
if (go) { cur = await moveTo(cdp, cur, go, 26, 20); await cap('ENTER — armed only now, and it fills under the pointer'); await sleep(3400) }

await cap('OPTIONAL — EXPLORE SITE PLAN')
await ev('window.__v4.openPlan()')
await sleep(4000)
await cap('THE EXIT IS ALWAYS ON SCREEN, top left, and never scrolls away')
await sleep(3000)
await ev('window.__v4.closePlan()')
await sleep(2600)
await cap('BACK IN THE EXPERIENCE — on the same suite it left')
await sleep(3400)

const n = await rec.stop()
console.log(JSON.stringify({ frames: n, bay, go }))
process.exit(0)
