/* ==================================================================================
   BUILD THE REAL HOMEPAGE WITH V5.3 OR V6 IN ACT 02.

     node tools/build-integrated.mjs          -> v5-full-site.html
     node tools/build-integrated.mjs --v6     -> v6-full-site.html

   GENERATED, NOT COPIED.  A hand-made duplicate of a 743-line index.html is a fork that
   rots the first time either side is touched, and this review has already been burned
   once by two representations drifting apart. So the integrated page is BUILT from the
   real home.html every time: same markup, same images, same video, same stylesheet,
   same main.js, same motion.js, same GSAP and ScrollTrigger. Nothing is recreated and
   nothing is a screenshot.

   Exactly three things change:

     1. Every ./ reference becomes /, because the page is served from
        /exploration/integrated/ and the assets are not.

     2. Act 02's stage is replaced by the chosen mount point, and `data-compound` goes with
        it. main.js guards its whole act 02 block behind `if (compoundEl)`, so removing
        that one attribute makes the production interface stand down cleanly while every
        other act — the rail, the apertures, the pins, act 05's drift, act 03's states —
        keeps running exactly as it does on the live site.

     3. That variant's stylesheet and a small boot module are added.

   The boot module wires V5's own two handovers into the real page: ENTER moves the
   camera to the door, and CONTINUE scrolls the visitor into act 03. That is the join
   the brief asks to be observed, and it can only be observed if it exists.
   ================================================================================== */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
/* The homepage SOURCE is home.html: index.html at the top of this folder is the
   published portal, and one path cannot be two files. */
const SRC = path.join(ROOT, 'pages/home.html')
const OUT_DIR = path.join(ROOT, 'exploration/integrated')
/* One generator, two acts 02. V5.3 stays published as the baseline the V6 subtraction
   is measured against; a fork of this file would be two copies of the same rewrite. */
const V = process.argv.includes('--v6') ? 'v6' : 'v5'
const OUT = path.join(OUT_DIR, V + '-full-site.html')

let html = fs.readFileSync(SRC, 'utf8')

/* --- 1. paths -------------------------------------------------------------------
   Every ./ that names a real top-level directory becomes /. It has to be all of them,
   not only the ones that follow a quote: a srcset is a COMMA-SEPARATED list, so a first
   pass that anchored on the opening quote rewrote candidate one and left candidates two
   through four pointing at /exploration/integrated/assets/. The browser then picked one
   of the survivors, reported complete=true with naturalWidth 0, and every photograph on
   the page was silently missing while the markup looked correct. */
/* The source is pages/home.html, one level down, so its references are ../ — and the
   dot-dot has to be consumed with the dot. Matching only './' turned '../assets/' into
   './assets/' and left every image pointing one directory above the generated page. */
