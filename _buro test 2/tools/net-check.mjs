#!/usr/bin/env node
/* Every request a page makes, and every one that failed.

     node tools/net-check.mjs <url>

   A build can look right and still be missing half its photographs: an image whose
   srcset candidate 404s reports complete=true with naturalWidth 0, which no visual
   check catches. This asks the network, not the DOM.
*/
import { connect, sleep } from '../exploration/review-video/_cdp/cdp.mjs'
import { ensure } from '../exploration/review-video/_cdp/chrome.mjs'
const h = await ensure(); const cdp = await connect(h.ws)
await cdp.send('Page.enable'); await cdp.send('Network.enable'); await cdp.send('Runtime.enable')
const bad = []
cdp.on('Network.responseReceived', (p) => { if (p.response.status >= 400) bad.push(p.response.status + '  ' + p.response.url) })
cdp.on('Network.loadingFailed', (p) => bad.push('FAIL ' + (p.errorText || '') ))
await cdp.send('Page.navigate', { url: process.argv[2] })
await sleep(11000)
console.log(bad.length ? bad.join('\n') : 'no failed requests')
process.exit(0)
