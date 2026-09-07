/* CONTRAST ON THE COMPOSITED RENDER — V6, and it does not know the class names.

   aa.mjs measures a hand-written list of V5.3 selectors, which is why it reported
   "all pass" against V6: every selector it looks for is gone, so it measured nothing.
   A subtraction pass changes the markup by definition, so this one finds the text
   instead of being told where it is: every element inside the interface that has its own
   visible text is located, its own pixels are read out of a PNG of the live render, and
   the WCAG ratio is computed between the ink and the ground UNDER it — which over a 3D
   scene is not the ground any token declares.

     node aa6.mjs <url> [width] [height]
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

const URL = process.argv[2]
const DPR = 2
const VW = Number(process.argv[3] || 1440), VH = Number(process.argv[4] || 900)
const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: DPR, mobile: false })
await cdp.send('Page.navigate', { url: URL })
for (let i = 0; i < 80; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}
if (await ev('!!document.getElementById("act-02")')) { await ev('document.getElementById("act-02").scrollIntoView()'); await sleep(2200) }

/* Three states, because the subtraction moves text between them: the rest pose, a
   building with a door hovered (which is where the suite tag lives), and a chosen suite
   with the product plate up. */
const STATES = [
  ['compound rest', `window.__v5.overview()`],
  ['building + door tag', `(async () => { const v = window.__v5
     v.selectBuilding(v.compound.byNum.get('03')); await new Promise(r=>setTimeout(r,1500))
     v.hoverSuite(v.S.building.suites.find((x) => !x.sold)); await new Promise(r=>setTimeout(r,700)) })()`],
  ['suite chosen', `(async () => { const v = window.__v5
     v.selectSuite(v.compound.byNum.get('03').suites.find((x) => !x.sold)); await new Promise(r=>setTimeout(r,1500)) })()`],
]

let fails = 0
console.log('CONTRAST ON THE COMPOSITED RENDER   (' + VW + 'x' + VH + ' at dpr ' + DPR + ')')
for (const [label, setup] of STATES) {
  await ev(setup); await sleep(1600)
  const nodes = await ev(`(() => {
    const host = window.__v5.host
    const out = []
    for (const el of host.querySelectorAll('*')) {
      /* own text only — a wrapper's box is its children's boxes plus the air between */
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim()
      if (!own) continue
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
      if (r.width < 4 || r.height < 4) continue
      if (cs.visibility === 'hidden' || cs.opacity === '0') continue
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue
      out.push({ text: own.replace(/[\\s\\u00a0]+/g, ' ').slice(0, 22),
        x: r.left, y: r.top, w: r.width, h: r.height,
        size: parseFloat(cs.fontSize), weight: cs.fontWeight })
    }
    return out
  })()`)
  const s = await cdp.send('Page.captureScreenshot', { format: 'png' })
  const img = decode(Buffer.from(s.data, 'base64'))
  console.log('  --- ' + label + ' ---')
  if (!nodes.length) { console.log('      (no text on screen)'); continue }
  for (const n of nodes) {
    const x0 = Math.max(0, Math.round(n.x * DPR)), y0 = Math.max(0, Math.round(n.y * DPR))
    const x1 = Math.min(img.w, Math.round((n.x + n.w) * DPR)), y1 = Math.min(img.h, Math.round((n.y + n.h) * DPR))
    const hist = new Map(); const lums = []
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = (y * img.w + x) * img.ch
      const k = img.px[i] + ',' + img.px[i + 1] + ',' + img.px[i + 2]
      hist.set(k, (hist.get(k) || 0) + 1)
      lums.push({ l: L(img.px[i], img.px[i + 1], img.px[i + 2]), k })
    }
    if (!lums.length) continue
    const groundKey = [...hist.entries()].sort((a, b) => b[1] - a[1])[0][0]
    const g = groundKey.split(',').map(Number)
    const gl = L(g[0], g[1], g[2])
    lums.sort((a, b) => Math.abs(b.l - gl) - Math.abs(a.l - gl))
    /* THE INK IS THE CORE OF THE GLYPH, NOT A PERCENTILE OF THE BOX.
       Taking the 2nd percentile works for a dense line of text and lies about a sparse
       one: a 20px arrow alone in a 60px cell covers about three per cent of its box, so
       the 2nd percentile lands on a half-covered antialiased pixel and reports 1.55:1
       for white on red — a fail that is an artefact of the estimator, not of the design.
       Everything at least 60% of the way from the ground to the most extreme pixel is
       glyph body by construction, whatever share of the box it occupies; its median is
       the colour a reader actually sees. */
    const maxd = Math.abs(lums[0].l - gl)
    const core = lums.filter((p) => Math.abs(p.l - gl) >= maxd * 0.6)
    const ink = core[Math.floor(core.length / 2)] || lums[0]
    const cr = ratio(ink.l, gl)
    const min = n.size >= 24 || (n.size >= 18.66 && Number(n.weight) >= 700) ? 3.0 : 4.5
    const ok = cr >= min
    if (!ok) fails++
    /* the 14px functional floor is an invariant in its own right, not a contrast matter */
    const tiny = n.size < 14
    if (tiny) fails++
    console.log('      ' + ('"' + n.text + '"').padEnd(26) + n.size.toFixed(0).padStart(3) + 'px  '
      + cr.toFixed(2).padStart(6) + ':1  needs ' + min.toFixed(1) + '  ' + (ok ? 'PASS' : 'FAIL')
      + (tiny ? '   UNDER THE 14px FLOOR' : ''))
  }
}
console.log('  ---> ' + (fails ? fails + ' FAIL' : 'all pass'))
process.exit(0)
