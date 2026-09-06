import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/audit/scene-audit.html' })
for (let i = 0; i < 40; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: 'window.__ready === true', returnByValue: true }); if (r.result?.value) break }
await sleep(4000)
const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94 })
fs.mkdirSync('exploration/audit', { recursive: true })
fs.writeFileSync('exploration/audit/SCENE-raw.jpeg', Buffer.from(r.data, 'base64'))
console.log('wrote exploration/audit/SCENE-raw.jpeg')
process.exit(0)
