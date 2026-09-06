/* Live walkthrough of V3. Every state comes from a pointer event on the page — the
   model's own picking for buildings, the bay strip for suites. */
import { connect, recorder, sleep, moveTo, clickAt, CURSOR_JS } from './cdp.mjs'
const VW = 1440, VH = 944, BAR = 44
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v3-live-product.html' })
for (let i = 0; i < 50; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v3', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text); return r.result?.value }
await ev(CURSOR_JS)
await ev(`(() => { const st=document.createElement('style'); st.textContent='.stage{top:${BAR}px !important}'; document.head.appendChild(st);
  const b=document.createElement('div'); b.id='__bar';
  b.style.cssText='position:fixed;left:0;right:0;top:0;height:${BAR}px;z-index:2147483646;background:#0d0f11;border-bottom:1px solid #2a2e33;display:flex;align-items:center;gap:26px;padding:0 20px;font:12px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.06em;color:#e8ecef';
  b.innerHTML='<b style="color:#6fe08a">V3 — LIVE, real model + real state machine</b><span id="__b2" style="color:#8ab4ff"></span><span id="__b4" style="margin-left:auto;color:#7d848b"></span>';
  document.documentElement.appendChild(b);
  window.__bar=(s)=>{ document.getElementById('__b2').textContent=s||'';
    const st2=window.__v3.state; document.getElementById('__b4').textContent='level='+st2.level+'  subject='+(st2.suite?st2.suite.ref:(st2.building?st2.building.num:'-')); };
})()`)
const cap = (s) => ev(`window.__bar(${JSON.stringify(s)})`)
const rectOf = (sel) => ev(`(() => { const n=document.querySelector(${JSON.stringify(sel)}); if(!n) return null; const r=n.getBoundingClientRect();
  return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)]; })()`)

const rec = recorder(cdp, 'exploration/review-video/_cdp/frames-v3')
await rec.start({ maxWidth: VW, maxHeight: VH })
let cur = [720, 300]
await cap('COMPOUND — nine buildings, each wearing its own leader'); await sleep(4200)

/* hover the tag for 03 — a real pointer onto a real control */
const tag03 = await ev(`(() => { const t=document.querySelector('#tags .tag[data-num="03"]');
  if(!t) return null; const r=t.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)]; })()`)
if (tag03) {
  cur = await moveTo(cdp, cur, tag03, 34, 20)
  await cap('HOVER 03 — the leader draws, the tag warms, the other buildings step back'); await sleep(3200)
  await cap('CLICK 03'); await clickAt(cdp, tag03); await sleep(4200)
}
await cap('BUILDING 03 — the bays appear; each one is a suite'); await sleep(3400)

const bay = await ev(`(() => { const b=[...document.querySelectorAll('.bay')].filter(x=>x.dataset.sold!=='true')[10];
  const r=b.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)]; })()`)
cur = await moveTo(cdp, cur, bay, 30, 20)
await cap('HOVER A BAY — it opens, names itself, and the real door answers in the model'); await sleep(3000)
await cap('CLICK IT'); await clickAt(cdp, bay); await sleep(4200)
await cap('SUITE SELECTED — price becomes the figure, ENTER arms'); await sleep(3400)

const go = await rectOf('#go')
cur = await moveTo(cdp, cur, go, 26, 20)
await cap('ENTER — armed only now, and it fills under the pointer'); await sleep(3600)
await cap('BACK'); const bk = await rectOf('#back'); cur = await moveTo(cdp, cur, bk, 22, 20); await clickAt(cdp, bk); await sleep(3000)
await cap('END — model, data and picking are production’s; the console is V3’s own'); await sleep(2600)
const n = await rec.stop()
console.log(JSON.stringify({ frames: n, tag03, bay, go }))
process.exit(0)
