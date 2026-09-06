/* THE SCRIM IS A DECLARED LAYER, SO IT IS MEASURED, NOT LOOKED AT (U16).
   A gradient with badly spaced stops draws a visible horizontal across the picture — the
   same failure as a hard edge over a transparent ground (U17), just softer. This samples
   columns of the composited render over a region of the model that should be smooth, and
   reports the largest luminance step between adjacent rows. A step that stands out from
   its neighbours is a band edge; a smooth ramp has no outlier. */
import zlib from 'node:zlib'
import { connect, sleep } from './cdp.mjs'

function decodePNG(buf) {
  let p = 8, w = 0, h = 0, bitDepth = 0, colorType = 0
  const idat = []
  while (p < buf.length) {
    const len = buf.readUInt32BE(p); const type = buf.toString('ascii', p + 4, p + 8)
    const data = buf.subarray(p + 8, p + 8 + len)
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9] }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    p += 12 + len
  }
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType]
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = w * ch
  const out = Buffer.alloc(h * stride)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const cur = Buffer.alloc(stride)
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0, b = prev[i], c = i >= ch ? prev[i - ch] : 0
      let v = line[i]
      if (ft === 1) v += a
      else if (ft === 2) v += b
      else if (ft === 3) v += (a + b) >> 1
      else if (ft === 4) {
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c)
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)
      }
      cur[i] = v & 255
    }
    cur.copy(out, y * stride); prev = cur
  }
  return { w, h, ch, px: out }
}

const targets = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/d-hybrid-interactive.html' })
await sleep(6500)
const ev = async (e) => (await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value
await ev(`window.__d.selectSuite(window.__d.compound.byNum.get('03').suites.find(x=>!x.sold))`)
await sleep(3000)

const shot = await cdp.send('Page.captureScreenshot', { format: 'png' })
const img = decodePNG(Buffer.from(shot.data, 'base64'))
const sillTop = await ev(`Math.round(document.getElementById('sill').getBoundingClientRect().top)`)

/* Average a band of columns so one roof edge cannot masquerade as a scrim step. */
const rowMean = (y) => {
  let s = 0, n = 0
  for (let x = 380; x < 1060; x += 4) { const i = (y * img.w + x) * img.ch; s += (img.px[i] + img.px[i + 1] + img.px[i + 2]) / 3; n++ }
  return s / n
}
const rows = []
for (let y = 380; y < sillTop - 4; y++) rows.push([y, rowMean(y)])
const deltas = rows.slice(1).map(([y, v], i) => [y, v - rows[i][1]])
const abs = deltas.map(d => Math.abs(d[1])).sort((a, b) => a - b)
const median = abs[Math.floor(abs.length / 2)]
const worst = deltas.slice().sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 6)

console.log('sill top at y =', sillTop)
console.log('median row-to-row step:', median.toFixed(3))
console.log('largest steps (y, step, x median):')
for (const [y, d] of worst) console.log('  y=' + String(y).padStart(4), 'step=' + d.toFixed(2), '  = ' + (Math.abs(d) / median).toFixed(1) + 'x median')
console.log()
console.log('luminance profile every 40px:')
for (let y = 400; y < sillTop; y += 40) console.log('  y=' + String(y).padStart(4), rowMean(y).toFixed(1))
process.exit(0)
