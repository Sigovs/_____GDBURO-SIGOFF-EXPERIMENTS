#!/usr/bin/env node
/* WHAT IS ACTUALLY IN THIS GLB. Parses the container's JSON chunk directly — no loader,
   no dependency — and reports meshes, triangles, materials, texture maps and their
   pixel sizes, so an asset audit is a reading rather than an impression. */
import fs from 'node:fs'
import path from 'node:path'

const pngSize = (b, o) => (b.readUInt32BE(o + 16) + ' x ' + b.readUInt32BE(o + 20))
const jpgSize = (b, o) => {
  let p = o + 2
  while (p < b.length - 9) {
    if (b[p] !== 0xff) { p++; continue }
    const m = b[p + 1]
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return b.readUInt16BE(p + 7) + ' x ' + b.readUInt16BE(p + 5)
    p += 2 + b.readUInt16BE(p + 2)
  }
  return '?'
}

for (const f of process.argv.slice(2)) {
  const buf = fs.readFileSync(f)
  if (buf.toString('ascii', 0, 4) !== 'glTF') { console.log(path.basename(f) + '  NOT A GLB'); continue }
  let p = 12, json = null, bin = null
  while (p < buf.length) {
    const len = buf.readUInt32LE(p), type = buf.readUInt32LE(p + 4)
    const d = buf.subarray(p + 8, p + 8 + len)
    if (type === 0x4e4f534a) json = JSON.parse(d.toString('utf8'))
    else if (type === 0x004e4942) bin = d
    p += 8 + len
  }
  const acc = json.accessors || []
  let tris = 0, verts = 0
  for (const m of json.meshes || []) for (const pr of m.primitives || []) {
    const n = pr.indices != null ? acc[pr.indices].count : acc[pr.attributes.POSITION].count
    tris += n / 3
    verts += acc[pr.attributes.POSITION].count
  }
  const maps = []
  for (const mat of json.materials || []) {
    const pbr = mat.pbrMetallicRoughness || {}
    const add = (label, t) => { if (t) maps.push(label) }
    add('baseColor', pbr.baseColorTexture)
    add('metalRough', pbr.metallicRoughnessTexture)
    add('normal', mat.normalTexture)
    add('occlusion', mat.occlusionTexture)
    add('emissive', mat.emissiveTexture)
  }
  const imgs = (json.images || []).map((im, i) => {
    if (im.bufferView == null || !bin) return im.mimeType || 'external'
    const bv = json.bufferViews[im.bufferView]
    const b = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength)
    const kind = b[0] === 0x89 ? 'png' : (b[0] === 0xff ? 'jpg' : '?')
    const size = kind === 'png' ? pngSize(b, 0) : (kind === 'jpg' ? jpgSize(b, 0) : '?')
    return kind + ' ' + size + ' (' + Math.round(bv.byteLength / 1024) + ' kB)'
  })
  const alphaModes = [...new Set((json.materials || []).map((m) => m.alphaMode || 'OPAQUE'))]
  const ext = json.extensionsUsed || []
  console.log(path.basename(f).padEnd(12)
    + String(Math.round(fs.statSync(f).size / 1024)).padStart(6) + ' kB'
    + '   ' + String(json.meshes?.length || 0).padStart(2) + ' mesh'
    + '  ' + String(Math.round(tris)).padStart(7) + ' tris'
    + '  ' + String(verts).padStart(7) + ' verts'
    + '  ' + String((json.materials || []).length) + ' mat [' + alphaModes.join('/') + ']')
  console.log('             maps: ' + (maps.length ? [...new Set(maps)].join(', ') : 'none'))
  console.log('             images: ' + (imgs.length ? imgs.join(' | ') : 'none') + (ext.length ? '   ext: ' + ext.join(',') : ''))
  console.log('             nodes: ' + (json.nodes || []).map((n) => n.name).filter(Boolean).slice(0, 6).join(', '))
}
