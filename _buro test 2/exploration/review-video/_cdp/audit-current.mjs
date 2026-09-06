/* THE CURRENT PRODUCTION ACT 02, CAPTURED AS A STRANGER MEETS IT.
   Three states at 1440x900 with the real interface intact, plus a count of how many
   distinct systems are on screen in each — the audit's one hard number. */
import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'

const targets = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1.5, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/' })
await sleep(8000)

const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
fs.mkdirSync('exploration/audit', { recursive: true })
const shot = async (n) => {
  const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 88 })
  fs.writeFileSync(`exploration/audit/${n}.jpeg`, Buffer.from(r.data, 'base64'))
  console.log('wrote', n)
}

/* Land inside the pinned Act 02 range, the way a scrolling visitor arrives. */
const range = await ev('window.__lc_enterRange ? window.__lc_enterRange() : null')
await ev(`window.scrollTo(0, ${range ? Math.round(range.start + 40) : 2325})`)
await sleep(4000)

/* WHAT IS ON SCREEN AT ONCE. Counted, so "too many systems" is a measurement. */
const census = `(() => {
  const vis = (n) => { const r = n.getBoundingClientRect(); const s = getComputedStyle(n);
    return r.width > 4 && r.height > 4 && r.top < innerHeight && r.bottom > 0 && s.visibility !== 'hidden' && s.opacity !== '0'; };
  const words = [...document.querySelectorAll('body *')]
    .filter(n => vis(n) && !n.children.length && (n.textContent || '').trim())
    .map(n => (n.textContent || '').trim());
  const buttons = [...document.querySelectorAll('button, a[href], [role=button]')].filter(vis);
  return {
    visibleTextNodes: words.length,
    totalWords: words.join(' ').split(/\\s+/).filter(Boolean).length,
    clickableThings: buttons.length,
    callouts: [...document.querySelectorAll('.cal__box')].filter(vis).length,
    strings: words.slice(0, 60),
  };
})()`

const out = {}
out.compound = await ev(census)
await shot('AUDIT-1-compound')

await ev(`(() => { const b = [...document.querySelectorAll('[data-bldg-index] button')].find(x => x.dataset.bldgBtn === '03'); b && b.click(); })()`)
await sleep(3200)
out.building = await ev(census)
await shot('AUDIT-2-building')

await ev(`(() => { const b = [...document.querySelectorAll('[data-bay-list] button')].filter(x => x.getAttribute('aria-disabled') !== 'true')[6]; b && b.click(); })()`)
await sleep(3200)
out.suite = await ev(census)
await shot('AUDIT-3-suite')

console.log(JSON.stringify({
  compound: { ...out.compound, strings: out.compound.strings },
  building: { visibleTextNodes: out.building.visibleTextNodes, totalWords: out.building.totalWords, clickableThings: out.building.clickableThings },
  suite: { visibleTextNodes: out.suite.visibleTextNodes, totalWords: out.suite.totalWords, clickableThings: out.suite.clickableThings },
}, null, 1))
cdp.close(); process.exit(0)
