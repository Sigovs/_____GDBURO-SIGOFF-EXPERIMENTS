/* BLACK-OBJECT AUDIT BY ISOLATION.
   Every dark mesh class visible from the authored compound camera is hidden in turn and
   the frame captured, so each object is judged on what the screen does — not on what its
   constructor is called. */
import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'

const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find((x) => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1.5, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 60; i++) {
  await sleep(600)
  const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true })
  if (r.result?.value) break
}
await sleep(7000)
const ev = async (e) => (await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value
await ev(`document.getElementById('dock').style.display='none'; document.querySelector('.home').style.display='none'`)
fs.mkdirSync('exploration/audit/black', { recursive: true })
const shot = async (n) => {
  await sleep(900)
  const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 })
  fs.writeFileSync('exploration/audit/black/' + n + '.jpeg', Buffer.from(r.data, 'base64'))
  console.log('   wrote', n)
}

/* every distinct dark class currently on screen, with a count */
console.log(await ev(`(() => {
  const gl = window.__v5.gl, by = {};
  gl.scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m || !m.color) return;
    const hx = m.color.getHexString();
    const lum = parseInt(hx.slice(0,2),16)*.299 + parseInt(hx.slice(2,4),16)*.587 + parseInt(hx.slice(4,6),16)*.114;
    if (lum > 45) return;
    const k = '#' + hx + '  ' + o.geometry.type + '  scale=' + [o.scale.x,o.scale.y,o.scale.z].map(v=>v.toFixed(2)).join('/');
    by[k] = (by[k] || 0) + 1;
  });
  return 'DARK CLASSES ON SCREEN:\\n' + Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,n]) => '   ' + String(n).padStart(4) + '  ' + k).join('\\n');
})()`))

const hide = (test, on) => ev(`(() => { let n=0; window.__v5.gl.scene.traverse(o => { if(!o.isMesh) return;
  const m = Array.isArray(o.material)?o.material[0]:o.material; const col = m&&m.color ? '#'+m.color.getHexString() : '';
  const sc = o.scale, geo = o.geometry.type;
  if (${test}) { o.visible = ${on}; n++ } }); return n })()`)

await shot('00-baseline')
const cases = [
  ['gate-beam-and-plate', `col === '#1c222a' && sc.y < 6 && sc.x > 20`],
  ['unit-plaques',        `col === '#161b21' && sc.y < 1.2 && sc.x < 1.6`],
  ['civic-head-cill',     `col === '#39424d' && sc.y < 1.2`],
  ['all-trim',            `col === '#161b21'`],
  ['door-leaves',         `col === '#1b222b'`],
]
for (const [name, test] of cases) {
  const n = await hide(test, 'false')
  await shot('hide-' + name + '-n' + n)
  await hide(test, 'true')
}
process.exit(0)
