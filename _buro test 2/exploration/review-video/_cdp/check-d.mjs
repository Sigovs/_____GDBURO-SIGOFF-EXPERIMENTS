/* Does D actually stand? Loads it, drives one full descent through the state machine and
   reports what the DOM says at each level, plus the measured share of the stage the
   interface takes — the number the brief is judged on, measured rather than asserted. */
import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'

const VW = 1440, VH = 900
const targets = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')

const errors = []
cdp.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') errors.push(p.entry.text) })
cdp.on('Runtime.exceptionThrown', (p) => errors.push(p.exceptionDetails.exception?.description || p.exceptionDetails.text))

await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/d-hybrid-interactive.html' })
await sleep(6000)

const ev = async (expression) => {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}

const shot = async (name) => {
  const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 88 })
  fs.mkdirSync('exploration/shots', { recursive: true })
  fs.writeFileSync(`exploration/shots/${name}.jpeg`, Buffer.from(r.data, 'base64'))
}

const READ = `(() => {
  const sill = document.getElementById('sill');
  const h = sill.getBoundingClientRect().height;
  return {
    gl: document.getElementById('stage').getAttribute('data-gl'),
    level: sill.dataset.level, entered: sill.dataset.entered,
    path: document.getElementById('path').textContent.replace(/\\s+/g,' ').trim(),
    fig: document.getElementById('fig').textContent,
    sub: document.getElementById('sub').textContent.replace(/\\s+/g,' ').trim(),
    ticks: document.querySelectorAll('.tick').length,
    sold: document.querySelectorAll('.tick[data-sold="true"]').length,
    count: document.getElementById('count').textContent.trim(),
    specCells: document.querySelectorAll('.spec__cell').length,
    enter: document.getElementById('act-enter').textContent.trim(),
    enterReady: document.getElementById('act-enter').dataset.ready,
    back: document.getElementById('act-back').textContent.trim(),
    backDisabled: document.getElementById('act-back').getAttribute('aria-disabled'),
    sillPx: Math.round(h),
    sillPct: +(h / innerHeight * 100).toFixed(1),
    modelPct: +((1 - h / innerHeight) * 100).toFixed(1),
    regWidth: Math.round(document.getElementById('ticks').getBoundingClientRect().width),
    overflowX: document.documentElement.scrollWidth > innerWidth,
    specWrapped: (() => { const c=[...document.querySelectorAll('.spec__cell')]; if(c.length<2) return false;
      return new Set(c.map(n => Math.round(n.getBoundingClientRect().top))).size > 1; })(),
  };
})()`

const out = {}
out.compound = await ev(READ)
await shot('D1-compound')

/* Hover a building through the real hover entry point, then select it. */
await ev(`(() => { const b = window.__d.compound.byNum.get('03'); window.__d.selectBuilding(b); })()`)
await sleep(2200)
out.building = await ev(READ)
await shot('D2-building')

await ev(`(() => { const b = window.__d.compound.byNum.get('03'); const s = b.suites.find(x => !x.sold); window.__d.selectSuite(s); })()`)
await sleep(2200)
out.suite = await ev(READ)
await shot('D3-suite')

/* Browse: step forward five times and confirm the selection actually moves. */
const refs = []
for (let i = 0; i < 5; i++) { await ev('window.__d.step(1)'); await sleep(320); refs.push(await ev(`window.__d.state.suite.ref`)) }
out.browse = refs

await ev('window.__d.enter()'); await sleep(900)
out.entered = await ev(READ)
await shot('D4-entered')

await ev('window.__d.back()'); await sleep(1600)
out.afterBack = await ev(READ)

/* The biggest building is the real test of the rail: does it still fit on one row? */
out.biggest = await ev(`(() => {
  const b = window.__d.compound.buildings.slice().sort((x,y)=>y.suites.length-x.suites.length)[0];
  window.__d.selectBuilding(b);
  return { num: b.num, suites: b.suites.length };
})()`)
await sleep(1800)
out.biggestRead = await ev(READ)
await shot('D5-biggest-building')

out.consoleErrors = errors
console.log(JSON.stringify(out, null, 1))
cdp.close(); process.exit(0)
