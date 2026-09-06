/* Is the parapet light actually painted? Points, element boxes, and a frame to look at. */
import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'

const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find((x) => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 50; i++) {
  await sleep(600)
  const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true })
  if (r.result?.value) break
}
await sleep(6000)
const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })
  return r.exceptionDetails ? 'ERR ' + (r.exceptionDetails.exception?.description || '').slice(0, 160) : r.result?.value
}
await ev(`window.__v5.hoverBuilding(window.__v5.compound.byNum.get('03'))`)
await sleep(900)
console.log('edge hidden :', await ev(`document.getElementById('edge').hidden`))
console.log('edge box    :', await ev(`(() => { const r = document.getElementById('edge').getBoundingClientRect();
  return Math.round(r.width) + 'x' + Math.round(r.height); })()`))
console.log('ring points :', await ev(`document.querySelector('#edge .ring').getAttribute('points')`))
console.log('ring box    :', await ev(`(() => { const r = document.querySelector('#edge .ring').getBoundingClientRect();
  return Math.round(r.width) + 'x' + Math.round(r.height); })()`))
console.log('ring parent :', await ev(`document.querySelector('#edge .ring').parentNode.tagName`))
const sh = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 })
fs.writeFileSync('exploration/audit/EDGE-check.jpeg', Buffer.from(sh.data, 'base64'))
console.log('wrote exploration/audit/EDGE-check.jpeg')
process.exit(0)
