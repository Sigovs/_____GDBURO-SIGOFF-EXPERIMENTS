#!/usr/bin/env node
/* A plain static server over a folder, with no bundler in the way.

   The point is not convenience. `npm run dev` resolves bare specifiers, rewrites
   /src/... and serves CSS as a module — GitHub Pages does none of that. A build is
   only proven by being served the way Pages serves it: as files, from a
   subdirectory. Point this at the EXPERIMENTS folder and the published pages sit at
   /_buro test 2/indexN.html, exactly the depth they will have live.

     node tools/serve-static.mjs <folder> [port]
*/
import http from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'

const ROOT = process.argv[2] || process.cwd()
const PORT = Number(process.argv[3] || 5199)
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
}

http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0])
  let file = join(ROOT, normalize(p))
  if (!file.startsWith(normalize(ROOT))) { res.writeHead(403).end('403'); return }
  try { if (statSync(file).isDirectory()) file = join(file, 'index.html') } catch { /* fall through to 404 */ }
  try {
    statSync(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' })
    createReadStream(file).pipe(res)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('404 ' + p)
  }
}).listen(PORT, () => console.log('static  ' + ROOT + '  on ' + PORT))
