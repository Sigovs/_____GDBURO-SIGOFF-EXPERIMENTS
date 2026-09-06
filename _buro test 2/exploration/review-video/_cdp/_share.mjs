import { connect, sleep } from './cdp.mjs'
const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find(x => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable'); await cdp.send('Log.enable')
const errs = []
cdp.on('Log.entryAdded', p => { if (p.entry.level === 'error') errs.push(p.entry.text.slice(0,120)) })
cdp.on('Runtime.exceptionThrown', p => errs.push((p.exceptionDetails.exception?.description||p.exceptionDetails.text).slice(0,160)))
const ev = async (e) => (await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value
for (const [w, h, floorC, floorB, floorS] of [[1440,900,80,77,75],[1280,800,80,77,75],[1680,1050,80,77,75]]) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
  await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/d-hybrid-interactive.html' })
  await sleep(6000)
  const read = `(() => { const s=document.getElementById('sill').getBoundingClientRect();
    const cells=[...document.querySelectorAll('.spec__cell')];
    const heads=[...document.querySelectorAll('.head > *')];
    return { model:+((1-s.height/innerHeight)*100).toFixed(1), sill: Math.round(s.height),
      specWrapped: cells.length>1 && new Set(cells.map(n=>Math.round(n.getBoundingClientRect().top))).size>1,
      headWrapped: heads.length>1 && new Set(heads.map(n=>Math.round(n.getBoundingClientRect().top))).size>1,
      overflowX: document.documentElement.scrollWidth>innerWidth,
      collide: (() => { const sp=document.getElementById('spec').getBoundingClientRect(),
        ln=document.querySelector('.subject__line').getBoundingClientRect();
        return sp.width>0 && sp.left < ln.right + 16; })() }; })()`
  const rows = []
  rows.push(['COMPOUND', floorC, await ev(read)])
  await ev(`window.__d.selectBuilding(window.__d.compound.byNum.get('03'))`); await sleep(900)
  rows.push(['BUILDING', floorB, await ev(read)])
  await ev(`window.__d.selectSuite(window.__d.compound.byNum.get('03').suites.find(x=>!x.sold))`); await sleep(900)
  rows.push(['SUITE', floorS, await ev(read)])
  console.log(`--- ${w}x${h} ---`)
  for (const [l, floor, r] of rows) {
    const ok = r.model >= floor ? 'OK' : `UNDER FLOOR (${floor}%)`
    console.log('  ', l.padEnd(9), String(r.model).padStart(5)+'%', String(r.sill).padStart(4)+'px ', ok,
      r.specWrapped?' SPEC-WRAPPED':'', r.headWrapped?' HEAD-WRAPPED':'', r.overflowX?' OVERFLOW-X':'', r.collide?' SPEC-COLLIDES':'')
  }
}
console.log('console errors:', errs.length ? errs : 'none')
process.exit(0)
