/* Click a real control, wait for the model to land, screenshot. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const [,, URL, SETUP, SEL, OUT] = process.argv
const health = await ensure(); const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
const moving = () => ev('!!(window.__v5.gl && window.__v5.gl.moving)')
const settle = async () => { const t0 = Date.now()
  while (Date.now() - t0 < 800 && !(await moving())) await sleep(50)
  while (Date.now() - t0 < 6000 && (await moving())) await sleep(70)
  await sleep(400) }
if (SETUP) { await ev(SETUP); await settle() }
if (SEL) {
  const p = await ev(`(() => { const b = document.querySelector(${JSON.stringify(SEL)}); if (!b || b.hidden) return null
    const r = b.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)] })()`)
  if (!p) { console.log('control not present: ' + SEL); process.exit(1) }
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0], y: p[1], buttons: 0 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p[0], y: p[1], button: 'left', clickCount: 1, buttons: 1 })
  await sleep(70)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p[0], y: p[1], button: 'left', clickCount: 1, buttons: 0 })
  await settle()
}
const s = await cdp.send('Page.captureScreenshot', { format: 'png' })
const fs = await import('node:fs')
fs.writeFileSync(OUT, Buffer.from(s.data, 'base64'))
console.log('wrote ' + OUT + '  ' + await ev('(()=>{const S=window.__v5.S;return JSON.stringify({level:S.level,b:S.building?S.building.num:null,row:window.__v5.gl.rowIndex(S.building?S.building.num:null)})})()'))
process.exit(0)
