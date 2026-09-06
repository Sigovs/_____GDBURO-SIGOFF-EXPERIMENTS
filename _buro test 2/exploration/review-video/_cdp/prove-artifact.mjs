/* PROVE, DO NOT GUESS.
   Hide one candidate class at a time, re-render, and measure the mean luminance of the
   exact rectangle the suspicious form occupies. Whichever removal changes it is the
   object. If nothing changes it, the form is not a mesh. */
import zlib from 'node:zlib'
import { connect, sleep } from './cdp.mjs'

function decodePNG(buf) {
  let p = 8, w = 0, h = 0, colorType = 0
  const idat = []
  while (p < buf.length) {
    const len = buf.readUInt32BE(p); const type = buf.toString('ascii', p + 4, p + 8)
    const d = buf.subarray(p + 8, p + 8 + len)
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); colorType = d[9] }
    else if (type === 'IDAT') idat.push(d)
    else if (type === 'IEND') break
    p += 12 + len
  }
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType]
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
      if (ft === 1) v += a
      else if (ft === 2) v += b
      else if (ft === 3) v += (a + b) >> 1
      else if (ft === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c) }
      cur[i] = v & 255
    }
    cur.copy(out, y * stride); prev = cur
  }
  return { w, h, ch, px: out }
}

const RECT = { x: 486, y: 178, w: 66, h: 16 }   /* the thin bar left of the clubhouse */

const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find((x) => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 60; i++) {
  await sleep(600)
  const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true })
  if (r.result?.value) break
}
await sleep(6500)
const ev = async (e) => (await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value
await ev("document.getElementById('dock').style.display='none'; document.querySelector('.home').style.display='none'")

const mean = async () => {
  await sleep(650)
  const s = await cdp.send('Page.captureScreenshot', { format: 'png' })
  const img = decodePNG(Buffer.from(s.data, 'base64'))
  let sum = 0, n = 0
  for (let y = RECT.y; y < RECT.y + RECT.h; y++)
    for (let x = RECT.x; x < RECT.x + RECT.w; x++) {
      const i = (y * img.w + x) * img.ch
      sum += (img.px[i] + img.px[i + 1] + img.px[i + 2]) / 3; n++
    }
  return sum / n
}

const setVis = (test, on) => ev(
  '(() => { let n = 0; window.__v5.gl.scene.traverse(o => { if (!o.isMesh) return;' +
  ' const m = Array.isArray(o.material) ? o.material[0] : o.material;' +
  " const col = m && m.color ? '#' + m.color.getHexString() : '';" +
  ' const geo = o.geometry.type, sc = o.scale;' +
  ' if (' + test + ') { o.visible = ' + on + '; n++; } }); return n; })()')

const CASES = [
  ['civic head+cill  #39424d thin', "col === '#39424d' && sc.y < 1.6"],
  ['roof parapet     #39424d',      "col === '#39424d'"],
  ['gate pier/beam   #1c222a',      "col === '#1c222a'"],
  ['civic glazing    #223243',      "col === '#223243'"],
  ['civic mass       #7b8794',      "col === '#7b8794'"],
  ['trim             #2c333b',      "col === '#2c333b'"],
  ['membrane         #23292f',      "col === '#23292f'"],
  ['wall             #6a7683',      "col === '#6a7683'"],
  ['apron            #454e58',      "col === '#454e58'"],
]
const base = await mean()
console.log('baseline mean luminance of the rect:', base.toFixed(2))
for (const [name, test] of CASES) {
  const n = await setVis(test, 'false')
  const m = await mean()
  await setVis(test, 'true')
  const d = m - base
  console.log('  hide ' + name.padEnd(32) + 'n=' + String(n).padStart(4) +
    '  mean ' + m.toFixed(2) + '  delta ' + (d >= 0 ? '+' : '') + d.toFixed(2) +
    (Math.abs(d) > 2 ? '   <-- THIS IS IT' : ''))
}
process.exit(0)
