/* HOW MUCH INTERFACE IS ON SCREEN, per level, counted rather than claimed.
   Separates PRIMARY CHROME — the things a visitor has to read and decide about — from
   the suite strip, which is one control repeated once per bay. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
const URL = process.argv[2]
const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
if (await ev('!!document.getElementById("act-02")')) { await ev('document.getElementById("act-02").scrollIntoView()'); await sleep(2200) }
const count = () => ev(`(() => {
  const host = window.__v5.host
  const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
    return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.opacity !== '0' }
  const all = [...host.querySelectorAll('button, a[href], [role="button"]')].filter(vis)
  const bays = all.filter((b) => b.hasAttribute('data-bay'))
  const chrome = all.filter((b) => !b.hasAttribute('data-bay'))
  const panels = [...host.querySelectorAll('[data-dock], [data-prod], [data-rail], [data-v6-rail], [data-nav]')].filter(vis)
  const px = panels.reduce((a, p) => { const r = p.getBoundingClientRect(); return a + Math.round(r.width * r.height) }, 0)
  const stage = window.__v5.stage.getBoundingClientRect()
  return { chrome: chrome.length, bays: bays.length, panels: panels.length,
    panelShare: Math.round((px / (stage.width * stage.height)) * 1000) / 10,
    /* \\s, not \\\\s: this whole expression is inside a template literal, and an unknown
       escape there loses its backslash — /\\s+/ arrived in the browser as /s+/ and
       replaced every letter s with a space. "Full specs" came back as "Full  pec". */
    labels: chrome.map((b) => b.textContent.replace(/[\\s\\u00a0]+/g, ' ').trim().slice(0, 24)) }
})()`)
const out = {}
await ev('window.__v5.overview()'); await sleep(1700); out.compound = await count()
await ev('window.__v5.selectBuilding(window.__v5.compound.byNum.get("03"))'); await sleep(1800); out.building = await count()
await ev('(() => { const v = window.__v5; v.selectSuite(v.S.building.suites.find((x) => !x.sold)) })()'); await sleep(1800); out.suite = await count()
console.log(URL.split('/').pop())
for (const k of ['compound', 'building', 'suite']) {
  const c = out[k]
  console.log('  ' + k.padEnd(10) + 'chrome ' + String(c.chrome).padStart(2)
    + '   suite strip ' + String(c.bays).padStart(2)
    + '   panels ' + c.panels + ' covering ' + String(c.panelShare).padStart(4) + '% of the stage')
  console.log('             ' + (c.labels.join(' | ') || '(nothing)'))
}
process.exit(0)
