import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: process.argv[2] })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(5500)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
const move = (x, y) => cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
if (process.argv[3] === 'scroll') { await ev("document.getElementById('act-02').scrollIntoView()"); await sleep(2200) }
await ev("window.__v5.selectBuilding(window.__v5.compound.byNum.get('03'))"); await sleep(1800)
await ev("window.__lc = []; for (const t of ['pointerdown','mousedown','mouseup','pointerup','click','pointercancel']) window.addEventListener(t, e => window.__lc.push(t + ' -> ' + e.target.tagName + '.' + (e.target.className.baseVal ?? e.target.className) + ' disabled=' + e.target.disabled + ' sold=' + e.target.dataset.sold), true)")
const info = await ev(`(() => { const bs=[...document.querySelectorAll('[data-bays] [data-bay]')].filter(b=>b.dataset.sold!=='true')
  const b = bs[3], r=b.getBoundingClientRect()
  const cx = Math.round(r.left+r.width/2), cy = Math.round(r.top+r.height/2)
  const el = document.elementFromPoint(cx, cy)
  return { rect:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)], cx, cy,
    disabled: b.disabled, elementAtPoint: el ? el.tagName + '.' + el.className : null,
    isTheBay: el === b || b.contains(el), scrollY: Math.round(scrollY) } })()`)
console.log('bay:', JSON.stringify(info))
await move(info.cx, info.cy); await sleep(400)
console.log('after move  hoverSuite =', await ev('window.__v5.S.hoverSuite ? window.__v5.S.hoverSuite.ref : null'))
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: info.cx, y: info.cy, button: 'left', clickCount: 1, buttons: 1 })
await sleep(80)
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: info.cx, y: info.cy, button: 'left', clickCount: 1, buttons: 0 })
await sleep(1400)
console.log('after click level =', await ev('window.__v5.S.level'), ' suite =', await ev('window.__v5.S.suite ? window.__v5.S.suite.ref : null'))
console.log('captured clicks:', JSON.stringify(await ev('window.__lc')))
console.log('scrollY now:', await ev('Math.round(scrollY)'))
process.exit(0)
