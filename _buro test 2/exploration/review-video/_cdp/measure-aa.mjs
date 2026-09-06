/* AA ON THE COMPOSITED RENDER.
   Token maths cannot answer this page: every label in the sill is translucent ink over a
   gradient over a moving 3D render, so the only true background is the one the compositor
   actually produced. This grabs a PNG, decodes it in-process, and for each label's own
   box separates glyph pixels from ground by luminance and reports the real ratio.

   The estimator: light text on a dark ground, so the brightest decile is glyph core and
   the darkest half is ground. It reads slightly PESSIMISTIC on antialiased type, which is
   the direction an accessibility check should err in. */
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
  if (bitDepth !== 8) throw new Error('unexpected bit depth ' + bitDepth)
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType]
  if (!ch) throw new Error('unexpected colour type ' + colorType)
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

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

function contrastIn(img, rect) {
  const { w, ch, px } = img
  const vals = []
  const x0 = Math.max(0, Math.round(rect.x)), y0 = Math.max(0, Math.round(rect.y))
  const x1 = Math.min(w, Math.round(rect.x + rect.width)), y1 = Math.min(img.h, Math.round(rect.y + rect.height))
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * ch
      vals.push(lum(px[i], px[i + 1], px[i + 2]))
    }
  }
  if (vals.length < 40) return null
  vals.sort((a, b) => a - b)
  const glyph = vals.slice(Math.floor(vals.length * 0.90))          /* brightest decile */
  const ground = vals.slice(0, Math.floor(vals.length * 0.50))      /* darkest half */
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
  return { ratio: +ratio(mean(glyph), mean(ground)).toFixed(2), samples: vals.length }
}

const targets = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable')
const ev = async (e) => (await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value

const LABELS = {
  'path stop (idle)': `document.querySelectorAll('.path__stop')[0]`,
  'act — Reset view': `document.getElementById('act-reset')`,
  'act — Enter': `document.getElementById('act-enter')`,
  'subject sub line': `document.getElementById('sub')`,
  'register label': `document.querySelector('.reg__lbl')`,
  'register count': `document.getElementById('count')`,
  'spec key': `document.querySelector('.spec__k')`,
  'spec value': `document.querySelector('.spec__v')`,
  'mark — act line': `document.querySelector('.mark__act')`,
  'callout legend': `document.querySelector('.cal__v')`,
  'callout figure': `document.querySelector('.cal__k')`,
  'invite (compound)': `document.getElementById('invite')`,
  'price (display)': `document.querySelector('.spec__cell--price .spec__v')`,
  'subject figure': `document.getElementById('fig')`,
  'path separator': `document.querySelector('.path__sep')`,
}

for (const [w, h] of [[1440, 900]]) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
  await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/d-hybrid-interactive.html' })
  await sleep(5500)
  /* COMPOUND FIRST — the invitation and the callout legend only exist at rest, and a
     pass that measures one level measures half the palette. */
  for (const [label, drive] of [['compound (at rest)', 'void 0'], ['suite level', "window.__d.selectSuite(window.__d.compound.byNum.get('03').suites.find(x => !x.sold))"]]) {
  await ev(drive)
  await sleep(2500)

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' })
  const img = decodePNG(Buffer.from(shot.data, 'base64'))
  console.log(`--- ${w}x${h} — ${label}, composited ---`)
  for (const [name, sel] of Object.entries(LABELS)) {
    const r = await ev(`(() => { const n = ${sel}; if (!n) return null; const b = n.getBoundingClientRect();
      return b.width > 2 && b.height > 2 ? { x: b.x, y: b.y, width: b.width, height: b.height } : null; })()`)
    if (!r) { console.log('  ', name.padEnd(20), 'not present'); continue }
    const c = contrastIn(img, r)
    const verdict = !c ? '—' : c.ratio >= 4.5 ? 'PASS AA' : c.ratio >= 3 ? 'FAIL AA (passes large-text 3:1)' : 'FAIL'
    console.log('  ', name.padEnd(20), String(c?.ratio ?? '—').padStart(6), ' ', verdict)
  }
  }
}
cdp.close(); process.exit(0)
