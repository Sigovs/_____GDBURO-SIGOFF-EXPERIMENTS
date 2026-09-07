/* DOES THE PRODUCT PLATE MOVE WHEN THE DATA CHANGES.

   The sequence the brief names, plus a few more: building 03, suites 01, 02 and the last
   one, then building 04 and a suite in it, then 06. After every change the plate's own
   box and the boxes of the four things inside it that matter are measured in page pixels.
   A stable dock is one where every one of those numbers is the same number every time. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const URL = process.argv[2]
const health = await ensure(); const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
if (await ev('!!document.getElementById("act-02")')) { await ev('document.getElementById("act-02").scrollIntoView()'); await sleep(2200) }

const READ = `(() => {
  const g = (sel) => { const el = document.querySelector(sel); if (!el || el.hidden) return null
    const r = el.getBoundingClientRect()
    return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] }
  return { plate: g('[data-prod]'), enter: g('[data-enter]'), price: g('[data-p-price]'),
    ref: g('[data-p-n]'), specs: g('[data-specs]'), home: g('[data-overview]'), steps: g('.step--next'),
    text: (document.querySelector('[data-prod]') || {}).textContent }
})()`

const steps = []
const go = async (label, expr) => {
  await ev(expr)
  const t0 = Date.now()
  while (Date.now() - t0 < 5000 && await ev('!!(window.__v5.gl && window.__v5.gl.moving)')) await sleep(70)
  await sleep(420)
  steps.push([label, await ev(READ)])
}
await go('building 03', `window.__v5.selectBuilding(window.__v5.compound.byNum.get('03'))`)
await go('suite 03 first', `(() => { const v=window.__v5, b=v.compound.byNum.get('03'); v.selectSuite(b.suites.find(s=>!s.sold)) })()`)
await go('suite 03 second', `(() => { const v=window.__v5, b=v.compound.byNum.get('03'); v.selectSuite(b.suites.filter(s=>!s.sold)[1]) })()`)
await go('suite 03 last', `(() => { const v=window.__v5, b=v.compound.byNum.get('03'); const f=b.suites.filter(s=>!s.sold); v.selectSuite(f[f.length-1]) })()`)
await go('building 04', `window.__v5.selectBuilding(window.__v5.compound.byNum.get('04'))`)
await go('suite in 04', `(() => { const v=window.__v5, b=v.compound.byNum.get('04'); v.selectSuite(b.suites.find(s=>!s.sold)) })()`)
await go('building 06', `window.__v5.selectBuilding(window.__v5.compound.byNum.get('06'))`)
await go('suite in 06', `(() => { const v=window.__v5, b=v.compound.byNum.get('06'); v.selectSuite(b.suites.find(s=>!s.sold)) })()`)
await go('a Premium suite', `(() => { const v=window.__v5; const s=v.compound.suites.find(x=>!x.sold && x.type==='A'); v.selectBuilding(s.bldg); v.selectSuite(s) })()`)
await go('a Standard suite', `(() => { const v=window.__v5; const s=v.compound.suites.find(x=>!x.sold && x.type==='B'); v.selectBuilding(s.bldg); v.selectSuite(s) })()`)

console.log('THE PRODUCT PLATE, MEASURED IN PAGE PIXELS')
const keys = ['plate', 'enter', 'price', 'ref', 'specs', 'home', 'steps']
const withPlate = steps.filter(([, r]) => r.plate)
let fails = 0
for (const k of keys) {
  const seen = new Map()
  for (const [label, r] of (k === 'home' || k === 'steps' ? steps : withPlate)) {
    if (!r[k]) continue
    const key = r[k].join(',')
    if (!seen.has(key)) seen.set(key, [])
    seen.get(key).push(label)
  }
  const ok = seen.size <= 1
  if (!ok) fails++
  console.log('  ' + k.padEnd(7) + (ok ? 'FIXED   ' + ([...seen.keys()][0] || '(never shown)')
    : 'MOVES — ' + [...seen.entries()].map(([v, l]) => v + ' (' + l.join(', ') + ')').join('   |   ')))
}
console.log('  contents changed across the run:')
for (const [label, r] of steps) console.log('    ' + label.padEnd(18) + (r.text || '(no plate)').replace(/\s+/g, ' ').trim().slice(0, 66))
console.log('  ---> ' + (fails ? fails + ' ELEMENT(S) MOVE' : 'nothing moves'))
process.exit(0)
