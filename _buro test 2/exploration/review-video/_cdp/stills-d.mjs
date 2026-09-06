/* Clean stills of D — no caption bar, no synthetic pointer, nothing drawn over the frame.
   Each state is reached through the real state machine and then given time to settle,
   because the camera flies and a still taken mid-fly is a picture of a transition. */
import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'

const VW = 1440, VH = 900
const targets = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 2, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/d-hybrid-interactive.html' })
await sleep(7000)

const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
fs.mkdirSync('exploration/shots', { recursive: true })
const shot = async (name) => {
  const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 })
  fs.writeFileSync(`exploration/shots/${name}.jpeg`, Buffer.from(r.data, 'base64'))
  console.log('wrote', name, '—', await ev(`document.getElementById('sill').dataset.level + '/' + document.getElementById('fig').textContent`))
}

await sleep(1500)
await shot('D1-COMPOUND')

/* Hover, through the model's own picking, so the still shows the real lit state. */
const hit = await ev(`(() => {
  const b = window.__d.compound.byNum.get('03');
  window.__d.compound.suites; return b.num;
})()`)
await ev(`(() => { const b = window.__d.compound.byNum.get('${hit}');
  window.__d.state.hover = null; })()`)
/* The hover entry point is internal, so the still for hover is taken by driving a real
   pointer across the canvas until the model reports the building lit. */
const canvas = await ev(`(r => ({x:r.x,y:r.y,w:r.width,h:r.height}))(document.querySelector('canvas').getBoundingClientRect())`)
let lit = null
outer:
for (let gy = 0.42; gy <= 0.80; gy += 0.05) {
  for (let gx = 0.12; gx <= 0.9; gx += 0.03) {
    const x = Math.round(canvas.x + gx * canvas.w), y = Math.round(canvas.y + gy * canvas.h)
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
    await sleep(24)
    const f = await ev(`window.__d.state.hover ? window.__d.state.hover.num : null`)
    if (f) { lit = { num: f, x, y }; break outer }
  }
}
if (lit) { await sleep(900); await shot('D2-COMPOUND-hover') }

await ev(`window.__d.selectBuilding(window.__d.compound.byNum.get('03'))`)
await sleep(2600)
await shot('D3-BUILDING')

/* Hover one tick on the register, so the BUILDING still shows the rail doing its job. */
/* An AVAILABLE bay, not whichever index happened to come up: tick 8 is sold, and a
   still of a sold-bay hover demonstrates the one state the rail is quietest in. */
const tick = await ev(`(() => { const t = [...document.querySelectorAll('.tick')].filter(t => t.dataset.sold !== 'true')[8];
  const r = t.getBoundingClientRect(); return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }; })()`)
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tick.x, y: tick.y, buttons: 0 })
await sleep(1200)
await shot('D4-BUILDING-rail-hover')

await ev(`window.__d.selectSuite(window.__d.compound.byNum.get('03').suites.filter(x=>!x.sold)[6])`)
await sleep(2800)
await shot('D5-SUITE-enter-ready')

await ev('window.__d.enter()')
await sleep(1400)
await shot('D6-ENTERED')

console.log('sill share:', await ev(`(() => { const s=document.getElementById('sill').getBoundingClientRect();
  return +((1-s.height/innerHeight)*100).toFixed(1); })()`))
cdp.close(); process.exit(0)
