import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
const errs = []
cdp.on('Log.entryAdded', p => { if (p.entry.level === 'error') errs.push(p.entry.text.slice(0,150)) })
cdp.on('Runtime.exceptionThrown', p => errs.push((p.exceptionDetails.exception?.description||p.exceptionDetails.text).slice(0,220)))
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v4-guided-experience.html' })
for (let i = 0; i < 50; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v4', returnByValue: true }); if (r.result?.value) break }
await sleep(7000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text); return r.result?.value }
const shot = async (n) => { const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 })
  fs.writeFileSync(`exploration/study/shots/${n}.jpeg`, Buffer.from(r.data, 'base64')); console.log('  ', n) }

await shot('X1-COMPOUND-REST')
console.log('leaders at rest (must be 0 visible):', await ev(`document.getElementById('leaders').hidden ? 0 : 1`))
await ev(`window.__v4.hoverBuilding(window.__v4.compound.byNum.get('03'))`); await sleep(1500); await shot('X2-BUILDING-HOVER')
await ev(`window.__v4.selectBuilding(window.__v4.compound.byNum.get('03'))`); await sleep(4000); await shot('X3-BUILDING-SELECTED')
await ev(`window.__v4.hoverSuite(window.__v4.state.building.suites.filter(s=>!s.sold)[10])`); await sleep(1400); await shot('X4-SUITE-HOVER')
await ev(`window.__v4.selectSuite(window.__v4.state.building.suites.filter(s=>!s.sold)[10])`); await sleep(4000); await shot('X5-SUITE-SELECTED')
await ev(`(() => { const g=document.getElementById('go'); g.style.background='var(--red)';
  g.querySelector('.go__t').style.color='#fff'; g.querySelector('.go__a').style.color='#fff'; })()`); await sleep(700); await shot('X6-ENTER-READY')
const keep = await ev(`window.__v4.state.level + '/' + (window.__v4.state.suite ? window.__v4.state.suite.ref : '-')`)
await ev(`window.__v4.openPlan()`); await sleep(1800); await shot('X7-SITE-PLAN')
await ev(`window.__v4.closePlan()`); await sleep(1800); await shot('X8-BACK-FROM-PLAN')
console.log('state before plan:', keep)
console.log('state after exit :', await ev(`window.__v4.state.level + '/' + (window.__v4.state.suite ? window.__v4.state.suite.ref : '-')`))
console.log('console errors:', errs.length ? errs : 'none')
process.exit(0)
