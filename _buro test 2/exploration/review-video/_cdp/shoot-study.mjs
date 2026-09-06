/* Shoot every 1440x900 frame of one study board, one file per state. */
import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'

const KEY = process.argv[2]
const NAMES = process.argv.slice(3)
const targets = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false })
await cdp.send('Page.navigate', { url: `http://localhost:5183/exploration/study/${KEY}.html` })
await sleep(3500)

const ev = async (e) => (await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value
const boxes = await ev(`[...document.querySelectorAll('.frame')].map(f => { const r = f.getBoundingClientRect();
  return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), width: Math.round(r.width), height: Math.round(r.height) }; })`)

fs.mkdirSync('exploration/study/shots', { recursive: true })
for (let i = 0; i < boxes.length; i++) {
  const r = await cdp.send('Page.captureScreenshot', {
    format: 'jpeg', quality: 92, captureBeyondViewport: true,
    clip: { ...boxes[i], scale: 1 },
  })
  const name = NAMES[i] || `${KEY}-${i + 1}`
  fs.writeFileSync(`exploration/study/shots/${name}.jpeg`, Buffer.from(r.data, 'base64'))
  console.log('shot', name, boxes[i].width + 'x' + boxes[i].height)
}
cdp.close(); process.exit(0)
