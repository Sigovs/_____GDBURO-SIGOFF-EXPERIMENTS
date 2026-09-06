/* Every dark mesh visible from the AUTHORED COMPOUND CAMERA, by projected screen area.
   A thing a visitor sees as an artifact has to be named as an object before it is judged. */
import { connect, sleep } from './cdp.mjs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v3-live-product.html' })
for (let i = 0; i < 50; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v3', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text); return r.result?.value }
console.log(await ev(`(() => {
  const gl = window.__v3.gl, cam = gl.camera, W = 1440, H = 900;
  const V = cam.position.constructor;
  const out = [];
  gl.scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m || !m.color) return;
    const hx = m.color.getHexString();
    const lum = (parseInt(hx.slice(0,2),16)*.299 + parseInt(hx.slice(2,4),16)*.587 + parseInt(hx.slice(4,6),16)*.114);
    if (lum > 32) return;                       /* only the things reading as black */
    /* project the 8 corners of the world box to get a real screen footprint */
    const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox; let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9,behind=false;
    for (const sx of [bb.min.x, bb.max.x]) for (const sy of [bb.min.y, bb.max.y]) for (const sz of [bb.min.z, bb.max.z]) {
      const p = new V(sx, sy, sz); o.localToWorld(p); p.project(cam);
      if (p.z > 1) behind = true;
      const X = (p.x*.5+.5)*W, Y = (-p.y*.5+.5)*H;
      minx=Math.min(minx,X); maxx=Math.max(maxx,X); miny=Math.min(miny,Y); maxy=Math.max(maxy,Y);
    }
    if (behind) return;
    const w = maxx-minx, h = maxy-miny, area = w*h;
    if (area < 700) return;
    if (maxx < 0 || minx > W || maxy < 0 || miny > H) return;
    out.push({ col:'#'+hx, geo:o.geometry.type, kind:o.userData?.kind||null, of:o.userData?.of||null,
      area:Math.round(area), rect:[Math.round(minx),Math.round(miny),Math.round(w),Math.round(h)],
      aspect:+(Math.max(w,h)/Math.max(1,Math.min(w,h))).toFixed(1) });
  });
  out.sort((a,b)=>b.area-a.area);
  return JSON.stringify(out.slice(0, 16), null, 1);
})()`))
process.exit(0)
