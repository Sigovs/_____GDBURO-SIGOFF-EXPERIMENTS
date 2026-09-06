/* IS THE CHOSEN DOOR THE BRIGHTEST DOOR ON THE RUN?
   Selects a suite, projects that door and its neighbours into screen space, reads the
   composited frame and reports the mean luminance inside each door rectangle. If the
   chosen one is not clearly the brightest, the suite-to-door link has failed, whatever
   the materials say. Also writes a crop so the answer can be looked at. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
import fs from 'node:fs'
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

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 60; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(5500)
const ev = async (e) => {
  const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
  return r.result?.value
}

const mode = process.argv[2] || 'select'
await ev(`(() => { const c = window.__v5.compound
  const b = c.byNum.get('03'); window.__v5.selectBuilding(b)
  const s = b.suites.filter(x => !x.sold)[5]
  window.__lcTarget = s.index
  if (${JSON.stringify(mode)} === 'select') window.__v5.selectSuite(s)
  else window.__v5.hoverSuite(s)
})()`)
await sleep(2400)

const boxes = await ev(`(() => {
  const gl = window.__v5.gl, T = window.__v5.THREE, cam = gl.camera
  const B = gl.bayOf(window.__lcTarget)
  const bnum = B.suite.building
  const mine = window.__v5.compound.suites.filter(s => s.building === bnum)
  const out = []
  for (const s of mine) {
    const o = gl.bayOf(s.index); if (!o || !o.door) continue
    const bb = new T.Box3().setFromObject(o.door)
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, behind = false
    for (const X of [bb.min.x, bb.max.x]) for (const Y of [bb.min.y, bb.max.y]) for (const Z of [bb.min.z, bb.max.z]) {
      const v = new T.Vector3(X, Y, Z).project(cam)
      if (v.z > 1) behind = true
      const px = (v.x * .5 + .5) * innerWidth, py = (-v.y * .5 + .5) * innerHeight
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py)
    }
    if (behind) continue
    out.push({ ref: s.ref, sold: s.sold, target: s.index === window.__lcTarget,
      x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(y0), y1: Math.round(y1) })
  }
  return out
})()`)

const shot = await cdp.send('Page.captureScreenshot', { format: 'png' })
const img = decode(Buffer.from(shot.data, 'base64'))
const lum = (b) => {
  let sum = 0, n = 0
  for (let y = Math.max(0, b.y0); y < Math.min(img.h, b.y1); y++)
    for (let x = Math.max(0, b.x0); x < Math.min(img.w, b.x1); x++) {
      const i = (y * img.w + x) * img.ch
      sum += img.px[i] * 0.299 + img.px[i + 1] * 0.587 + img.px[i + 2] * 0.114; n++
    }
  return n ? sum / n : 0
}
const rows = boxes.map((b) => ({ ...b, L: lum(b) })).filter((b) => b.x1 > b.x0 && b.y1 > b.y0)
rows.sort((a, b) => b.L - a.L)
console.log('MODE: ' + mode + '   (the chosen door is marked <=)')
for (const r of rows) {
  console.log('  ' + r.ref.padEnd(9) + (r.sold ? 'sold  ' : '      ') + 'lum ' + r.L.toFixed(1).padStart(6)
    + '   box ' + r.x0 + ',' + r.y0 + ' ' + (r.x1 - r.x0) + 'x' + (r.y1 - r.y0) + (r.target ? '   <=' : ''))
}
const t = rows.find((r) => r.target)
const others = rows.filter((r) => !r.target && !r.sold)
const avg = others.reduce((a, b) => a + b.L, 0) / Math.max(1, others.length)
const max = Math.max(...others.map((r) => r.L))
console.log('  chosen ' + t.L.toFixed(1) + '   others avg ' + avg.toFixed(1) + '  brightest other ' + max.toFixed(1)
  + '   ratio to avg ' + (t.L / avg).toFixed(2) + '   rank ' + (rows.indexOf(t) + 1) + ' of ' + rows.length)
process.exit(0)
