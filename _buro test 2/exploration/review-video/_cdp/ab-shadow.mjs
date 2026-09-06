import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/d-hybrid-interactive.html' })
for (let i = 0; i < 40; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__gl', returnByValue: true }); if (r.result?.value) break }
await sleep(5000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true }); return r.exceptionDetails ? 'ERR ' + (r.exceptionDetails.exception?.description||'').slice(0,90) : r.result?.value }
const shot = async (n) => { const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94 });
  fs.writeFileSync(`exploration/audit/${n}.jpeg`, Buffer.from(r.data, 'base64')); console.log('wrote', n) }

console.log('shadow plane hidden:', await ev(`(() => { let n=0; window.__gl.scene.traverse(o => { if (o.isMesh && o.material?.type === 'ShadowMaterial') { o.visible = false; n++; } }); return n; })()`))
await sleep(1500); await shot('AB-1-no-shadowplane')
console.log('shadow plane restored:', await ev(`(() => { let n=0; window.__gl.scene.traverse(o => { if (o.isMesh && o.material?.type === 'ShadowMaterial') { o.visible = true; n++; } }); return n; })()`))
await sleep(1500)
console.log('aprons hidden:', await ev(`(() => { let n=0; window.__gl.scene.traverse(o => { const m = Array.isArray(o.material)?o.material[0]:o.material;
  if (o.isMesh && o.geometry?.type === 'PlaneGeometry' && m?.color && '#'+m.color.getHexString() === '#363d45') { o.visible = false; n++; } }); return n; })()`))
await sleep(1500); await shot('AB-2-no-aprons')
process.exit(0)
