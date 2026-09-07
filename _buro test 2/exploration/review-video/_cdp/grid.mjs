/* WHAT COLOUR IS THE FRAME, ACTUALLY, REGION BY REGION.

   A screenshot looked at by eye is an opinion; "the top half is a warm brown wash" is a
   claim about pixels and can be settled by reading them. This captures one state and
   prints a coarse grid of mean RGB, so a light spilling onto the terrain can be told
   apart from fog, from sky, and from a warm material doing its job.

     node grid.mjs <url> "<setup expression>"
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

const URL = process.argv[2]
const SETUP = process.argv[3] || ''
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
if (SETUP) { await ev(SETUP); await sleep(2600) }
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' })
const img = decode(Buffer.from(shot.data, 'base64'))
const COLS = 8, ROWS = 6
console.log(URL.split('/').pop() + '   ' + (SETUP.slice(0, 60) || 'as loaded'))
for (let ry = 0; ry < ROWS; ry++) {
  let line = '  '
  for (let cx = 0; cx < COLS; cx++) {
    const x0 = Math.floor((cx * img.w) / COLS), x1 = Math.floor(((cx + 1) * img.w) / COLS)
    const y0 = Math.floor((ry * img.h) / ROWS), y1 = Math.floor(((ry + 1) * img.h) / ROWS)
    let r = 0, g = 0, b = 0, n = 0
    for (let y = y0; y < y1; y += 3) for (let x = x0; x < x1; x += 3) {
      const i = y * img.w * img.ch + x * img.ch
      r += img.px[i]; g += img.px[i + 1]; b += img.px[i + 2]; n++
    }
    r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n)
    /* warmth: how far red runs ahead of blue. A cool blue-hour frame is negative. */
    const warm = r - b
    line += (r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0'))
      + (warm > 0 ? '+' : '-') + String(Math.abs(warm)).padStart(2, '0') + '  '
  }
  console.log(line)
}
process.exit(0)