const DIRS = ['assets', 'src', 'models', 'draco', 'exploration', 'public']
html = html.replace(new RegExp('(?:\\.\\.?/)+(' + DIRS.join('|') + ')/', 'g'), '/$1/')
const leftover = (html.match(/(?:\.\.?\/)+(?:assets|src|models|draco|exploration|public)\//g) || []).length

/* --- 2. act 02 ------------------------------------------------------------------- */
const open = html.indexOf('<section class="act" id="act-02"')
if (open < 0) throw new Error('act 02 not found in index.html')
const close = html.indexOf('</section>', html.indexOf('<!-- ===', open + 10) > 0 ? open : open)
/* find the section's own closing tag by counting nested sections */
let i = open, depth = 0, end = -1
while (i < html.length) {
  const nextOpen = html.indexOf('<section', i + 1)
  const nextClose = html.indexOf('</section>', i + 1)
  if (nextClose < 0) break
  if (nextOpen >= 0 && nextOpen < nextClose) { depth++; i = nextOpen; continue }
  if (depth === 0) { end = nextClose + '</section>'.length; break }
  depth--; i = nextClose
}
if (end < 0) throw new Error('act 02 closing tag not found')
void close

const ACT02 = `<!-- ================================================================================
     02 · COMPOUND / BUILDING / SUITE — the guided sales interface, V5.3 or V6.

     The section, its id, its data-act, its data-pin and its heading are the live site's.
     What is replaced is the STAGE: instead of production's SVG drawing with a record
     column beside it, this mounts the ${V.toUpperCase()} interface, which is the same module the
     standalone exploration mounts. data-compound is deliberately absent so main.js
     stands its own act 02 down.

     THE 02 -> 03 APERTURE IS STILL DESIGNED AND PARKED — BRIEF-seam-02-03.md carries
     that concept and nothing here depends on it. What IS wired, in V6 only, is the far
     smaller thing underneath it: exploration/study/v6/act03-link.js writes the suite the
     visitor actually chose into act 03's existing plate. main.js does that in syncPeak()
     behind an \`if (compoundEl)\` guard, and removing data-compound above takes the guard's
     subject away with it — which is why act 03 went on describing a Type B at $549,000
     after a visitor had chosen a Premium at $699,000. No layout is redesigned; the
     numbers are simply the ones that were picked.
     ================================================================================ -->
<section class="act" id="act-02" data-act="02" data-register="surveyed"
         data-pin="compound" aria-labelledby="h-02" style="padding:0">
  <h2 class="u-visually-hidden" id="h-02">121 private suites, 11 buildings</h2>
  <div class="${V}-host" data-pin-stage data-${V}-host></div>
</section>`

html = html.slice(0, open) + ACT02 + html.slice(end)

/* --- 3. the interface ------------------------------------------------------------ */
html = html.replace('<link rel="stylesheet" href="/src/site/index.css">',
  `<link rel="stylesheet" href="/src/site/index.css">
<link rel="stylesheet" href="/exploration/study/${V}/${V}.css">
<style>
  /* Act 02 becomes a full-height stage inside the real page. It is the only act that
     owns the whole viewport, which is what a pinned interactive act needs and what the
     production act 02 already asks for with data-pin.

     MIN-HEIGHT, NOT ONLY HEIGHT, AND THAT IS NOT BELT AND BRACES. mountV5 puts the
     class v5 on this element, and v5.css carries .v5{height:100%} at the same
     specificity as this rule. In dev the inline block below wins on order; in a BUILD
     Vite emits the bundled stylesheet as a <link> that lands after it, height:100%
     of an auto-height section resolves to zero, and act 02 collapses to a 1425x0 strip
     with nothing selectable in it. Measured on the built page: 0 of 11 buildings.
     A min-height cannot be undone by a height, whatever the order turns out to be. */
  .${V}-host{position:relative;height:100vh;min-height:100vh;width:100%;background:#060708}
  /* The page already has a persistent header carrying the mark and the location, so the
     interface's own standalone mark would be the same words twice on the same screen. */
  .${V}-host.${V} .mark{display:none!important}
  /* The site header sits above act 02's own controls. */
  /* A DESCENDANT SELECTOR NEEDS A DESCENDANT. mountV6 puts the class v6 on the HOST
     element itself, so the host carries both v6-host and v6 and there is no .v6 INSIDE
     a .v6-host to match — the first attempt at these overrides selected nothing at all.
     Compounded on the one element, they also outrank v6.css's own single-class rules,
     which is the other half of the problem: Vite emits that stylesheet as a link after
     this block, so at equal specificity it wins. Measured on the published page before
     this fix: Site plan at 32px under a 70px header, the way home at 98 where the
     comment claimed 70. */
  .${V}-host.${V} .topright,.${V}-host.${V} .nav{top:70px}
  /* THE WAY HOME KEEPS ITS PLACE IN BOTH PAGES. Standalone it sits under act 02's own
     mark; here that mark is hidden and the site's header is in the same band, so the
     button moves up to sit level with Site plan. It is one variable, so the two pages
     cannot drift into two different positions for the one control a lost visitor
     depends on. */
  /* TWO CLASSES, NOT ONE, and for the same reason min-height is spelled out above:
     v6.css declares --home-top on its own .v6 rule, and in a BUILD Vite emits that
     stylesheet as a link AFTER this inline block. At equal specificity the later rule
     wins, so the override worked on the dev server and was silently ignored in the
     published page — measured live at 98px where this claims 70. */
  .${V}-host.${V}{--home-top:70px}
</style>`)

html = html.replace('<script type="module" src="/src/site/main.js"></script>',
  `<script type="module" src="/src/site/main.js"></script>
<script type="module" src="/exploration/integrated/${V}-boot.js"></script>`)

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT, html)

const acts = [...html.matchAll(/data-act="(\d\d)"/g)].map((m) => m[1])
console.log('WROTE ' + path.relative(ROOT, OUT))
console.log('  acts present        ' + acts.join(' '))
console.log('  footer              ' + (html.includes('<footer class="footer">') ? 'yes' : 'MISSING'))
console.log('  real main.js        ' + (html.includes('/src/site/main.js') ? 'yes' : 'MISSING'))
console.log('  real stylesheet     ' + (html.includes('/src/site/index.css') ? 'yes' : 'MISSING'))
console.log('  ' + V + ' mount            ' + (html.includes('data-' + V + '-host') ? 'yes' : 'MISSING'))
const live = html.replace(/<!--[^]*?-->/g, '')
console.log('  production act02 UI ' + (live.includes('data-compound') ? 'STILL PRESENT' : 'stood down'))
console.log('  remaining ./ refs   ' + (html.match(/["'(]\.\//g) || []).length)
