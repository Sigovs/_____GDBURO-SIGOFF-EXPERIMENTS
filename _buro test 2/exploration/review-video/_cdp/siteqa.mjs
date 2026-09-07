/* ==================================================================================
   THE WHOLE PAGE, AS A PRODUCT.

   Scrolls the integrated review page top to footer and back with real wheel events,
   stops at every act, interacts with act 02 with a real pointer in the middle of the
   run, and reports anything that would trap a visitor: a pin that never releases, a
   wheel that stops moving the page, an overlay left intercepting the pointer, a stale
   state after coming back up, a console error.
   ================================================================================== */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
/* Wait until the model says the camera has arrived, then a beat for the paint. */
const settle = async (evf, max = 4000) => {
  const t0 = Date.now()
  for (;;) {
    const m = await evf('!!(window.__v5.gl && window.__v5.gl.moving)')
    if (!m || Date.now() - t0 > max) break
    await sleep(80)
  }
  await sleep(260)
}
import fs from 'node:fs'

const URL = process.argv[2] || 'http://localhost:5183/exploration/integrated/v5-full-site.html'
const LOG = 'exploration/review-video/_cdp/siteqa.txt'
fs.writeFileSync(LOG, '')
const emit = console.log
console.log = (...a) => { const s = a.join(' '); emit(s); fs.appendFileSync(LOG, s + '\n') }

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
const errors = []
cdp.on('Runtime.exceptionThrown', (p) => errors.push('EXC ' + (p.exceptionDetails?.exception?.description || p.exceptionDetails?.text)))
cdp.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') errors.push('ERR ' + p.args.map((a) => a.value ?? a.description).join(' ')) })
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)

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
/* A REAL WHEEL, at a real place on the page — not scrollTo. A pin, a scroll-jack or an
   overlay that swallows the wheel only shows up if the wheel is the thing being used. */
const wheel = async (dy, x = 1200, y = 450, n = 1) => {
  for (let i = 0; i < n; i++) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: dy, pointerType: 'mouse' })
    await sleep(45)
  }
  await sleep(320)
}
const Y = () => ev('Math.round(scrollY)')
const at = () => ev(`(() => {
  let best = null
  for (const s of document.querySelectorAll('.act[data-act]')) {
    const r = s.getBoundingClientRect()
    if (r.top <= innerHeight * 0.5 && r.bottom > innerHeight * 0.5) best = s.dataset.act
  }
  return best || (scrollY < 40 ? '00' : 'footer')
})()`)

console.log('PAGE: ' + URL)
console.log('  document height   ' + await ev('document.documentElement.scrollHeight'))
console.log('  acts in the DOM   ' + (await ev(`[...document.querySelectorAll('.act[data-act]')].map(s=>s.dataset.act).join(' ')`)))
console.log('  images            ' + (await ev(`document.images.length + ' in markup, ' + [...document.images].filter(i=>i.complete&&i.naturalWidth).length + ' loaded'`)))
console.log('  video elements    ' + await ev('document.querySelectorAll("video").length'))
console.log('  scroll triggers   ' + await ev(`(window.ScrollTrigger||window.gsap)?'(gsap present)':'(not exposed)'`))
console.log('')

/* ---- DOWN ------------------------------------------------------------------------ */
console.log('SCROLLING DOWN with a real wheel, 40 notches at a time')
let last = -1, stuck = 0, steps = 0
const seen = []
while (steps++ < 90) {
  const before = await Y()
  await wheel(400, 1200, 450, 6)
  const after = await Y()
  const act = await at()
  if (!seen.includes(act)) { seen.push(act); console.log('   reached act ' + act + ' at scrollY ' + after) }
  if (after === before) { stuck++; if (stuck > 3) break } else stuck = 0
  if (after === last) break
  last = after
  if (act === 'footer' && after > 100) break
}
const bottom = await Y()
const docMax = await ev('document.documentElement.scrollHeight - innerHeight')
console.log('   bottom reached    scrollY ' + bottom + ' of ' + docMax + (bottom >= docMax - 60 ? '   OK' : '   DID NOT REACH THE FOOTER'))
console.log('   acts passed       ' + seen.join(' '))
console.log('')

/* ---- BACK UP --------------------------------------------------------------------- */
console.log('SCROLLING BACK UP')
let up = 0
for (let i = 0; i < 90; i++) {
  const before = await Y()
  await wheel(-400, 1200, 450, 6)
  const after = await Y()
  if (after === before) { up++; if (up > 3) break } else up = 0
  if (after === 0) break
}
console.log('   top reached       scrollY ' + await Y() + (await Y() === 0 ? '   OK' : '   STUCK'))
console.log('')

/* ---- ACT 02, IN THE MIDDLE OF THE PAGE ------------------------------------------- */
console.log('ACT 02 INSIDE THE PAGE')
await ev(`document.getElementById('act-02').scrollIntoView()`)
await sleep(2500)
await ev('window.__v5.overview()')
await sleep(1800)
const stageBox = await ev(`(() => { const r = window.__v5.stage.getBoundingClientRect()
  return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } })()`)
console.log('   the stage         ' + JSON.stringify(stageBox))

