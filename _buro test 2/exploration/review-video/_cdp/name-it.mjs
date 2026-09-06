import { connect, sleep } from './cdp.mjs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/d-hybrid-interactive.html' })
for (let i = 0; i < 40; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__gl', returnByValue: true }); if (r.result?.value) break }
await sleep(5000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text); return r.result?.value }

console.log(await ev(`(() => {
  const gl = window.__gl, cam = gl.camera;
  const P = (v) => { const c = v.clone().project(cam);
    return [Math.round((c.x*0.5+0.5)*1440), Math.round((-c.y*0.5+0.5)*900)]; };
  const out = { aprons: [], glass: [], grass: [], civic: [] };
  gl.scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m || !m.color) return;
    const h = '#' + m.color.getHexString();
    const wp = o.getWorldPosition(new cam.position.constructor());
    const scr = P(wp);
    const sc = o.scale;
    const rec = { screen: scr, world: [+wp.x.toFixed(2), +wp.y.toFixed(2), +wp.z.toFixed(2)],
                  scale: [+sc.x.toFixed(2), +sc.y.toFixed(2), +sc.z.toFixed(2)], geo: o.geometry.type };
    if (h === '#363d45' && o.geometry.type === 'PlaneGeometry') out.aprons.push(rec);
    else if (h === '#0b1119') out.glass.push(rec);
    else if (h === '#10150f') out.grass.push(rec);
    else if (h === '#7b8794') out.civic.push(rec);
  });
  return JSON.stringify(out, null, 1);
})()`))
process.exit(0)
