/* Start (or reuse) the isolated review Chrome on port 9334.

   An isolated profile, its own user-data dir, no extensions, and never the user own
   browser: every script in this directory drives it with CDP input, and driving the
   browser someone is actually using would put synthetic clicks in their windows.

   It also has to be restartable. A renderer that hangs — a killed script mid-navigate,
   a lost WebGL context — leaves a socket that opens and then answers nothing, which
   looks exactly like a slow page. `--check` reports honestly whether the browser both
   answers HTTP and evaluates script; `--restart` kills and relaunches. */
import { spawn, execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PORT = 9334
const PROFILE = path.join(os.tmpdir(), 'lc-review-chrome')
const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  'C:/Program Files/Google/Chrome Dev/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function findBrowser() {
  for (const c of CANDIDATES) { try { if (c && fs.existsSync(c)) return c } catch {} }
  return null
}

/* answers HTTP AND evaluates script — a hung renderer passes the first and fails the second */
export async function health(timeout = 6000) {
  let list
  try {
    const r = await fetch('http://127.0.0.1:' + PORT + '/json/list', { signal: AbortSignal.timeout(2500) })
    list = await r.json()
  } catch { return { up: false, why: 'no http' } }
  const page = list.find((x) => x.type === 'page')
  if (!page) return { up: false, why: 'no page target' }
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  const ok = await new Promise((res) => {
    const to = setTimeout(() => res(false), timeout)
    ws.onerror = () => { clearTimeout(to); res(false) }
    ws.onopen = () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: '1+1', returnByValue: true } }))
    ws.onmessage = () => { clearTimeout(to); res(true) }
  })
  try { ws.close() } catch {}
  return ok ? { up: true, url: page.url, ws: page.webSocketDebuggerUrl } : { up: false, why: 'renderer does not answer' }
}

export function kill() {
  try {
    execSync('wmic process where "name=\'chrome.exe\' and commandline like \'%remote-debugging-port=' + PORT + '%\'" call terminate', { stdio: 'ignore' })
  } catch {}
  try { execSync('taskkill /F /FI "WINDOWTITLE eq lc-review*" /T', { stdio: 'ignore' }) } catch {}
  try {
    const out = execSync('powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'chrome.exe\'\\" | Where-Object { $_.CommandLine -like \'*lc-review-chrome*\' } | ForEach-Object { $_.ProcessId }"').toString()
    for (const pid of out.split(/\s+/).filter(Boolean)) { try { execSync('taskkill /F /PID ' + pid + ' /T', { stdio: 'ignore' }) } catch {} }
  } catch {}
}

export async function launch(startUrl = 'about:blank') {
  const bin = findBrowser()
  if (!bin) throw new Error('no chrome found; looked in: ' + CANDIDATES.join(', '))
  fs.mkdirSync(PROFILE, { recursive: true })
  const args = [
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + PROFILE,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows', '--hide-crash-restore-bubble',
    '--window-size=1460,1000', '--window-position=40,40',
    startUrl,
  ]
  const p = spawn(bin, args, { detached: true, stdio: 'ignore' })
  p.unref()
  for (let i = 0; i < 60; i++) {
    await sleep(500)
    const h = await health(3000)
    if (h.up) return h
  }
  throw new Error('chrome did not come up on ' + PORT)
}

/* Always hand back a browser that actually answers. */
export async function ensure(startUrl = 'about:blank') {
  const h = await health()
  if (h.up) return h
  kill()
  await sleep(1200)
  return launch(startUrl)
}

import { pathToFileURL } from 'node:url'
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2] || '--ensure'
  if (cmd === '--check') console.log(JSON.stringify(await health(), null, 1))
  else if (cmd === '--kill') { kill(); console.log('killed') }
  else if (cmd === '--restart') { kill(); await sleep(1200); console.log(JSON.stringify(await launch(process.argv[3]), null, 1)) }
  else console.log(JSON.stringify(await ensure(process.argv[3]), null, 1))
  process.exit(0)
}
