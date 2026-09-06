/* THE WHOLE HOMEPAGE, top to footer, at natural scroll speed with a pause at every act.
   This is the PRODUCTION site — Act 02 here is production's own interface, not V5, because
   V5 has not been moved into production and recording it as if it had would be a lie about
   what the site currently is. The caption says which is which. */
import { connect, recorder, sleep, moveTo, clickAt, CURSOR_JS } from './cdp.mjs'

const VW = 1440, VH = 944, BAR = 44
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find((x) => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/' })
await sleep(10000)

const ev = async (expression) => {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
await ev(CURSOR_JS)
await ev(`(() => {
  const st = document.createElement('style');
  st.textContent = 'body{padding-top:${BAR}px}';
  document.head.appendChild(st);
  const b = document.createElement('div'); b.id='__bar';
  b.style.cssText='position:fixed;left:0;right:0;top:0;height:${BAR}px;z-index:2147483647;background:#0d0f11;' +
    'border-bottom:1px solid #2a2e33;display:flex;align-items:center;gap:26px;padding:0 20px;' +
    'font:12px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.06em;color:#e8ecef';
  b.innerHTML='<b style="color:#6fe08a">REAL LUXE CORSA HOMEPAGE — production, Act 02 is the CURRENT interface</b>' +
    '<span id="__b2" style="color:#8ab4ff"></span><span id="__b4" style="margin-left:auto;color:#7d848b"></span>';
  document.documentElement.appendChild(b);
  window.__bar=(s)=>{ document.getElementById('__b2').textContent=s||'';
    const r=document.querySelector('[data-compound]');
    document.getElementById('__b4').textContent =
      'scrollY ' + Math.round(scrollY) + '  ' + (r ? 'act02 level=' + r.getAttribute('data-level') : ''); };
})()`)
const cap = (s) => ev('window.__cap=' + JSON.stringify(s) + '; window.__bar(window.__cap)')
const glide = (to, ms) => ev(`new Promise(res => { const from=scrollY, d=${ms}, t0=performance.now();
  const e=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  (function step(now){ const t=Math.min(1,(now-t0)/d); scrollTo(0, from+(${to}-from)*e(t));
    window.__bar(window.__cap); t<1?requestAnimationFrame(step):res(Math.round(scrollY)); })(performance.now()); })`)

const rec = recorder(cdp, 'exploration/review-video/_cdp/frames-site')
await rec.start({ maxWidth: VW, maxHeight: VH })

const acts = await ev(`[...document.querySelectorAll('.act')].map(a => ({
  n: a.dataset.act || '', top: Math.round(a.getBoundingClientRect().top + scrollY) }))`)
const docH = await ev('document.documentElement.scrollHeight - innerHeight')
const range = await ev('window.__lc_enterRange ? window.__lc_enterRange() : null')

await ev('scrollTo(0,0)')
await cap('00 — ENTRY. Top of the page, nothing touched.')
await sleep(4600)

for (const a of acts) {
  if (!a.n) continue
  if (a.n === '02') break
  await cap('ACT ' + a.n)
  await glide(a.top, 5200)
  await sleep(2600)
}

/* ---- ACT 02, the pinned range ---------------------------------------------------- */
const pin = range ? Math.round(range.start + 40) : 2325
await cap('ACT 02 — the compound. Production interface.')
await glide(pin, 5200)
await sleep(3600)

let cur = [720, 300]
await cap('ACT 02 — choosing building 03 from the index')
await ev(`(() => { const b=[...document.querySelectorAll('[data-bldg-index] button')].find(x=>x.dataset.bldgBtn==='03'); b&&b.click(); })()`)
await sleep(4000)
await cap('ACT 02 — building 03 selected. The record lists its suites.')
await sleep(3000)
await ev(`(() => { const b=[...document.querySelectorAll('[data-bay-list] button')].filter(x=>x.getAttribute('aria-disabled')!=='true')[10]; b&&b.click(); })()`)
await sleep(4000)
await cap('ACT 02 — a suite is chosen; ENTER becomes available')
await sleep(3000)
const en = await ev(`(() => { const n=document.querySelector('[data-nav-enter]'); if(!n) return null;
  const r=n.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return null;
  return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)]; })()`)
if (en) { cur = await moveTo(cdp, cur, en, 24, 20); await cap('ACT 02 — ENTER'); await clickAt(cdp, en); await sleep(5200) }

/* ---- the rest of the page --------------------------------------------------------- */
for (const a of acts) {
  if (!a.n || a.n <= '02') continue
  await cap('ACT ' + a.n)
  await glide(a.top, 5200)
  await sleep(2800)
}
await cap('FOOTER')
await glide(docH, 5200)
await sleep(3600)
await cap('END — one pass, top to footer, production as it stands today')
await sleep(2600)

const n = await rec.stop()
console.log(JSON.stringify({ frames: n, acts: acts.map(a => a.n).filter(Boolean), docH, range }))
process.exit(0)
