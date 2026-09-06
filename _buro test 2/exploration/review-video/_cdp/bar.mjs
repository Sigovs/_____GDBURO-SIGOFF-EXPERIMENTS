import { connect, sleep } from './cdp.mjs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v3-live-product.html' })
for (let i = 0; i < 50; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v3', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => (await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value
/* the crop was x 430..990, y 90..440 of the 1440x900 frame — hunt wide, thin, dark there */
console.log(await ev(`(() => {
  const gl = window.__v3.gl, cam = gl.camera, W=1440, H=900, V = cam.position.constructor, out=[];
  gl.scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const g=o.geometry; if(!g.boundingBox) g.computeBoundingBox();
    const bb=g.boundingBox; let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9,behind=false;
    for (const sx of [bb.min.x,bb.max.x]) for (const sy of [bb.min.y,bb.max.y]) for (const sz of [bb.min.z,bb.max.z]) {
      const p=new V(sx,sy,sz); o.localToWorld(p); p.project(cam); if(p.z>1) behind=true;
      const X=(p.x*.5+.5)*W, Y=(-p.y*.5+.5)*H;
      minx=Math.min(minx,X);maxx=Math.max(maxx,X);miny=Math.min(miny,Y);maxy=Math.max(maxy,Y);
    }
    if(behind) return;
    const w=maxx-minx, h=maxy-miny;
    if (h > 34 || w < 60) return;                        /* wide and thin only */
    if (maxx < 380 || minx > 1000 || maxy < 80 || miny > 460) return;
    const m = Array.isArray(o.material)?o.material[0]:o.material;
    out.push({ col:'#'+(m&&m.color?m.color.getHexString():'?'), geo:o.geometry.type,
      scale:[o.scale.x,o.scale.y,o.scale.z].map(v=>+v.toFixed(2)),
      rect:[Math.round(minx),Math.round(miny),Math.round(w),Math.round(h)] });
  });
  return JSON.stringify(out.sort((a,b)=>b.rect[2]-a.rect[2]).slice(0,8), null, 1);
})()`))
process.exit(0)
