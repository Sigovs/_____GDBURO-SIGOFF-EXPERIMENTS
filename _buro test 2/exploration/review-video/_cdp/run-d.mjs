/* Live walkthrough of Direction D.  Every state below is produced by a pointer event
   landing on the page — the model's own picking for buildings, D's register rail for
   suites — and the caption reads the level and the figure straight out of the DOM, so it
   cannot describe a state the prototype is not actually in.

   The caption sits at the TOP here, and the stage is pushed down by its height for the
   duration of the recording: D's interface lives on the bottom edge, and a caption bar
   over it would hide the very thing being judged. */
import { connect, recorder, sleep, moveTo, clickAt, CURSOR_JS } from './cdp.mjs'

const URL = 'http://localhost:5183/exploration/d-hybrid-interactive.html'
const VW = 1440, VH = 944, BAR = 44

const targets = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
await sleep(7000)

const ev = async (expression) => {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error('page eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return r.result?.value
}

await ev(CURSOR_JS)
await ev(`(() => {
  const s = document.createElement('style');
  s.textContent = '.stage{top:${BAR}px !important}';
  document.head.appendChild(s);
  const b = document.createElement('div'); b.id='__bar';
  b.style.cssText='position:fixed;left:0;right:0;top:0;height:${BAR}px;z-index:2147483646;'+
    'background:#0d0f11;border-bottom:1px solid #2a2e33;display:flex;align-items:center;gap:26px;'+
    'padding:0 20px;font:12px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.06em;color:#e8ecef';
  b.innerHTML='<b style="color:#6fe08a">DIRECTION D &mdash; INTERACTIVE PROTOTYPE</b>'+
    '<span id="__b2" style="color:#8ab4ff"></span>'+
    '<span id="__b4" style="margin-left:auto;color:#7d848b"></span>';
  document.documentElement.appendChild(b);
  window.__bar=(s)=>{ document.getElementById('__b2').textContent = s || '';
    const sill=document.getElementById('sill'), fig=document.getElementById('fig');
    const h=sill.getBoundingClientRect().height;
    document.getElementById('__b4').textContent =
      'level=' + sill.dataset.level + (sill.dataset.entered==='true'?' (entered)':'') +
      '  subject=' + (fig.textContent||'-') +
      '  model=' + (100 - h/(innerHeight-${BAR})*100).toFixed(1) + '% of stage'; };
})()`)
const cap = (s) => ev(`window.__bar(${JSON.stringify(s)})`)

const hotB = () => ev(`window.__d.state.hover ? window.__d.state.hover.num : null`)

async function sweep(start, ys, x0, x1, steps = 42) {
  const found = new Map()
  let cur = start
  for (let k = 0; k < ys.length; k++) {
    const to = [(k % 2 ? x0 : x1), ys[k]]
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = Math.round(cur[0] + (to[0] - cur[0]) * t)
      const y = Math.round(cur[1] + (to[1] - cur[1]) * t)
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
      await ev(`window.__cur(${x},${y},0)`)
      const hit = await hotB()
      if (hit && !found.has(hit)) found.set(hit, [x, y])
      await sleep(15)
    }
    cur = to
  }
  return { cur, found }
}

const rectOf = (sel, nth = 0) => ev(`(() => { const n = document.querySelectorAll(${JSON.stringify(sel)})[${nth}];
  if (!n) return null; const r = n.getBoundingClientRect();
  return [Math.round(r.left + r.width/2), Math.round(r.top + r.height/2), n.textContent.trim().slice(0,34)]; })()`)

const rec = recorder(cdp, 'exploration/review-video/_cdp/frames-d')
await rec.start({ maxWidth: VW, maxHeight: VH })

/* ---- 1. at rest ------------------------------------------------------------------- */
await cap('COMPOUND at rest — the sill is two ranks, and the right half is empty on purpose')
await sleep(4600)

/* ---- 2. the model answers the pointer ---------------------------------------------- */
let cur = [720, 220]
await cap('HOVER — the model lights, and the sill takes the building as its subject')
const r1 = await sweep(cur, [260, 310, 360, 430], 160, 1330, 48)
cur = r1.cur
await cap('Buildings that answered: ' + ([...r1.found.keys()].join(', ') || 'none'))
await sleep(1800)

