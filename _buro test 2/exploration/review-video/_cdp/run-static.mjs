/* Walkthrough of one static exploration deck: A, B or C.
   Nothing here edits the prototype. The overlay is injected at runtime into a throwaway
   browser profile, and the STATIC claim it prints is MEASURED in the page each time
   rather than asserted by me. */
import { connect, recorder, sleep, moveTo, clickAt, CURSOR_JS } from './cdp.mjs'

const KEY = process.argv[2]
const DECKS = {
  a: { url: 'http://localhost:5183/exploration/a-model-first.html',            name: 'DIRECTION A · MODEL FIRST' },
  b: { url: 'http://localhost:5183/exploration/b-editorial-overlay.html',      name: 'DIRECTION B · EDITORIAL OVERLAY' },
  c: { url: 'http://localhost:5183/exploration/c-architectural-instrument.html', name: 'DIRECTION C · ARCHITECTURAL INSTRUMENT' },
}
const deck = DECKS[KEY]
const STATES = ['COMPOUND', 'BUILDING', 'SUITE']
const VW = 1440, VH = 952, BAR = 52

const targets = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const page = targets.find(t => t.type === 'page')
const cdp = await connect(page.webSocketDebuggerUrl)

await cdp.send('Page.enable')
await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: deck.url })
await sleep(3500)

const evalJS = async (expression) => {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) {
    throw new Error('page eval failed: ' +
      (r.exceptionDetails.exception?.description || r.exceptionDetails.text) +
      '\n--- expression ---\n' + expression.slice(0, 500))
  }
  return r.result?.value
}

/* The measurement the caption will carry. Counted in the live document, not from grep. */
const facts = await evalJS(`(() => {
  const dev = (src) => src.includes('@vite') || src.includes('@react-refresh');
  const authored = [...document.scripts].filter(s => !dev(s.src || ''));
  const inline = authored.filter(s => !s.src).length;
  const onattr = [...document.querySelectorAll('*')].filter(n => [...n.attributes].some(a => a.name.startsWith('on'))).length;
  return {
    scripts: authored.length, inline,
    links: document.querySelectorAll('a[href]').length,
    controls: document.querySelectorAll('button,input,select,textarea,[role=button],[tabindex]').length,
    onattr,
    injected: [...document.scripts].map(s => s.src).filter(Boolean),
    frames: [...document.querySelectorAll('.frame')].map(f => Math.round(f.getBoundingClientRect().top + scrollY)),
  };
})()`)

await evalJS(CURSOR_JS)
await evalJS(`(() => {
  const b = document.createElement('div'); b.id = '__bar';
  b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:${BAR}px;z-index:2147483646;' +
    'background:#0d0f11;border-top:1px solid #2a2e33;display:flex;align-items:center;gap:28px;' +
    'padding:0 20px;font:12px/1 ui-monospace,Consolas,monospace;letter-spacing:.06em;color:#e8ecef';
  b.innerHTML = '<b id="__b1" style="color:#fff"></b><span id="__b2" style="color:#8ab4ff"></span>' +
                '<span id="__b3" style="color:#ff8f7a"></span><span id="__b4" style="margin-left:auto;color:#7d848b"></span>';
  document.documentElement.appendChild(b);
  window.__bar = (a,c,d,e) => { __b1.textContent=a; __b2.textContent=c; __b3.textContent=d; __b4.textContent=e; };
})()`)

/* The fourth cell is read out of the page itself, so the URL on screen is the URL the
   document actually has rather than the one I meant to open. */
const say = (a, b, c) => evalJS(
  `window.__bar(${JSON.stringify(a)},${JSON.stringify(b)},${JSON.stringify(c)}, location.href)`)
const STATIC = `STATIC MOCKUP — ${facts.scripts} authored scripts · ${facts.links} links · ${facts.controls} controls · ${facts.onattr} handlers · NOTHING RESPONDS`

const rec = recorder(cdp, `exploration/review-video/_cdp/frames-${KEY}`)
await rec.start({ maxWidth: VW, maxHeight: VH })

/* 1 — the deck head, so the file being looked at is named before anything moves. */
await evalJS('window.scrollTo(0,0)')
await say(deck.name, 'FILE — ' + deck.url.replace('http://localhost:5183', ''), STATIC)
await sleep(4200)

let cur = [720, 400]
for (let i = 0; i < 3; i++) {
  const top = facts.frames[i]
  await evalJS(`window.scrollTo({top:${top}, behavior:'smooth'})`)
  await sleep(1400)
  await say(deck.name, `STATE ${i + 1} / 3 — ${STATES[i]}`, STATIC)

  /* A slow read across the composition: left third, centre, right third, then the
     bottom edge where every one of the three directions puts its interface. */
  cur = await moveTo(cdp, cur, [250, 300], 30, 18)
  cur = await moveTo(cdp, cur, [720, 430], 34, 18)
  cur = await moveTo(cdp, cur, [1180, 330], 32, 18)
  cur = await moveTo(cdp, cur, [1150, 780], 26, 18)
  cur = await moveTo(cdp, cur, [300, 800], 34, 18)

  /* Then press the things that LOOK like controls, and show that nothing answers. */
  const spots = await evalJS(`(() => {
    const f = document.querySelectorAll('.frame')[${i}];
    const sel = '.enter,.act--primary,.act,.enterline,.enterline__t,.stop,.nav__stop,.util span,.index__row,.drow,.acts *';
    const seen = [];
    for (const n of f.querySelectorAll(sel)) {
      const r = n.getBoundingClientRect();
      if (r.width < 24 || r.height < 8 || r.top < 0 || r.bottom > ${VH - BAR}) continue;
      seen.push([Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2), (n.textContent||'').trim().slice(0,28)]);
      if (seen.length >= 2) break;
    }
    return seen;
  })()`)

  for (const [x, y, label] of spots || []) {
    cur = await moveTo(cdp, cur, [x, y], 22, 18)
    const before = await evalJS(`document.body.innerHTML.length + '|' + document.documentElement.className + '|' + location.href`)
    await clickAt(cdp, [x, y])
    await sleep(700)
    const after = await evalJS(`document.body.innerHTML.length + '|' + document.documentElement.className + '|' + location.href`)
    await say(deck.name, `CLICKED "${label}" — no change (${before === after ? 'DOM and URL identical' : 'CHANGED'})`, STATIC)
    await sleep(1500)
  }
  await say(deck.name, `STATE ${i + 1} / 3 — ${STATES[i]}`, STATIC)
  await sleep(2200)
}

const n = await rec.stop()
console.log(JSON.stringify({ key: KEY, url: deck.url, frames: n, facts }, null, 1))
cdp.close()
process.exit(0)
