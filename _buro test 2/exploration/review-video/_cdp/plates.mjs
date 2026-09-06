/* MODEL PLATES for the three new directions — real captures of the production Three.js
   compound with every interface layer hidden at runtime. No file is edited to take them.

   The layout is left ALONE. An earlier attempt restyled the stage to fill the viewport;
   the renderer's ResizeObserver never woke, so the model kept a 737x346 buffer stretched
   into a 1425x684 box and the plates came back soft. Instead the capture is CLIPPED to
   the canvas's own rect at 2x — the model at its real resolution, nothing rescaled.

   All three directions are composed over the SAME plates on purpose: the only variable
   between them is the relationship between the model and the interface. */
import { connect, sleep } from './cdp.mjs'
import fs from 'node:fs'

const targets = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/' })
await sleep(9000)

const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
fs.mkdirSync('exploration/plates2', { recursive: true })

const range = await ev('window.__lc_enterRange ? window.__lc_enterRange() : null')
await ev(`window.scrollTo(0, ${range ? Math.round(range.start + 40) : 2325})`)
await sleep(3500)

/* Hide the interface only. The model keeps the box it was laid out in. */
await ev(`(() => {
  const hide = ['.header','.rail','.span-record','.cal','.hint','.levels','#h-02','.act[data-act="02"] .t-label','.threshold'];
  for (const s of hide) document.querySelectorAll(s).forEach(n => { n.style.visibility = 'hidden'; });
})()`)
await sleep(1500)

/* Wait for the model to actually stand — the canvas is created by a dynamic import and
   a fixed sleep is a race, not a wait. */
for (let i = 0; i < 40 && !(await ev('!!document.querySelector("canvas")')); i++) await sleep(500)

const box = await ev(`(() => { const r = document.querySelector('canvas').getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; })()`)
console.log('canvas box', box, ' buffer', await ev(`(c => c.width + 'x' + c.height)(document.querySelector('canvas'))`))

const shot = async (n) => {
  const r = await cdp.send('Page.captureScreenshot', {
    format: 'jpeg', quality: 93,
    clip: { x: box.x, y: box.y, width: box.width, height: box.height, scale: 2 },
  })
  fs.writeFileSync(`exploration/plates2/${n}.jpeg`, Buffer.from(r.data, 'base64'))
  console.log('plate', n)
}
await shot('compound')

/* The model's own selection, so BUILDING and SUITE plates show whatever the production
   model actually does to a chosen mass — not a lighting state invented for a board. */
await ev(`(() => { const b=[...document.querySelectorAll('[data-bldg-index] button')].find(x=>x.dataset.bldgBtn==='03'); b && b.click(); })()`)
await sleep(4000)
await shot('building')

await ev(`(() => { const b=[...document.querySelectorAll('[data-bay-list] button')].filter(x=>x.getAttribute('aria-disabled')!=='true')[10]; b && b.click(); })()`)
await sleep(4000)
await shot('suite')

console.log('suite ref =', await ev(`(() => { const n=document.querySelector('[data-level-suite]'); return n ? n.textContent : '?'; })()`))
cdp.close(); process.exit(0)
