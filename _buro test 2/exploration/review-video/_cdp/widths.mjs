/* Does a premium bay now measure wider than a standard one? Measured off the live model,
   in feet, against the published 30' and 23'. */
import { connect, sleep } from './cdp.mjs'

const t = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const cdp = await connect(t.find((x) => x.type === 'page').webSocketDebuggerUrl)
await cdp.send('Runtime.enable')
await cdp.send('Page.navigate', { url: 'http://localhost:5183/exploration/study/proposed-v4-guided-experience.html' })
for (let i = 0; i < 50; i++) {
  await sleep(600)
  const r = await cdp.send('Runtime.evaluate', { expression: '!!window.__v4', returnByValue: true })
  if (r.result?.value) break
}
await sleep(5000)

const r = await cdp.send('Runtime.evaluate', {
  expression: `(() => {
    
    const C = window.__v4.compound, runs = new Map();
    for (const s of C.suites) { const k = s.building + '@' + s.ang.toFixed(2);
      if (!runs.has(k)) runs.set(k, { A: [], B: [] }); runs.get(k)[s.type].push(s.slot || s.w); }
    const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    const rows = [];
    for (const [k, g] of runs) if (g.A.length && g.B.length)
      rows.push({ run: k, A: g.A.length, B: g.B.length, Aw: +mean(g.A).toFixed(2), Bw: +mean(g.B).toFixed(2), ratio: +(mean(g.A)/mean(g.B)).toFixed(3) });
    return { rows: rows.slice(0, 6), runsWithBoth: rows.length };
  })()`,
  returnByValue: true,
})
if (r.exceptionDetails) console.log('ERR', (r.exceptionDetails.exception?.description || '').slice(0, 200))
else console.log(JSON.stringify(r.result.value, null, 1))
process.exit(0)
