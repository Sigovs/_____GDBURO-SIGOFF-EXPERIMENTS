import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
const errs = []
cdp.on('Log.entryAdded', p => { if (p.entry.level === 'error') errs.push(p.entry.text.slice(0,150)) })
cdp.on('Runtime.exceptionThrown', p => errs.push((p.exceptionDetails.exception?.description||p.exceptionDetails.text).slice(0,220)))
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v3-live-product.html' })
for (let i = 0; i < 50; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v3', returnByValue: true }); if (r.result?.value) break }
await sleep(7000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text); return r.result?.value }
fs.mkdirSync('exploration/study/shots', { recursive: true })
const shot = async (n) => { const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
  fs.writeFileSync(`exploration/study/shots/${n}.jpeg`, Buffer.from(r.data, 'base64')); console.log('  ', n) }

console.log('leaders drawn:', await ev(`document.querySelectorAll('#tags .tag').length`))
await shot('W1-COMPOUND-REST')
await ev(`window.__v3.hoverBuilding(window.__v3.compound.byNum.get('03'))`); await sleep(1600)
await shot('W2-BUILDING-HOVER')
await ev(`window.__v3.selectBuilding(window.__v3.compound.byNum.get('03'))`); await sleep(3800)
await shot('W3-BUILDING-SELECTED')
await ev(`window.__v3.hoverSuite(window.__v3.state.building.suites.filter(s=>!s.sold)[10])`); await sleep(1400)
await shot('W4-SUITE-HOVER')
await ev(`window.__v3.selectSuite(window.__v3.state.building.suites.filter(s=>!s.sold)[10])`); await sleep(3800)
await shot('W5-SUITE-SELECTED')
await ev(`(() => { const g=document.getElementById('go'); g.dispatchEvent(new MouseEvent('mouseover',{bubbles:true})); g.classList.add('is-hover'); })()`)
await ev(`document.getElementById('go').style.background='var(--red)';
  document.querySelector('#go .go__t').style.color='#fff'; document.querySelector('#go .go__a').style.color='#fff';`)
await sleep(900); await shot('W6-ENTER-READY')
console.log('state:', await ev(`window.__v3.state.level + ' / ' + (window.__v3.state.suite ? window.__v3.state.suite.ref : '-')`))
console.log('console errors:', errs.length ? errs : 'none')
process.exit(0)
