/* The one number the proposed direction is judged on: how much of the frame the model
   keeps at each level, measured on the board rather than estimated. */
import { connect, sleep } from './cdp.mjs'

const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find((x) => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-the-apron.html' })
await sleep(4000)

const r = await cdp.send('Runtime.evaluate', {
  expression: "[...document.querySelectorAll('.frame')].map(f => Math.round(f.querySelector('.apron').getBoundingClientRect().height))",
  returnByValue: true,
})
const rows = r.result?.value || []
const names = ['COMPOUND', 'BUILDING', 'SUITE']
rows.forEach((h, i) => console.log('  ' + names[i].padEnd(9) + ' apron ' + String(h).padStart(3) + 'px   model ' + (100 - (h / 900) * 100).toFixed(1) + '% of the frame'))
process.exit(0)
