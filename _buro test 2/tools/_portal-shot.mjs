import { connect, sleep } from '../exploration/review-video/_cdp/cdp.mjs'
import { ensure } from '../exploration/review-video/_cdp/chrome.mjs'
import fs from 'node:fs'
const h = await ensure(); const cdp = await connect(h.ws)
await cdp.send('Page.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1.5, mobile: false })
await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5199/_buro%20test%202/index.html' })
await sleep(4500)
const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, captureBeyondViewport: true })
fs.writeFileSync('exploration/audit/portal.jpeg', Buffer.from(s.data, 'base64'))
console.log('wrote exploration/audit/portal.jpeg')
process.exit(0)
