/* A MAGNIFIED CROP OF ONE PART OF THE FRAME. Judging a door by looking at a 1440-wide
   screenshot of a whole compound is judging it at the size of a fingernail. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
import fs from 'node:fs'
const [,, URL, SETUP, OUT, X, Y, W, H, WAIT] = process.argv
const health = await ensure(); const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
if (await ev('!!document.getElementById("act-02")')) { await ev('document.getElementById("act-02").scrollIntoView()'); await sleep(2200) }
if (SETUP) { await ev(SETUP); await sleep(Number(WAIT || 4200)) }
const s = await cdp.send('Page.captureScreenshot', { format: 'png',
  clip: { x: Number(X), y: Number(Y), width: Number(W), height: Number(H), scale: 3 } })
fs.mkdirSync('exploration/audit', { recursive: true })
fs.writeFileSync(OUT, Buffer.from(s.data, 'base64'))
console.log('wrote', OUT)
process.exit(0)
