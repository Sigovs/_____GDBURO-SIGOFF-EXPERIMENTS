import { connect, sleep } from './cdp.mjs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 60; i++) { await sleep(600); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => (await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value
const move = (x,y) => cdp.send('Input.dispatchMouseEvent', { type:'mouseMoved', x, y, buttons:0 })
const probe = () => ev(`(() => { const gl=window.__v5.gl, c=gl.camera;
  const b=window.__v5.compound.buildings.find(x=>x.num==='03');
  const V=c.position.constructor; let sx=0,sy=0,n=0;
  gl.site.traverse(o=>{ if(o.isMesh&&o.userData?.kind==='suite'&&o.userData.building==='03'){
    const p=o.getWorldPosition(new V()); p.project(c); sx+=(p.x*.5+.5)*1440; sy+=(-p.y*.5+.5)*900; n++ } });
  return { rotY:+gl.site.rotation.y.toFixed(4), camX:+c.position.x.toFixed(3), camY:+c.position.y.toFixed(3), camZ:+c.position.z.toFixed(3),
    b03:[Math.round(sx/n), Math.round(sy/n)] }; })()`)
await move(700, 400)
console.log('pointer parked inside the canvas; sampling every 2s:')
for (let i = 0; i < 6; i++) { console.log('  ', JSON.stringify(await probe())); await sleep(2000) }
console.log('now moving the pointer around inside the canvas:')
for (let i = 0; i < 4; i++) { await move(400 + i*120, 300 + i*40); await sleep(1500); console.log('  ', JSON.stringify(await probe())) }
process.exit(0)
