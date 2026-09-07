import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
import fs from 'node:fs'
const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: process.argv[5] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 60; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(5200)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
if (process.argv[2]) { await ev(process.argv[2]); await sleep(Number(process.argv[4] || 2400)) }
const s = await cdp.send('Page.captureScreenshot', { format: 'png' })
fs.mkdirSync('exploration/audit', { recursive: true })
fs.writeFileSync(process.argv[3] || 'exploration/audit/shot.png', Buffer.from(s.data, 'base64'))
console.log('wrote', process.argv[3] || 'exploration/audit/shot.png')
process.exit(0)