const pointOn = async (num) => {
  const proj = await ev(`(() => { const gl=window.__v5.gl, cam=gl.camera, V=cam.position.constructor, out=[]
    const r = window.__v5.stage.getBoundingClientRect()
    gl.site.traverse(o => { if(o.userData && o.userData.pick && o.userData.num === ${JSON.stringify(num)}) {
      const p=o.getWorldPosition(new V()); p.project(cam)
      out.push([Math.round(r.left + (p.x*.5+.5)*r.width), Math.round(r.top + (-p.y*.5+.5)*r.height)]) } })
    return out })()`)
  for (const [cx, cy] of proj) {
    for (let rr = 0; rr <= 80; rr += 8) {
      for (let a = 0; a < (rr ? 12 : 1); a++) {
        const x = cx + Math.round(rr * Math.cos(a * Math.PI / 6)), y = cy + Math.round(rr * Math.sin(a * Math.PI / 6))
        if (x < 20 || x > 1420 || y < 20 || y > 880) continue
        await move(x, y)
        if (await ev('window.__v5.S.hover ? window.__v5.S.hover.num : null') === num) return [x, y]
      }
    }
  }
  return null
}

let pass = 0
const nums = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']
for (const n of nums) {
  const p = await pointOn(n)
  if (!p) { console.log('   ' + n + '   NO HOVER POINT'); continue }
  await click(p[0], p[1]); await sleep(1300)
  const st = await ev('(() => { const S = window.__v5.S; return S.level + "/" + (S.building ? S.building.num : null) })()')
  const ok = st === 'building/' + n
  if (ok) pass++
  console.log('   ' + n + '   hover+click ' + (ok ? 'PASS' : 'FAIL (' + st + ')'))
  await ev('window.__v5.overview()'); await sleep(1200)
}
console.log('   ---> ' + pass + '/11 selectable inside the real page')
console.log('')

/* ---- the whole journey, in place ------------------------------------------------- */
console.log('THE JOURNEY')
const p03 = await pointOn('03')
await click(p03[0], p03[1]); await sleep(1600)
const bay = await ev(`(() => { const bs=[...document.querySelectorAll('[data-bays] [data-bay]')].filter(b=>b.dataset.sold!=='true')
  const r=bs[3].getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)] })()`)
await move(bay[0], bay[1]); await sleep(500)
console.log('   suite hover        ' + await ev('window.__v5.S.hoverSuite ? window.__v5.S.hoverSuite.ref : "NONE"'))
await click(bay[0], bay[1]); await sleep(1600)
console.log('   suite selected     ' + await ev('window.__v5.S.suite ? window.__v5.S.suite.ref : "NONE"'))
const enter = await ev(`(() => { const b=document.querySelector('[data-enter]'); if(!b) return null
  const r=b.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2), Math.round(r.width), Math.round(r.height)] })()`)
console.log('   ENTER             ' + (enter ? enter[2] + 'x' + enter[3] + ' at ' + enter[0] + ',' + enter[1] : 'NOT PRESENT'))
if (enter) { await click(enter[0], enter[1]); await sleep(2200) }
console.log('   after ENTER       entered=' + await ev('window.__v5.S.entered') + '  level=' + await ev('window.__v5.S.level'))

/* the site plan, from inside the page */
const before = await ev('(() => { const S=window.__v5.S; return S.level + " " + (S.suite?S.suite.ref:"-") })()')
await ev('window.__v5.openPlan()'); await sleep(1500)
const planBox = await ev(`(() => { const p=document.querySelector('[data-plan]'); const r=p.getBoundingClientRect()
  const svg=p.querySelector('svg'); const vb = svg ? svg.getAttribute('viewBox') : null
  const el = document.elementFromPoint(700, 500)
  return { rect:[Math.round(r.width),Math.round(r.height)], viewBox:vb, coversAt700x500: el ? el.closest('[data-plan]') !== null : false } })()`)
console.log('   site plan         ' + JSON.stringify(planBox))
await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
await sleep(900)
const after = await ev('(() => { const S=window.__v5.S; return S.level + " " + (S.suite?S.suite.ref:"-") })()')
console.log('   escape from plan  state before "' + before + '"  after "' + after + '"  ' + (before === after ? 'PRESERVED' : 'LOST'))

/* can the page still scroll after all that? */
const y0 = await Y()
await wheel(400, 1200, 700, 8)
const y1 = await Y()
console.log('   wheel after use   scrollY ' + y0 + ' -> ' + y1 + (y1 > y0 ? '   PAGE STILL SCROLLS' : '   SCROLL TRAP'))
/* and does the wheel over the model scroll the page rather than being eaten? */
await ev(`document.getElementById('act-02').scrollIntoView()`); await sleep(1600)
const z0 = await Y()
await wheel(400, 700, 400, 8)
const z1 = await Y()
console.log('   wheel over model  scrollY ' + z0 + ' -> ' + z1 + (z1 > z0 ? '   passes through' : '   EATEN BY THE MODEL'))

/* nothing left over the page */
const overlay = await ev(`(() => { const el = document.elementFromPoint(720, 300)
  return el ? el.tagName + '.' + (el.className.baseVal ?? el.className) : null })()`)
console.log('   element at 720,300 ' + overlay)
console.log('')
console.log('CONSOLE ERRORS: ' + (errors.length ? errors.length + '\n   ' + errors.slice(0, 10).join('\n   ') : 'none'))
process.exit(0)
