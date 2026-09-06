import { connect, sleep } from './cdp.mjs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable')
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/audit/scene-audit.html' })
for (let i = 0; i < 40; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: 'window.__ready === true', returnByValue: true }); if (r.result?.value) break }
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text); return r.result?.value }

console.log(await ev(`(() => {
  const C = window.__compound, out = [];
  const U = 0.7507;                 /* units per foot, from compound3d */
  /* Group suites by their run: same building AND same angle, then order along the axis. */
  const rows = new Map();
  for (const s of C.suites) {
    const k = s.building + '@' + s.ang.toFixed(2);
    if (!rows.has(k)) rows.set(k, []);
    rows.get(k).push(s);
  }
  for (const [k, list] of rows) {
    const r = (list[0].ang * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r);
    const proj = list.map(s => ({ s, u: s.cx * c + s.cy * sn })).sort((a,b) => a.u - b.u);
    if (proj.length < 2) continue;
    const pitch = proj[1].u - proj[0].u;
    const w = proj[0].s.w;                     /* the bay's own length along the run */
    const drawn = w * 0.94;                    /* compound3d scales it again */
    const gap = pitch - drawn;
    out.push({
      run: k, bays: proj.length,
      pitch_ft: +(pitch / U).toFixed(2),
      bayDrawn_ft: +(drawn / U).toFixed(2),
      gap_ft: +(gap / U).toFixed(2),
      gapPctOfPitch: +((gap / pitch) * 100).toFixed(1),
      depth_drawn_ft: +((proj[0].s.dep * 0.96) / U).toFixed(2),
    });
  }
  return JSON.stringify(out, null, 1);
})()`))

console.log('\n=== THE 84x84 BLACK PLANE ===')
console.log(await ev(`(() => {
  const T = window.__THREE; let found = null;
  window.__gl.scene.traverse(o => { if (o.isMesh && o.material && o.material.type === 'ShadowMaterial') found = o; });
  if (!found) return 'no ShadowMaterial mesh';
  const b = new T.Box3().setFromObject(found), s = b.getSize(new T.Vector3());
  /* the plinth, for comparison */
  let slab = null;
  window.__gl.scene.traverse(o => { if (o.isMesh && o.geometry?.type === 'ExtrudeGeometry' && !slab) slab = o; });
  const sb = slab ? new T.Box3().setFromObject(slab) : null, ss = sb ? sb.getSize(new T.Vector3()) : null;
  return JSON.stringify({
    shadowPlane: { size: [+s.x.toFixed(1), +s.z.toFixed(1)], y: +b.max.y.toFixed(3), receiveShadow: found.receiveShadow, opacity: found.material.opacity },
    plinth: ss ? { size: [+ss.x.toFixed(1), +ss.z.toFixed(1)], topY: +sb.max.y.toFixed(3) } : null,
    planeOverhangsPlinthBy: ss ? +(((s.x - ss.x) / 2)).toFixed(1) + ' units each side' : null,
  }, null, 1);
})()`))
process.exit(0)
