import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(5500)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
await ev("window.__lc=[]; for (const t of ['pointerdown','mousedown','mouseup','pointerup','click']) window.addEventListener(t, e => window.__lc.push(t+':'+e.target.tagName+'.'+(e.target.className.baseVal??e.target.className)+(e.target.disabled!==undefined?(' disabled='+e.target.disabled):'')+' inDom='+document.contains(e.target)+' pe='+getComputedStyle(e.target).pointerEvents), true)")
await ev("window.__v5.selectBuilding(window.__v5.compound.byNum.get('03'))"); await sleep(1600)
const targets = await ev(`(() => {
  const out = {}
  const ovb = document.querySelector('[data-overview]')
  const bay = [...document.querySelectorAll('[data-bays] [data-bay]')].filter(b=>b.dataset.sold!=='true')[3]
  const bay0 = [...document.querySelectorAll('[data-bays] [data-bay]')].filter(b=>b.dataset.sold!=='true')[0]
  const head = document.querySelector('[data-bay-head]')
  for (const [k, el] of [['overview', ovb], ['bay3', bay], ['bay0', bay0], ['bayhead', head]]) {
    if (!el) { out[k] = null; continue }
    const r = el.getBoundingClientRect()
    out[k] = [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)]
  }
  return out })()`)
for (const [name, pt] of Object.entries(targets)) {
  if (!pt) { console.log(name, 'MISSING'); continue }
  await ev('window.__lc=[]')
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt[0], y: pt[1], buttons: 0 }); await sleep(120)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt[0], y: pt[1], button: 'left', clickCount: 1, buttons: 1 }); await sleep(80)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt[0], y: pt[1], button: 'left', clickCount: 1, buttons: 0 }); await sleep(700)
  console.log(name.padEnd(9), 'at', pt.join(','), '->', JSON.stringify(await ev('window.__lc')))
  await ev("window.__v5.selectBuilding(window.__v5.compound.byNum.get('03'))"); await sleep(1200)
}
process.exit(0)
