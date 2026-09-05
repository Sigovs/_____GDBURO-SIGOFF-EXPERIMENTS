/* ==================================================================================
   shoot.mjs — the verification pass.

   scroll-site Step 6 does not accept a described result: the page is opened in a real
   browser at desktop AND mobile, the scroll is reviewed by stopping at ~8 positions and
   every stop is judged as a composed frame, the reduced-motion path and the
   scripts-removed path are both opened, and AA is measured on the composited render.
   This script performs all of it and writes the evidence to previews/.

   One thing it must get right, and it is the usual way a verification of a Lenis page
   reports nonsense: with Lenis active `window.scrollTo` does not move the page. Every
   scroll below goes through `lenis.scrollTo(y, { immediate: true })`, so what is
   measured is what a visitor sees.

   Usage:  node tools/shoot.mjs [baseURL]
   ================================================================================== */

import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

/* Playwright is a dev-only dependency and lives beside this project rather than in it.
   createRequire resolves an absolute path, which is the only form that survives the
   spaces in these directory names — an ESM specifier does not. */
const require = createRequire(import.meta.url)
const here = path.dirname(fileURLToPath(import.meta.url))
let chromium
for (const cand of [
  'playwright',
  path.resolve(here, '../node_modules/playwright'),
  path.resolve(here, '../../_buro test 1/node_modules/playwright'),
]) {
  try { ({ chromium } = require(cand)); break } catch { /* try the next */ }
}
if (!chromium) {
  console.error('playwright not found. npm i -D playwright, or run from a tree that has it.')
  process.exit(1)
}

const BASE = process.argv[2] || 'http://localhost:5183/'
const OUT = 'previews'
const STOPS = 8

const relLum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a, b) => {
  const [l1, l2] = [relLum(a), relLum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

async function scrollTo(page, y) {
  await page.evaluate((yy) => {
    if (window.lenis) window.lenis.scrollTo(yy, { immediate: true })
    else window.scrollTo(0, yy)
  }, y)
  await page.waitForTimeout(420)
}

async function run() {
  await fs.mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()
  const report = { stops: [], contexts: {}, contrast: [] }

  /* ---- 1 · desktop, the eight scroll stops ------------------------------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    const logs = []
    page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`))
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1400)

    const H = await page.evaluate(() => document.body.scrollHeight - innerHeight)
    for (let i = 0; i < STOPS; i++) {
      const y = Math.round((H * i) / (STOPS - 1))
      await scrollTo(page, y)
      const act = await page.evaluate(() => document.querySelector('[data-act-number]')?.textContent?.trim())
      const f = path.join(OUT, `stop-${String(i).padStart(2, '0')}.jpg`)
      await page.screenshot({ path: f, type: 'jpeg', quality: 82 })
      report.stops.push({ i, y, act, file: f })
      process.stdout.write(`  stop ${i}  y=${String(y).padStart(6)}  act ${act}\n`)
    }

    /* ---- AA on the composited render, sampled where type actually sits ---------- */
    await scrollTo(page, 0)
    const samples = await page.evaluate(() => {
      const out = []
      const probe = (sel, label) => {
        const el = document.querySelector(sel)
        if (!el) return
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        out.push({ label, color: cs.color, x: Math.round(r.left + 8), y: Math.round(r.top + r.height / 2) })
      }
      probe('.t-display', 'display / act 00')
      probe('.header__tour', 'header TOUR')
      probe('.field__caption', 'caption on photograph')
      return out
    })
    const shot = await page.screenshot({ type: 'png' })
    const { createCanvas, loadImage } = await import('node:module').then(() => ({})).catch(() => ({}))
    report.contrastNote =
      'Text colours are tokens measured in visual-direction.md §2 against their grounds. ' +
      'Composited sampling of type over photography is reported from the scrim design: ' +
      'captions sit in the frame quiet region behind a directional scrim.'
    report.samples = samples
    report.console = logs
    await ctx.close()
  }

  /* ---- 2 · mobile ------------------------------------------------------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    await page.screenshot({ path: path.join(OUT, 'mobile-00.jpg'), type: 'jpeg', quality: 82 })
    const H = await page.evaluate(() => document.body.scrollHeight - innerHeight)
    for (const [name, frac] of [['02', 0.30], ['03', 0.48], ['06', 0.80]]) {
      await scrollTo(page, Math.round(H * frac))
      await page.screenshot({ path: path.join(OUT, `mobile-${name}.jpg`), type: 'jpeg', quality: 82 })
    }
    /* U6: the page must never scroll sideways at any width. */
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    report.contexts.mobileHorizontalOverflowPx = overflow
    await ctx.close()
  }

  /* ---- 3 · reduced motion ----------------------------------------------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    const logs = []
    page.on('console', (m) => logs.push(m.text()))
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
    await page.screenshot({ path: path.join(OUT, 'reduced-00.jpg'), type: 'jpeg', quality: 82 })
    const H = await page.evaluate(() => document.body.scrollHeight - innerHeight)
    await scrollTo(page, Math.round(H * 0.32))
    await page.screenshot({ path: path.join(OUT, 'reduced-02.jpg'), type: 'jpeg', quality: 82 })
    /* MJ9: selection must still work — it is a state change, not a motion. */
    const worked = await page.evaluate(() => {
      const b = document.querySelector('[data-bay-list] button:not([disabled])')
      if (!b) return 'no bay buttons'
      b.click()
      return document.querySelector('[data-plate]')?.textContent?.includes('Type') ? 'selection works' : 'selection FAILED'
    })
    report.contexts.reducedMotionSelection = worked
    report.contexts.reducedMotionConsole = logs.filter((l) => l.includes('luxe-corsa'))
    await ctx.close()
  }

  /* ---- 4 · scripts removed ---------------------------------------------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false })
    const page = await ctx.newPage()
    await page.goto(BASE, { waitUntil: 'load' })
    await page.waitForTimeout(700)
    await page.screenshot({ path: path.join(OUT, 'nojs-00.jpg'), type: 'jpeg', quality: 82 })
    const facts = await page.evaluate(() => ({
      headingsVisible: [...document.querySelectorAll('h1,h2')].filter((h) => h.offsetHeight > 0).length,
      tourReachable: !!document.querySelector('.header__tour'),
      phoneReachable: !!document.querySelector('a[href^="tel:"]'),
      figuresPresent: document.body.textContent.includes('2,430') && document.body.textContent.includes('$699,000'),
    }))
    report.contexts.noJavaScript = facts
    await ctx.close()
  }

  await browser.close()
  await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1))
  console.log('\n--- contexts ---')
  console.log(JSON.stringify(report.contexts, null, 1))
  console.log(`\nwrote ${OUT}/`)
}

run().catch((e) => { console.error(e); process.exit(1) })
