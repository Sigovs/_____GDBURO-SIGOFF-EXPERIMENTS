/* Walkthrough of the REAL Luxe Corsa app. Every state change in this recording is
   produced by a pointer event landing on the page — nothing is scripted into the state
   machine, and the caption reads the level straight off the DOM so the label cannot
   drift from what the app actually thinks it is doing. */
import { connect, recorder, sleep, moveTo, clickAt, CURSOR_JS } from './cdp.mjs'

const SITE = 'http://localhost:5183/'
const VW = 1440, VH = 952, BAR = 52
const STAGE = VH - BAR

const targets = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: SITE })
await sleep(7000)

const evalJS = async (expression) => {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error('page eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return r.result?.value
}

await evalJS(CURSOR_JS)
await evalJS(`(() => {
  const b = document.createElement('div'); b.id='__bar';
  b.style.cssText='position:fixed;left:0;right:0;bottom:0;height:${BAR}px;z-index:2147483646;'+
    'background:#0d0f11;border-top:1px solid #2a2e33;display:flex;align-items:center;gap:26px;'+
    'padding:0 20px;font:12px/1.35 ui-monospace,Consolas,monospace;letter-spacing:.06em;color:#e8ecef';
  b.innerHTML='<b style="color:#6fe08a">REAL LUXE CORSA &mdash; LIVE APP</b><span id="__b2" style="color:#8ab4ff"></span>'+
    '<span id="__b3" style="color:#6fe08a">INTERACTIVE &mdash; real pointer events into the Three.js canvas</span>'+
    '<span id="__b4" style="margin-left:auto;color:#7d848b"></span>';
  document.documentElement.appendChild(b);
  window.__bar=(s)=>{ document.getElementById('__b2').textContent = s == null ? '' : s;
    const r=document.querySelector('[data-compound]');
    document.getElementById('__b4').textContent = location.href + '   level=' + (r?r.getAttribute('data-level'):'-'); };
})()`)

/* A scroll the page can scrub. Jumping scrollTop would step ScrollTrigger past its own
   easing and every act would arrive already finished. */
const glideScroll = (to, ms) => evalJS(`new Promise(res => {
  const from = scrollY, d = ${ms}, t0 = performance.now();
  const ease = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
  (function step(now){
    const t = Math.min(1, (now - t0)/d);
    scrollTo(0, from + (${to} - from) * ease(t));
    window.__bar(window.__cap);
    t < 1 ? requestAnimationFrame(step) : res(Math.round(scrollY));
  })(performance.now());
})`)
const cap = (s) => evalJS(`window.__cap = ${JSON.stringify(s)}; window.__bar(window.__cap)`)

const level = () => evalJS(`document.querySelector('[data-compound]').getAttribute('data-level')`)
const hotBldg = () => evalJS(`(() => { const b=[...document.querySelectorAll('[data-bldg-index] button')].find(x=>x.getAttribute('data-hot')==='true'); return b?b.dataset.bldgBtn:null; })()`)
const hotSuite = () => evalJS(`(() => { const b=[...document.querySelectorAll('[data-bay-list] button')].find(x=>x.getAttribute('data-hot')==='true'); return b?b.dataset.suiteIndex:null; })()`)
const rectOf = (sel) => evalJS(`(() => { const n=document.querySelector(${JSON.stringify(sel)});
  if(!n||n.hidden) return null; const r=n.getBoundingClientRect();
  if(r.width<2||r.bottom>${STAGE}||r.top<0) return null;
  return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2), n.textContent.trim().slice(0,34)]; })()`)

/* THE SWEEP IS ALSO THE PROBE. The model is drawn by a perspective camera that drifts,
   so no fixed table of coordinates survives; the pointer reads the model the way a
   visitor would, and remembers where each mass answered. */
async function sweep(start, ys, x0, x1, probe, steps = 40) {
  const found = new Map()
  let cur = start
  ys.forEach(() => {})
  for (let k = 0; k < ys.length; k++) {
    const to = [(k % 2 ? x0 : x1), ys[k]]
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = Math.round(cur[0] + (to[0] - cur[0]) * t)
      const y = Math.round(cur[1] + (to[1] - cur[1]) * t)
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
      await evalJS(`window.__cur(${x},${y},0)`)
      const hit = await probe()
      if (hit != null && !found.has(hit)) found.set(hit, [x, y])
      await sleep(14)
    }
    cur = to
  }
  return { cur, found }
}

const rec = recorder(cdp, 'exploration/review-video/_cdp/frames-real')
await rec.start({ maxWidth: VW, maxHeight: VH })

