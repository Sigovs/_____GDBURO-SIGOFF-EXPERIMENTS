/* THE MANUAL MATRIX, driven by REAL pointer events into the canvas — not by calling the
   state machine. A building counts as selectable only if a raster of the compound camera
   finds a point where it hovers, and a real click at that point commits it. */
import { connect, sleep } from './cdp.mjs'

const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find((x) => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 60; i++) {
  await sleep(600)
  const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true })
  if (r.result?.value) break
}
await sleep(7000)
const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
const move = (x, y) => cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
const click = async (x, y) => {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 })
  await sleep(90)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 })
}
const hoverNum = () => ev(`window.__v5.S.hover ? window.__v5.S.hover.num : null`)
const level = () => ev(`window.__v5.S.level`)
const selNum = () => ev(`window.__v5.S.building ? window.__v5.S.building.num : null`)

const declared = await ev(`window.__v5.compound.data.totals.buildings`)
const built = await ev(`window.__v5.compound.buildings.map(b => b.num)`)
console.log('declared in data.totals.buildings :', declared)
console.log('buildings actually built          :', built.join(', '), '  (' + built.length + ')')
console.log('MISSING FROM THE MODEL ENTIRELY   :',
  ['01','02','03','04','05','06','07','08','09','10','11'].filter(n => !built.includes(n)).join(', ') || 'none')
console.log('')

/* Land on the canonical home pose BEFORE rastering, so every coordinate the test takes
   is measured at the view every later overview returns to. */
await ev('window.__v5.overview()'); await sleep(2200)
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 420, buttons: 0 }); await sleep(400)

/* raster the compound camera for a hover point per building */
const spots = new Map()
for (let y = 130; y <= 780; y += 18) {
  for (let x = 90; x <= 1380; x += 18) {
    await move(x, y)
    await sleep(4)
    const n = await hoverNum()
    if (n && !spots.has(n)) spots.set(n, [x, y])
    if (x === 90) { const c = await ev("(() => { const gl=window.__v5.gl,cm=gl.camera,V=cm.position.constructor; let sx=0,sy=0,k=0; gl.site.traverse(o=>{ if(o.isMesh&&o.userData?.kind==='suite'&&o.userData.building==='03'){ const q=o.getWorldPosition(new V()); q.project(cm); sx+=(q.x*.5+.5)*1440; sy+=(-q.y*.5+.5)*900; k++ } }); return Math.round(sx/k)+','+Math.round(sy/k)+' rot'+gl.site.rotation.y.toFixed(4); })()"); console.log('   raster row y=' + y + '  b03 centroid ' + c) }
  }
  if (spots.size >= built.length) break
}
console.log('HOVER RASTER — buildings that answered a real pointer:')
for (const n of built) console.log('   ' + n + '  ' + (spots.has(n) ? 'HOVER OK  at ' + spots.get(n).join(',') : 'NO HOVER POINT FOUND'))
console.log('')

console.log('CLICK MATRIX — hover, click, verify, return to overview:')
const rows = []
for (const n of built) {
  /* One raster, then clicks. Valid now that the compound holds still while the pointer
     is inside it — which is the fix being tested. */
  const p = spots.get(n)
  if (!p) { rows.push([n, 'hover FAIL', 'click SKIP']); continue }
  await move(p[0] - 6, p[1] - 6); await sleep(60)
  await move(p[0], p[1]); await sleep(300)
  const h = await hoverNum()
  await click(p[0], p[1]); await sleep(1500)
  const lv = await level(), sn = await selNum()
  rows.push([n, h === n ? 'hover OK' : 'hover ' + h, (lv === 'building' && sn === n) ? 'click OK' : 'click FAIL(' + lv + '/' + sn + ')'])
  await ev('window.__v5.overview()'); await sleep(1800)
  const back = await level()
  const pos = await ev("(() => { const gl=window.__v5.gl,c=gl.camera,V=c.position.constructor; let sx=0,sy=0,n=0; gl.site.traverse(o=>{ if(o.isMesh&&o.userData?.kind==='suite'&&o.userData.building==='03'){ const p=o.getWorldPosition(new V()); p.project(c); sx+=(p.x*.5+.5)*1440; sy+=(-p.y*.5+.5)*900; n++ } }); return Math.round(sx/n)+','+Math.round(sy/n); })()")
  rows[rows.length-1].push('after-overview level=' + back + ' b03@' + pos)
}
for (const r of rows) console.log('   ' + r[0] + '  ' + r[1].padEnd(12) + r[2].padEnd(30) + (r[3]||''))

/* adjacent transfer: hover one, move straight to the next, no stale target */
console.log('')
console.log('HOVER TRANSFER between adjacent pairs:')
const list = built.filter(n => spots.has(n))
for (let i = 0; i + 1 < list.length; i++) {
  const a = spots.get(list[i]), b = spots.get(list[i + 1])
  await move(a[0], a[1]); await sleep(220)
  const h1 = await hoverNum()
  await move(b[0], b[1]); await sleep(220)
  const h2 = await hoverNum()
  console.log('   ' + list[i] + ' -> ' + list[i + 1] + '  ' +
    (h1 === list[i] && h2 === list[i + 1] ? 'OK' : 'STALE (' + h1 + ' -> ' + h2 + ')'))
}
process.exit(0)
