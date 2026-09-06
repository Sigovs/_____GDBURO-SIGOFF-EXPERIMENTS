import { connect, sleep } from './cdp.mjs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
cdp.on('Runtime.exceptionThrown', p => console.log('[exc]', (p.exceptionDetails.exception?.description||'').slice(0,200)))
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/audit/scene-audit.html' })
for (let i = 0; i < 40; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: 'window.__ready === true', returnByValue: true }); if (r.result?.value) break }
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
console.log('=== BAY GEOMETRY (the facade question) ===')
console.table(await ev('window.__gaps()'))
console.log('\n=== LARGE NON-SUITE MESHES, biggest footprint first ===')
const orph = await ev('window.__orphans()')
for (const o of orph.slice(0, 14)) console.log(' ', String(o.area).padStart(7), o.geo.padEnd(17), o.col, 'size', JSON.stringify(o.size).padEnd(22), 'ctr', JSON.stringify(o.ctr).padEnd(24), o.touchesAMass ? 'touches a mass' : 'FREE-STANDING')
console.log('\n=== MESH CENSUS BY KIND ===')
const rows = await ev('window.__dump()')
const by = {}
for (const r of rows) { const k = (r.kind || r.geo) + ' / ' + r.col; by[k] = (by[k] || 0) + 1 }
for (const [k, n] of Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0, 22)) console.log('  ' + String(n).padStart(5), k)
console.log('\ntotal meshes:', rows.length, ' invisible:', rows.filter(r => !r.vis).length)
process.exit(0)
