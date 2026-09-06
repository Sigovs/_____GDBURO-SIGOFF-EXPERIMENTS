import { connect, sleep } from './cdp.mjs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
const errs = []
cdp.on('Log.entryAdded', p => { if (p.entry.level === 'error') errs.push(p.entry.text.slice(0,120)) })
cdp.on('Runtime.exceptionThrown', p => errs.push((p.exceptionDetails.exception?.description||'').slice(0,160)))
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/' })
await sleep(9000)
const ev = async (e) => (await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value
const r = await ev('window.__lc_enterRange ? window.__lc_enterRange() : null')
await ev(`window.scrollTo(0, ${r ? Math.round(r.start + 40) : 2325})`); await sleep(3000)
console.log('PRODUCTION still stands:')
console.log('  gl =', await ev(`document.querySelector('[data-compound]').getAttribute('data-gl')`))
console.log('  level =', await ev(`document.querySelector('[data-compound]').getAttribute('data-level')`))
console.log('  suites in index =', await ev(`document.querySelectorAll('[data-bay-list] button').length`))
await ev(`(() => { const b=[...document.querySelectorAll('[data-bldg-index] button')].find(x=>x.dataset.bldgBtn==='03'); b&&b.click(); })()`); await sleep(2500)
console.log('  after selecting 03: level =', await ev(`document.querySelector('[data-compound]').getAttribute('data-level')`),
  ' bays listed =', await ev(`document.querySelectorAll('[data-bay-list] button').length`))
console.log('  console errors:', errs.length ? errs : 'none')
process.exit(0)
