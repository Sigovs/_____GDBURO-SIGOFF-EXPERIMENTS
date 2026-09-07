/* Just the page's own console output. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const health = await ensure(); const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
cdp.on('Runtime.consoleAPICalled', (p) => {
  const t = p.args.map((a) => a.value ?? a.description ?? '').join(' ')
  if (/luxe-corsa|WARN|Error/i.test(t)) console.log('  [' + p.type + '] ' + t)
})
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: process.argv[2] })
await sleep(11000)
process.exit(0)
