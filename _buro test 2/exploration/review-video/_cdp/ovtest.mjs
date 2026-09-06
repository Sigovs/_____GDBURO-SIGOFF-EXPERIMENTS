import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: process.argv[2] })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(5500)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
await ev(`(async () => { const el = document.getElementById('act-02'); if (el) { el.scrollIntoView(); await new Promise(r=>setTimeout(r,1600)) }
  window.__v5.selectBuilding(window.__v5.compound.byNum.get('07')); await new Promise(r=>setTimeout(r,1200)) })()`)
await ev(`window.__lc=[]; for (const t of ['pointerdown','mousedown','mouseup','pointerup','click'])
  window.addEventListener(t, e => window.__lc.push(t+':'+e.target.tagName+'.'+((e.target.className.baseVal ?? e.target.className)||'-')), true)`)
const p = await ev(`(() => { const b=document.querySelector('[data-overview]'); const r=b.getBoundingClientRect()
  return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0], y: p[1], buttons: 0 }); await sleep(200)
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p[0], y: p[1], button: 'left', clickCount: 1, buttons: 1 }); await sleep(90)
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p[0], y: p[1], button: 'left', clickCount: 1, buttons: 0 }); await sleep(1600)
console.log('point ', p.join(','))
console.log('events', JSON.stringify(await ev('window.__lc')))
console.log('level ', await ev('window.__v5.S.level'))
console.log('scrollY', await ev('Math.round(scrollY)'))
process.exit(0)
