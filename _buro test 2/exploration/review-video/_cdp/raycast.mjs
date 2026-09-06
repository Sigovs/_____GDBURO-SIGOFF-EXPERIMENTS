import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/d-hybrid-interactive.html' })
for (let i = 0; i < 40; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__gl', returnByValue: true }); if (r.result?.value) break }
await sleep(5000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text); return r.result?.value }

/* Screenshot first so the raycast targets can be chosen against what is really on screen. */
const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94 })
fs.writeFileSync('exploration/audit/SCENE-lit.jpeg', Buffer.from(shot.data, 'base64'))
console.log('wrote exploration/audit/SCENE-lit.jpeg')

/* WHAT IS UNDER EVERY PIXEL OF A GRID — a census of what the camera can actually see,
   so an artifact is named by object rather than pointed at in a picture. */
console.log(await ev(`(() => {
  const gl = window.__gl;
  const T = Object.getPrototypeOf(gl.scene).constructor;   /* reach THREE via the scene */
  const ray = new (gl.camera.constructor.prototype.constructor === Object ? Object : Object)();
  return 'ok';
})()`))
console.log(await ev(`(() => {
  const gl = window.__gl, cam = gl.camera, root = gl.site || gl.root || gl.scene;
  const seen = new Map();
  const RC = gl.scene.children.length;
  /* Build a raycaster from three.js via an existing object's constructor chain is fragile;
     instead project every mesh centre to screen space and report what lands where. */
  const out = [];
  gl.scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m || !m.color) return;
    const v = o.getWorldPosition(new cam.position.constructor());
    v.project(cam);
    if (v.z > 1) return;
    const x = Math.round((v.x * 0.5 + 0.5) * 1440), y = Math.round((-v.y * 0.5 + 0.5) * 900);
    if (x < 0 || x > 1440 || y < 0 || y > 900) return;
    out.push({ x, y, col: '#' + m.color.getHexString(), geo: o.geometry.type, kind: o.userData?.kind || null });
  });
  /* group the darkest things, which is what the eye is calling an artifact */
  const dark = out.filter(o => parseInt(o.col.slice(1), 16) < 0x151515);
  const by = {};
  for (const d of dark) by[d.col + ' ' + d.geo] = (by[d.col + ' ' + d.geo] || 0) + 1;
  return JSON.stringify({ onScreenMeshes: out.length, darkOnScreen: dark.length, byKind: by, sampleDark: dark.slice(0, 10) }, null, 1);
})()`))
process.exit(0)
