/* BEFORE/AFTER captures at the three AUTHORED camera poses, so the two sets are
   comparable frame for frame. Run with a prefix: node ba.mjs BEFORE | AFTER */
import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'
const TAG = process.argv[2] || 'BEFORE'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/d-hybrid-interactive.html' })
for (let i = 0; i < 50; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__gl', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text); return r.result?.value }
fs.mkdirSync('exploration/audit/ba', { recursive: true })
/* hide the prototype's own console so the comparison is of the MODEL only */
await ev(`(() => { const s=document.getElementById('sill'); if (s) s.style.display='none';
  document.querySelectorAll('.cal, .mark').forEach(n => n.style.display='none'); })()`)
const shot = async (n, clip) => {
  const r = await cdp.send('Page.captureScreenshot', clip ? { format: 'jpeg', quality: 93, clip } : { format: 'jpeg', quality: 93 })
  fs.writeFileSync(`exploration/audit/ba/${TAG}-${n}.jpeg`, Buffer.from(r.data, 'base64')); console.log('  ', TAG + '-' + n)
}
await sleep(1500); await shot('1-compound')
await shot('2-civic-crop', { x: 430, y: 90, width: 560, height: 350, scale: 2 })
await ev(`window.__d.selectBuilding(window.__d.compound.byNum.get('03'))`); await sleep(3500)
await shot('3-building03')
await ev(`window.__d.selectSuite(window.__d.compound.byNum.get('03').suites.filter(x=>!x.sold)[10])`); await sleep(3500)
await shot('4-suite-bays')
await shot('5-bays-crop', { x: 300, y: 330, width: 700, height: 400, scale: 2 })
process.exit(0)
