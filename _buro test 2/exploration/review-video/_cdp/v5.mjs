import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
const errs = []
cdp.on('Log.entryAdded', p => { if (p.entry.level === 'error') errs.push(p.entry.text.slice(0,150)) })
cdp.on('Runtime.exceptionThrown', p => errs.push((p.exceptionDetails.exception?.description||p.exceptionDetails.text).slice(0,220)))
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 50; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(7000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text); return r.result?.value }
const shot = async (n) => { const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 })
  fs.writeFileSync(`exploration/study/shots/${n}.jpeg`, Buffer.from(r.data, 'base64')); console.log('  ', n) }

await shot('Y1-COMPOUND-REST')
console.log('parapet light at rest (must be hidden):', await ev("document.getElementById('edge').hidden"))
await ev(`window.__v5.hoverBuilding(window.__v5.compound.byNum.get('03'))`); await sleep(1500); await shot('Y2-BUILDING-HOVER')
await ev(`window.__v5.selectBuilding(window.__v5.compound.byNum.get('03'))`); await sleep(4000); await shot('Y3-BUILDING-SELECTED')
await ev(`window.__v5.hoverSuite(window.__v5.S.building.suites.filter(s=>!s.sold)[10])`); await sleep(1400); await shot('Y4-SUITE-HOVER')
await ev(`window.__v5.selectSuite(window.__v5.S.building.suites.filter(s=>!s.sold)[10])`); await sleep(4000); await shot('Y5-SUITE-SELECTED')
await ev(`(() => { const g=document.querySelector('.enter'); g.style.background='var(--red)';
  g.style.filter='brightness(1.12)'; })()`); await sleep(700); await shot('Y6-ENTER-READY')
const keep = await ev(`window.__v5.S.level + '/' + (window.__v5.S.suite ? window.__v5.S.suite.ref : '-')`)
await ev('window.__v5.openPlan()'); await sleep(1800); await shot('Y7-SITE-PLAN')
await ev(`window.__v5.closePlan()`); await sleep(1800); await shot('Y8-BACK-FROM-PLAN')
console.log('state before plan:', keep)
console.log('state after exit :', await ev(`window.__v5.S.level + '/' + (window.__v5.S.suite ? window.__v5.S.suite.ref : '-')`))
console.log('console errors:', errs.length ? errs : 'none')
process.exit(0)
