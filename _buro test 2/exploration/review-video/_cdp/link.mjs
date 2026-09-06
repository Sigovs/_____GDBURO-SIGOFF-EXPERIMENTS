/* DOES HOVERING A MINI BAY LIGHT ITS REAL DOOR?
   Hovers each of four cases with a real pointer and reports, for each, whether the state
   took it and whether the door / glazing / lamp / apron light of THAT suite actually
   changed on the model. Section 9 of the brief is a yes-or-no question and this answers
   it by reading the scene, not by reading the code. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 60; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(5500)
const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
const move = (x, y) => cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
const click = async (x, y) => {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 })
  await sleep(70)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 })
}

/* a building with premium, standard and sold all present */
const num = await ev(`(() => { const b = window.__v5.compound.buildings.find(b =>
  b.suites.some(s=>s.type==='A'&&!s.sold) && b.suites.some(s=>s.type==='B'&&!s.sold) && b.suites.some(s=>s.sold))
  return b ? b.num : window.__v5.compound.buildings[0].num })()`)
console.log('testing in building ' + num)
await ev(`window.__v5.selectBuilding(window.__v5.compound.byNum.get('${num}'))`)
await sleep(1800)

/* read the model's own answer for one suite index */
const readDoor = (idx) => ev(`(() => {
  const gl = window.__v5.gl
  let out = null
  gl.site.traverse(o => {
    if (o.userData && o.userData.kind === 'suite' && o.userData.index === ${idx}) {
      const p = o.parent
      /* the door, glaze and lamp of this bay are its siblings, built next to it */
    }
  })
  const api = gl
  const B = null
  return null
})()`)

const cases = [['A', false], ['B', false], ['B', true], ['A', true]]
for (const [type, sold] of cases) {
  const pt = await ev(`(() => {
    const bs = [...document.querySelectorAll('[data-bays] .bay')].filter(b => b.dataset.type === '${type}' && b.dataset.sold === '${sold}')
    if (!bs.length) return null
    const r = bs[0].getBoundingClientRect()
    return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2), bs[0].getAttribute('aria-label')] })()`)
  if (!pt) { console.log('  ' + type + (sold ? ' sold    ' : ' available') + '   NONE IN THIS BUILDING'); continue }
  await move(700, 300); await sleep(120)
  await move(pt[0], pt[1]); await sleep(450)
  const st = await ev(`(() => { const S = window.__v5.S
    const gl = window.__v5.gl
    const hs = S.hoverSuite
    let doorMat = null, lampMat = null, glazeMat = null, apron = null
    if (hs) {
      const o = gl.bayOf ? gl.bayOf(hs.index) : null
      if (o) { doorMat = '#' + o.door.material.color.getHexString()
        lampMat = '#' + o.lamp.material.color.getHexString()
        glazeMat = '#' + o.glaze.material.color.getHexString() }
    }
    gl.site.traverse(o => { if (o.isPointLight && o.color.getHexString() === 'ffd9ab') apron = o.intensity })
    return { hover: hs ? hs.ref : null, type: hs ? hs.type : null, doorMat, lampMat, glazeMat, apron } })()`)
  console.log('  ' + type + (sold ? ' sold     ' : ' available') + '  ->  state ' + JSON.stringify(st) + '   label: ' + pt[2])
}

/* and the selection */
const pick = await ev(`(() => { const bs=[...document.querySelectorAll('[data-bays] .bay')].filter(b=>b.dataset.sold!=='true')
  const r=bs[1].getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
await move(pick[0], pick[1]); await sleep(200); await click(pick[0], pick[1]); await sleep(1600)
console.log('after click: ' + JSON.stringify(await ev(`(() => { const S=window.__v5.S; const gl=window.__v5.gl
  let apron=0, focus=0; gl.site.traverse(o=>{ if(o.isPointLight){ const h=o.color.getHexString(); if(h==='ffd9ab') apron=o.intensity; if(h==='cfe0ee') focus=o.intensity } })
  return { level:S.level, suite:S.suite?S.suite.ref:null, apronLight:apron, focusLight:focus,
    enterVisible: !!document.querySelector('[data-enter]') } })()`)))
process.exit(0)