/* ---- 3. select a building in the model ---------------------------------------------- */
const pick = [...r1.found.entries()].find(([n]) => n === '03') || [...r1.found.entries()][0]
if (pick) {
  cur = await moveTo(cdp, cur, pick[1], 26, 20)
  await cap('CLICK building ' + pick[0] + ' — the sill grows one row')
  await clickAt(cdp, pick[1])
  await sleep(3000)
}
/* VERIFY, DO NOT ASSUME.  The sweep records where a mass answered, but the model turns
   under an ambient drift, so by the time the pointer travels back that point can be sky.
   The level is read from the DOM; if the click did not land, the recording says so rather
   than selecting a building behind the visitor's back and letting the video imply a click
   that never happened. */
if ((await ev(`window.__d.state.level`)) !== 'building') {
  await cap('THAT CLICK MISSED — the model had turned. Selecting from the state machine, and saying so')
  await ev(`window.__d.selectBuilding(window.__d.compound.byNum.get('03'))`)
  await sleep(3200)
}
await cap('BUILDING — the register appears as a scale: marks on a datum, not bars on a chart')
await sleep(3000)

/* ---- 4. THE REGISTER.  Browsing 23 suites inside one row. --------------------------- */
const nTicks = await ev(`document.querySelectorAll('.tick').length`)
await cap(`REGISTER — ${nTicks} suites in one row, hovered one at a time`)
const pickIdx = (n, k) => [...new Set(Array.from({ length: k }, (_, j) => Math.round(j * (n - 1) / (k - 1))))]
for (const i of pickIdx(nTicks, Math.min(6, nTicks))) {
  const r = await rectOf('.tick', i)
  if (!r) continue
  cur = await moveTo(cdp, cur, [r[0], r[1]], 16, 18)
  await sleep(620)
  await cap('REGISTER — ' + (await ev(`window.__d.state.hoverSuite ? window.__d.state.hoverSuite.ref + (window.__d.state.hoverSuite.sold ? ' (sold)' : '') : '-'`)))
  await sleep(420)
}

/* ---- 5. select a suite from the rail ------------------------------------------------ */
const avail = await ev(`(() => { const t=[...document.querySelectorAll('.tick')].filter(x=>x.dataset.sold!=='true');
  const n=t[Math.min(6, t.length-1)]; const r=n.getBoundingClientRect();
  return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)]; })()`)
cur = await moveTo(cdp, cur, avail, 14, 18)
await cap('CLICK a suite on the register')
await clickAt(cdp, avail)
await sleep(3200)
await cap('SUITE — accent marks the CHOSEN bay and the datum at the left margin, nothing else')
await sleep(3200)

/* ---- 6. stepping, which is what "many suites" actually needs ------------------------ */
await cap('BROWSING — the step control walks the register, camera follows each time')
const nx = await rectOf('#next')
for (let i = 0; i < 4; i++) {
  cur = await moveTo(cdp, cur, [nx[0], nx[1]], 12, 18)
  await clickAt(cdp, [nx[0], nx[1]])
  await sleep(1700)
  await cap('BROWSING — now ' + (await ev(`window.__d.state.suite.ref`)))
}
await sleep(1400)

/* ---- 7. the three acts, each clicked where it is drawn ------------------------------ */
for (const [sel, label] of [['#act-back', 'BACK'], ['#act-reset', 'RESET VIEW']]) {
  const r = await rectOf(sel)
  cur = await moveTo(cdp, cur, [r[0], r[1]], 22, 20)
  await cap('CLICK ' + label + ' — "' + r[2] + '"')
  await clickAt(cdp, [r[0], r[1]])
  await sleep(2600)
  await cap(label + ' — level is now "' + (await ev(`window.__d.state.level`)) + '"')
  await sleep(1800)
}

/* ---- 8. ENTER, armed only by a suite ------------------------------------------------ */
await cap('ENTER is inert until a suite exists — choosing one from the register')
const again2 = await ev(`(() => { const t=[...document.querySelectorAll('.tick')].filter(x=>x.dataset.sold!=='true');
  const n=t[Math.min(2, t.length-1)]; const r=n.getBoundingClientRect();
  return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)]; })()`)
cur = await moveTo(cdp, cur, again2, 18, 18)
await clickAt(cdp, again2)
await sleep(3000)
const en = await rectOf('#act-enter')
cur = await moveTo(cdp, cur, [en[0], en[1]], 22, 20)
await cap('CLICK ENTER — "' + en[2] + '"')
await clickAt(cdp, [en[0], en[1]])
await sleep(2600)
await cap('ENTERED — the sill retires to one line; Act 03 would take over here')
await sleep(4000)

await cap('END — structure unchanged from the accepted D; this pass changed only the picture')
await sleep(2600)

const n = await rec.stop()
console.log(JSON.stringify({ frames: n, buildings: [...r1.found.keys()], ticks: nTicks }, null, 1))
cdp.close(); process.exit(0)
