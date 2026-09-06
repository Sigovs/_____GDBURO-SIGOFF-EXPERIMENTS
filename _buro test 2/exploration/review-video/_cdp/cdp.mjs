/* Minimal CDP client over the built-in Node WebSocket, plus a screencast recorder.
   The OS-level capture path is unusable on this machine: gdigrab records the 8960x2160
   VIRTUAL desktop, the browser window sits behind the user's own windows, and injecting
   real cursor input would land clicks inside whatever the user happens to have open.
   Page.startScreencast is immune to occlusion and touches nothing outside this browser. */
import fs from 'node:fs'
import path from 'node:path'

export async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let id = 0
  const pending = new Map()
  const listeners = new Map()
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id != null && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id); pending.delete(m.id)
      m.error ? rej(new Error(m.error.message)) : res(m.result)
    } else if (m.method) {
      for (const fn of listeners.get(m.method) || []) fn(m.params)
    }
  }
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id
    pending.set(i, { res, rej })
    ws.send(JSON.stringify({ id: i, method, params }))
  })
  const on = (method, fn) => { if (!listeners.has(method)) listeners.set(method, []); listeners.get(method).push(fn) }
  return { send, on, close: () => ws.close() }
}

export const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/* Frames arrive when the page changes, not on a clock, so each one is written with the
   wall time it arrived and the manifest carries real durations. A fixed -framerate would
   speed up quiet stretches and slow down busy ones. */
export function recorder(cdp, dir) {
  fs.mkdirSync(dir, { recursive: true })
  for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f))
  const frames = []
  cdp.on('Page.screencastFrame', async (p) => {
    frames.push({ t: Date.now(), file: String(frames.length).padStart(5, '0') + '.jpg' })
    fs.writeFileSync(path.join(dir, frames[frames.length - 1].file), Buffer.from(p.data, 'base64'))
    try { await cdp.send('Page.screencastFrameAck', { sessionId: p.sessionId }) } catch {}
  })
  return {
    start: (opts = {}) => cdp.send('Page.startScreencast', {
      format: 'jpeg', quality: 82, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1, ...opts,
    }),
    stop: async () => {
      await cdp.send('Page.stopScreencast')
      const lines = ['ffconcat version 1.0']
      for (let i = 0; i < frames.length; i++) {
        const d = (i < frames.length - 1 ? frames[i + 1].t - frames[i].t : 120) / 1000
        lines.push(`file '${frames[i].file}'`, `duration ${Math.max(0.02, d).toFixed(3)}`)
      }
      if (frames.length) lines.push(`file '${frames[frames.length - 1].file}'`)
      fs.writeFileSync(path.join(dir, 'list.txt'), lines.join('\n'))
      return frames.length
    },
    count: () => frames.length,
  }
}

/* A pointer the camera can see. CDP dispatches input straight into the renderer, so the
   real OS cursor never moves and nothing is drawn by the compositor — without this the
   video would show state changing with no visible cause. It is labelled on screen as a
   synthetic pointer, because that is what it is. */
export const CURSOR_JS = `(() => {
  if (document.getElementById('__cur')) return;
  const d = document.createElement('div');
  d.id = '__cur';
  d.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;left:0;top:0;' +
    'width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;' +
    'border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.65),0 0 12px rgba(255,255,255,.35);' +
    'background:rgba(255,255,255,.12);transition:transform .06s linear';
  document.documentElement.appendChild(d);
  window.__cur = (x, y, down) => {
    d.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + (down ? 0.6 : 1) + ')';
    d.style.background = down ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.12)';
  };
})()`

export async function moveTo(cdp, from, to, steps = 26, delay = 16) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    const x = Math.round(from[0] + (to[0] - from[0]) * e)
    const y = Math.round(from[1] + (to[1] - from[1]) * e)
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 })
    await cdp.send('Runtime.evaluate', { expression: `window.__cur && window.__cur(${x},${y},0)` })
    await sleep(delay)
  }
  return to
}

export async function clickAt(cdp, [x, y]) {
  await cdp.send('Runtime.evaluate', { expression: `window.__cur && window.__cur(${x},${y},1)` })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, buttons: 1 })
  await sleep(90)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, buttons: 0 })
  await cdp.send('Runtime.evaluate', { expression: `window.__cur && window.__cur(${x},${y},0)` })
}
