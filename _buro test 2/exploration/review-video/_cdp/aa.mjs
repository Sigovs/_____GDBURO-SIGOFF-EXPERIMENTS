/* CONTRAST, MEASURED ON THE COMPOSITED RENDER.

   Not on tokens. The dock sits on a translucent panel over a live 3D scene with a
   backdrop-filter behind it, so the colour a token declares and the colour a reader
   actually sees are two different things — and the second one is the only one that
   matters. Every functional text node is located, its own pixels are read out of a PNG
   screenshot, the ink is taken as the extreme end of that box's luminance histogram and
   the ground as its mode, and the WCAG ratio is computed between them.

   Anything below 4.5:1 at a functional size is a fail and is printed as one.
*/
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
import zlib from 'node:zlib'

function decode(buf) {
  let p = 8, w = 0, h = 0, ct = 0
  const idat = []
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8)
    const d = buf.subarray(p + 8, p + 8 + len)
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9] }
    else if (type === 'IDAT') idat.push(d)
    else if (type === 'IEND') break
    p += 12 + len
  }
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[ct]
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = w * ch, out = Buffer.alloc(h * stride)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const cur = Buffer.alloc(stride)
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0, b = prev[i], c = i >= ch ? prev[i - ch] : 0
      let v = line[i]
      if (ft === 1) v += a; else if (ft === 2) v += b; else if (ft === 3) v += (a + b) >> 1
      else if (ft === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c) }
      cur[i] = v & 255
    }
    cur.copy(out, y * stride); prev = cur
  }
  return { w, h, ch, px: out }
}
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
const DPR = 2
const VW = Number(process.argv[3] || 1440), VH = Number(process.argv[4] || 900)
await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: DPR, mobile: false })
await cdp.send('Page.navigate', { url: process.argv[2] || 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}

/* land on a state that has every functional class of text on screen at once */
await ev(`(async () => { const v = window.__v5
  v.selectBuilding(v.compound.byNum.get('03')); await new Promise(r=>setTimeout(r,1300))
  const b = [...document.querySelectorAll('[data-bays] [data-bay]')].filter(x=>x.dataset.sold!=='true')[3]
  v.selectSuite(b._s); await new Promise(r=>setTimeout(r,1300)) })()`)
await sleep(1400)

/* every text node the interface uses functionally, with its own box */
const nodes = await ev(`(() => {
  const want = [
    ['dock key (mono label)', '.v5 .who__k'],
    ['dock figure', '.v5 .who__f'],
    ['dock sub', '.v5 .who__s'],
    ['type chip', '.v5 .chip'],
    ['bay legend', '.v5 .bayhead'],
    ['price key', '.v5 .price .k'],
    ['price value', '.v5 .price .v'],
    ['price note', '.v5 .price .a'],
    ['ENTER label', '.v5 .v5-enter .t'],
    ['OVERVIEW button', '.v5 .nav button:not([hidden])'],
    ['building tag', '.v5 #tag .n'],
  ]
  const out = []
  for (const [name, sel] of want) {
    const el = document.querySelector(sel)
    if (!el) { out.push({ name, missing: true }); continue }
    const r = el.getBoundingClientRect()
    if (r.width < 4 || r.height < 4) { out.push({ name, missing: true }); continue }
    const cs = getComputedStyle(el)
    out.push({ name, x: r.left, y: r.top, w: r.width, h: r.height,
      size: parseFloat(cs.fontSize), weight: cs.fontWeight, colour: cs.color })
  }
  return out
})()`)

const s = await cdp.send('Page.captureScreenshot', { format: 'png' })
const img = decode(Buffer.from(s.data, 'base64'))

console.log('CONTRAST ON THE COMPOSITED RENDER   (' + VW + 'x' + VH + ' at dpr ' + DPR + ')')
let fails = 0
for (const n of nodes) {
  if (n.missing) { console.log('  ' + n.name.padEnd(24) + 'not on screen in this state'); continue }
  const x0 = Math.round(n.x * DPR), y0 = Math.round(n.y * DPR)
  const x1 = Math.min(img.w, Math.round((n.x + n.w) * DPR)), y1 = Math.min(img.h, Math.round((n.y + n.h) * DPR))
  const hist = new Map()
  const lums = []
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * img.w + x) * img.ch
    const k = img.px[i] + ',' + img.px[i + 1] + ',' + img.px[i + 2]
    hist.set(k, (hist.get(k) || 0) + 1)
    lums.push({ l: L(img.px[i], img.px[i + 1], img.px[i + 2]), k })
  }
  if (!lums.length) { console.log('  ' + n.name.padEnd(24) + 'no pixels'); continue }
  /* ground = the most common colour in the box; ink = the most extreme away from it */
  const groundKey = [...hist.entries()].sort((a, b) => b[1] - a[1])[0][0]
  const g = groundKey.split(',').map(Number)
  const gl = L(g[0], g[1], g[2])
  lums.sort((a, b) => Math.abs(b.l - gl) - Math.abs(a.l - gl))
  /* take the 2nd percentile of the extreme end, so a single antialiased outlier does not
     stand in for the glyph body */
  const ink = lums[Math.min(lums.length - 1, Math.floor(lums.length * 0.02))]
  const cr = ratio(ink.l, gl)
  const min = n.size >= 24 || (n.size >= 18.66 && Number(n.weight) >= 700) ? 3.0 : 4.5
  const ok = cr >= min
  if (!ok) fails++
  console.log('  ' + n.name.padEnd(24) + n.size.toFixed(0).padStart(3) + 'px  ink rgb(' + ink.k + ')  on rgb(' + groundKey + ')'
    + '   ' + cr.toFixed(2) + ':1   needs ' + min.toFixed(1) + '   ' + (ok ? 'PASS' : 'FAIL'))
}
console.log('  ---> ' + (fails ? fails + ' FAIL' : 'all pass'))
process.exit(0)
