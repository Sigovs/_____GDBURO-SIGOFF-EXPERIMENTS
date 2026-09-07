/* THE EVENING HAS TO BE ONE EVENING. Scrolls the real page to each act, samples the mean
   colour of the frame, and prints how warm and how dark each act is — so "act 02 feels
   separate from act 00" becomes two numbers instead of an impression. */
import { connect, sleep } from './cdp.mjs'
import { ensure } from './chrome.mjs'
import zlib from 'node:zlib'
function decode(buf){let p=8,w=0,h=0,ct=0;const idat=[]
  while(p<buf.length){const len=buf.readUInt32BE(p),t=buf.toString('ascii',p+4,p+8),d=buf.subarray(p+8,p+8+len)
    if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);ct=d[9]}else if(t==='IDAT')idat.push(d);else if(t==='IEND')break;p+=12+len}
  const ch={0:1,2:3,4:2,6:4}[ct];const raw=zlib.inflateSync(Buffer.concat(idat))
  const stride=w*ch,out=Buffer.alloc(h*stride);let prev=Buffer.alloc(stride)
  for(let y=0;y<h;y++){const ft=raw[y*(stride+1)];const line=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1));const cur=Buffer.alloc(stride)
    for(let i=0;i<stride;i++){const a=i>=ch?cur[i-ch]:0,b=prev[i],c=i>=ch?prev[i-ch]:0;let v=line[i]
      if(ft===1)v+=a;else if(ft===2)v+=b;else if(ft===3)v+=(a+b)>>1
      else if(ft===4){const pp=a+b-c,pa=Math.abs(pp-a),pb=Math.abs(pp-b),pc=Math.abs(pp-c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?b:c)}
      cur[i]=v&255}
    cur.copy(out,y*stride);prev=cur}
  return {w,h,ch,px:out}}
const URL = process.argv[2]
const health = await ensure(); const cdp = await connect(health.ws)
await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await cdp.send('Page.navigate', { url: URL })
await sleep(9000)
const ev = async (e) => { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value }
const acts = await ev(`[...document.querySelectorAll('[data-act]')].map(a => a.dataset.act)`)
console.log('MEAN COLOUR OF EACH ACT, on the real page')
for (const a of acts) {
  await ev(`document.querySelector('[data-act="${a}"]').scrollIntoView()`)
  await sleep(2600)
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' })
  const img = decode(Buffer.from(shot.data, 'base64'))
  let r = 0, g = 0, b = 0, n = 0, lum = 0
  for (let y = 0; y < img.h; y += 5) for (let x = 0; x < img.w; x += 5) {
    const i = (y * img.w + x) * img.ch
    r += img.px[i]; g += img.px[i + 1]; b += img.px[i + 2]; n++
  }
  r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n)
  lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
  console.log('  act ' + a + '   rgb(' + [r, g, b].map(v => String(v).padStart(3)).join(',') + ')'
    + '   warmth(r-b) ' + String(r - b).padStart(4)
    + '   brightness ' + String(lum).padStart(3))
}
process.exit(0)
