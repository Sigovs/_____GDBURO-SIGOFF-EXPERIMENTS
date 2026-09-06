/* Does the page stand at all? One load, one report, no interaction. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
import fs from 'node:fs'
const OUT = process.argv[3] || 'exploration/review-video/_cdp/probe.txt'
fs.writeFileSync(OUT, '')
const log = (s) => { console.log(s); fs.appendFileSync(OUT, s + '\n') }
const URL = process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html'
log('connecting...')
const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
const msgs = []
cdp.on('Runtime.exceptionThrown', (p) => msgs.push('EXC ' + (p.exceptionDetails?.exception?.description || p.exceptionDetails?.text)))
cdp.on('Runtime.consoleAPICalled', (p) => msgs.push(p.type.toUpperCase() + ' ' + p.args.map((a) => a.value ?? a.description ?? a.type).join(' ')))
cdp.on('Log.entryAdded', (p) => msgs.push('LOG ' + p.entry.level + ' ' + p.entry.text))
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
log('navigating ' + URL)
await cdp.send('Page.navigate', { url: URL })
let ok = false
for (let i = 0; i < 40; i++) {
  await sleep(500)
  const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true })
  if (r.result?.value) { ok = true; log('window.__v5 appeared after ' + ((i + 1) * 0.5) + 's'); break }
}
if (!ok) log('window.__v5 NEVER APPEARED')
await sleep(3000)
const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })
  return r.exceptionDetails ? 'THREW: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text) : r.result?.value
}
log('buildings   ' + JSON.stringify(await ev('window.__v5 ? window.__v5.compound.buildings.map(b=>b.num) : null')))
log('suites      ' + JSON.stringify(await ev('window.__v5 ? window.__v5.compound.suites.length : null')))
log('proxies     ' + JSON.stringify(await ev(`(() => { if(!window.__v5) return null; let n=0, by={}; window.__v5.gl.site.traverse(o=>{ if(o.userData&&o.userData.pick){n++; by[o.userData.num]=(by[o.userData.num]||0)+1} }); return n + ' proxies ' + JSON.stringify(by) })()`)))
log('messages:')
for (const m of msgs.slice(0, 25)) log('   ' + m)
process.exit(0)
