import { connect, sleep } from './cdp.mjs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable')
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/audit/scene-audit.html' })
for (let i = 0; i < 40; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: 'window.__ready === true', returnByValue: true }); if (r.result?.value) break }
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text); return r.result?.value }

console.log(await ev(`(() => {
  const T = window.__THREE, gl = window.__gl;
  /* Everything that is NOT a suite mass, grouped by colour, with the extremes of its
     world box — enough to find a bar sticking out of a building. */
  const groups = new Map();
  gl.scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    if (o.userData?.kind === 'suite') return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m || !m.color) return;
    const key = '#' + m.color.getHexString() + ' ' + o.geometry.type;
    const b = new T.Box3().setFromObject(o), s = b.getSize(new T.Vector3()), c = b.getCenter(new T.Vector3());
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ s: [s.x, s.y, s.z], c: [c.x, c.y, c.z], longest: Math.max(s.x, s.y, s.z), aspect: Math.max(s.x,s.y,s.z) / Math.max(0.001, Math.min(s.x,s.y,s.z)) });
  });
  const out = [];
  for (const [k, arr] of groups) {
    arr.sort((a,b) => b.longest - a.longest);
    const worst = arr[0];
    out.push({ key: k, n: arr.length,
      longestSpan: +worst.longest.toFixed(2),
      worstAspect: +worst.aspect.toFixed(0),
      worstSize: worst.s.map(v => +v.toFixed(2)),
      worstCtr: worst.c.map(v => +v.toFixed(2)) });
  }
  return JSON.stringify(out.sort((a,b) => b.longestSpan - a.longestSpan).slice(0, 14), null, 1);
})()`))

console.log('\n=== CIVIC / GLASS MESHES (clubhouse + dealership) ===')
console.log(await ev(`(() => {
  const T = window.__THREE, gl = window.__gl, out = [];
  gl.scene.traverse(o => {
    if (!o.isMesh) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m || !m.color) return;
    const h = '#' + m.color.getHexString();
    if (h !== '#0b1119' && h !== '#7b8794') return;
    const b = new T.Box3().setFromObject(o), s = b.getSize(new T.Vector3()), c = b.getCenter(new T.Vector3());
    out.push({ col: h, size: [+s.x.toFixed(2), +s.y.toFixed(2), +s.z.toFixed(2)], ctr: [+c.x.toFixed(2), +c.y.toFixed(2), +c.z.toFixed(2)], minY: +b.min.y.toFixed(2) });
  });
  return JSON.stringify(out, null, 1);
})()`))
process.exit(0)
