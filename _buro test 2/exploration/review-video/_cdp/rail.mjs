import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const h = await ensure(); const cdp = await connect(h.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: process.argv[2] })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
const move = (x, y) => cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
const click = async (x, y) => { await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 }); await sleep(70)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 }) }
if (await ev('!!document.getElementById("act-02")')) { await ev('document.getElementById("act-02").scrollIntoView()'); await sleep(2200) }
await ev('window.__v5.selectBuilding(window.__v5.compound.byNum.get("03"))'); await sleep(1600)
const info = await ev(`(() => { const bs=[...document.querySelectorAll('[data-bays] [data-bay]')].filter(b=>b.dataset.sold!=='true')
  const b=bs[3]; const r=b.getBoundingClientRect()
  return { n: bs.length, ref: b._s.ref, box:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)],
    x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2) } })()`)
await move(info.x, info.y); await sleep(400)
const hov = await ev('window.__v5.S.hoverSuite ? window.__v5.S.hoverSuite.ref : null')
await click(info.x, info.y); await sleep(1500)
const sel = await ev('window.__v5.S.suite ? window.__v5.S.suite.ref : null')
console.log(JSON.stringify({ ...info, hovered: hov, selected: sel, works: hov === info.ref && sel === info.ref }))
process.exit(0)
