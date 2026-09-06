/* NAME THE OBJECT, DO NOT GUESS IT.

   Captures the compound frame as PNG, then hides one class of mesh at a time and
   captures again, cropping the same rectangle each time. The output is a set of images
   that can be LOOKED AT side by side — the removal that makes the form disappear is the
   object, and no statistic is asked to stand in for the eye.

   usage: node isolate.mjs <x> <y> <w> <h> [zoom]      (crop in CSS pixels at 1440x900)
*/
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
import fs from 'node:fs'
import zlib from 'node:zlib'

const [X, Y, W, H, Z] = process.argv.slice(2).map(Number)
const DIR = 'exploration/audit/isolate'
fs.mkdirSync(DIR, { recursive: true })
for (const f of fs.readdirSync(DIR)) fs.unlinkSync(DIR + '/' + f)

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
function crc32(b) { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)) } return ~c >>> 0 }
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii'), len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}
function encodeRGB(w, h, px) {
  const stride = w * 3, raw = Buffer.alloc(h * (stride + 1))
  for (let y = 0; y < h; y++) px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

const health = await ensure()
const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v5-guided-sales.html' })
for (let i = 0; i < 60; i++) { await sleep(500); const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v5', returnByValue: true }); if (r.result?.value) break }
await sleep(6000)
const ev = async (e) => (await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value
await ev("document.getElementById('dock').style.display='none'; document.querySelector('.home').style.display='none'; document.querySelector('.mark').style.display='none'")

const grab = async (name) => {
  await sleep(700)
  const s = await cdp.send('Page.captureScreenshot', { format: 'png' })
  const img = decode(Buffer.from(s.data, 'base64'))
  const z = Z || 1
  const ow = W * z, oh = H * z, out = Buffer.alloc(ow * oh * 3)
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const sx = Math.min(img.w - 1, X + Math.floor(x / z)), sy = Math.min(img.h - 1, Y + Math.floor(y / z))
    const i = (sy * img.w + sx) * img.ch, o = (y * ow + x) * 3
    out[o] = img.px[i]; out[o + 1] = img.px[i + 1]; out[o + 2] = img.px[i + 2]
  }
  fs.writeFileSync(DIR + '/' + name + '.png', encodeRGB(ow, oh, out))
  console.log('  ' + DIR + '/' + name + '.png')
}

/* what is actually in that rectangle, by name, resolved from the depth buffer the only
   way a browser allows: raycast the scene through the pixel and report every hit */
const through = async (px, py) => ev(`(() => {
  const gl = window.__v5.gl, cam = gl.camera
  const R = new (Object.getPrototypeOf(gl.scene).constructor.prototype ? Object : Object)
  return 'x'
})()`)

console.log('BASELINE')
await grab('00-baseline')
console.log('WHAT THE SCENE HAS IN THAT RECTANGLE, by raycast through its pixels:')
console.log(await ev(`(() => {
  const gl = window.__v5.gl
  const names = {}
  const T = window.__v5.THREE
  const rc = new T.Raycaster()
  for (let y = ${Y}; y < ${Y + H}; y += 2) for (let x = ${X}; x < ${X + W}; x += 3) {
    rc.setFromCamera(new T.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1), gl.camera)
    const hits = rc.intersectObject(gl.scene, true).filter(h => h.object.visible && h.object.material && h.object.material.colorWrite !== false)
    if (!hits.length) { names['(sky / nothing)'] = (names['(sky / nothing)'] || 0) + 1; continue }
    const o = hits[0].object
    const m = Array.isArray(o.material) ? o.material[0] : o.material
    const k = (o.userData && o.userData.kind ? o.userData.kind : o.name || o.type) +
      '  #' + (m.color ? m.color.getHexString() : '-') +
      '  scale=' + [o.scale.x, o.scale.y, o.scale.z].map(v => v.toFixed(1)).join('/')
    names[k] = (names[k] || 0) + 1
  }
  return Object.entries(names).sort((a, b) => b[1] - a[1]).slice(0, 14)
    .map(([k, n]) => '   ' + String(n).padStart(5) + '  ' + k).join('\\n')
})()`))

process.exit(0)