/* ---- 1. the page as a visitor meets it, top to bottom ---------------------------- */
await evalJS('scrollTo(0,0)')
await cap('LOADED - top of page, nothing touched yet')
await sleep(3800)
const docH = await evalJS('document.documentElement.scrollHeight - innerHeight')
await cap('NATURAL SCROLL - top to bottom, real scroll, real ScrollTrigger')
await glideScroll(docH, 26000)
await sleep(1600)

/* ---- 2. back up into Act 02, which is a pinned range ------------------------------ */
await cap('BACK UP TO ACT 02 - the compound')
const range = await evalJS('window.__lc_enterRange ? window.__lc_enterRange() : null')
const pin = range ? Math.round(range.start + 40) : 1900
await glideScroll(pin, 6000)
await sleep(2500)

let cur = [720, 300]
await cap('ACT 02 - pointer across the model, buildings light under it')
const r1 = await sweep(cur, [430, 520, 620], 200, 1240, hotBldg)
cur = r1.cur
await cap('HOVER - buildings that answered the pointer: ' + ([...r1.found.keys()].join(', ') || 'none'))
await sleep(1800)

/* ---- 3. select a building, in the model, with a click ----------------------------- */
const pickB = [...r1.found.entries()][Math.min(1, Math.max(0, r1.found.size - 1))]
if (pickB) {
  cur = await moveTo(cdp, cur, pickB[1], 26, 20)
  await cap('CLICK building ' + pickB[0] + ' in the model')
  await clickAt(cdp, pickB[1])
  await sleep(2600)
  await cap('SELECTED - level is now "' + (await level()) + '", the camera moved to it')
  await sleep(2600)
}

/* ---- 4. suites, the same way ------------------------------------------------------ */
/* A raster of the whole stage put every suite that answers inside a narrow band across
   the face of the focused building — roughly x 560-880, y 560-650 — which is exactly
   what a band of doors seen three-quarter-on should project to. The compound-level sweep
   heights fly straight over it, so the suite pass gets its own. */
await sleep(1800)
await cap('SUITES - pointer across the doors of the selected building')
const r2 = await sweep(cur, [565, 600, 635], 500, 950, hotSuite, 46)
cur = r2.cur
const pickS = [...r2.found.entries()][Math.min(2, Math.max(0, r2.found.size - 1))]
if (pickS) {
  cur = await moveTo(cdp, cur, pickS[1], 24, 20)
  await cap('CLICK a suite in the model')
  await clickAt(cdp, pickS[1])
  await sleep(2600)
  await cap('SELECTED - level is now "' + (await level()) + '"')
  await sleep(2400)
}

/* ---- 5. the two navigation controls, each clicked where it is drawn --------------- */
for (const [sel, label] of [['[data-nav-back]', 'BACK'], ['[data-nav-reset]', 'RESET VIEW']]) {
  const r = await rectOf(sel)
  if (!r) { await cap(label + ' - not on screen at this scroll position'); await sleep(1600); continue }
  cur = await moveTo(cdp, cur, [r[0], r[1]], 24, 20)
  await cap('CLICK ' + label + ' - "' + r[2] + '"')
  await clickAt(cdp, [r[0], r[1]])
  await sleep(2400)
  await cap(label + ' - level is now "' + (await level()) + '"')
  await sleep(2000)
}

/* ---- 6. ENTER, which is only real once a suite exists ----------------------------- */
await cap('ENTER stays inert until a suite is chosen - choosing one again')
if (pickB) { cur = await moveTo(cdp, cur, pickB[1], 22, 20); await clickAt(cdp, pickB[1]); await sleep(2600) }
const r3 = await sweep(cur, [600, 630], 520, 900, hotSuite, 40)
cur = r3.cur
const again = [...r3.found.entries()][0]
if (again) { cur = await moveTo(cdp, cur, again[1], 20, 20); await clickAt(cdp, again[1]); await sleep(2400) }
const en = await rectOf('[data-nav-enter]')
if (en) {
  cur = await moveTo(cdp, cur, [en[0], en[1]], 24, 20)
  await cap('CLICK ENTER - "' + en[2] + '"')
  await clickAt(cdp, [en[0], en[1]])
  await sleep(6000)
  await cap('ENTER drove the pin forward - this is the current 02 to 03 transition')
  await sleep(6000)
} else {
  await cap('ENTER - control not resolvable on screen at this position')
  await sleep(2000)
}
await cap('END - every state above came from a pointer event on the page')
await sleep(2600)

const n = await rec.stop()
console.log(JSON.stringify({
  frames: n, pin, range,
  buildingsFound: [...r1.found.keys()], suitesFound: [...r2.found.keys()],
  picked: { building: pickB && pickB[0], suite: pickS && pickS[0] }, enter: en,
}, null, 1))
cdp.close(); process.exit(0)
