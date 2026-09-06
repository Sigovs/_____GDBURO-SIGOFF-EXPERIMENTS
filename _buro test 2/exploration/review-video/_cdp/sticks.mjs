import { connect, sleep } from './cdp.mjs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable')
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v3-live-product.html' })
for (let i = 0; i < 50; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v3', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => (await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value
console.log(await ev(`(() => {
  const gl = window.__v3.gl, V = gl.camera.position.constructor, out = {};
  gl.scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const s = o.scale, tall = s.y, thin = Math.min(s.x, s.z), wide = Math.max(s.x, s.z);
    if (tall < 6 || thin > 1.2 || tall / Math.max(0.01, wide) < 3) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    const k = (o.userData?.kind || 'none') + ' #' + (m && m.color ? m.color.getHexString() : '?') +
      ' scale=' + [s.x, s.y, s.z].map(v => v.toFixed(2)).join('/');
    out[k] = (out[k] || 0) + 1;
  });
  return JSON.stringify(out, null, 1);
})()`))
process.exit(0)
