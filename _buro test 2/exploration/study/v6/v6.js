/* ======================================================================================
   ACT 02 · V6 — THE MODEL IS THE INTERFACE.

   V5.3 is the technical baseline and none of it is rebuilt: the corrected eleven-building
   data, the pick proxies, direct building-to-building switching, the escape hierarchy and
   the site plan's state preservation all come from the same compound.js / compound3d.js
   this mounts. What changes is how much of it is a CONTROL PANEL.

   WHAT WAS REMOVED, and why each removal is safe:

     the building navigator      eleven numbered buttons on a rule across the dock. It
                                 worked, and it made the screen read as software. Measured
                                 in V5.3's own switching matrix, 19 of 20 building changes
                                 were made by clicking the model — the strip was carrying
                                 one case in twenty. It is gone; two chevrons at the edges
                                 of the frame carry that one case.

     the full-width dock         a bar the width of the screen appearing the moment a
                                 building was chosen is what made a selection feel like
                                 entering a mode. Nothing appears on selection now. The
                                 product panel arrives only when there is a product.

     the bay rail as the way in  the miniature bays were the only way to choose a suite,
                                 so the REAL DOORS — the thing the whole model exists to
                                 show — were decoration. The doors are the control now and
                                 the rail is demoted to what it is good at: reaching a door
                                 that is off screen.

     the legend, the counts,     everything that told the visitor about the interface
     the hints                   rather than about the place.

   WHAT REPLACED THEM: light, material, the camera, and a tag that sits on the thing it
   names. Nothing here draws a line through empty space, and nothing outlines a subject.
   ====================================================================================== */
import { buildCompound, TYPE_SPEC } from '/src/site/compound.js'

const STAGE = `
<div class="stage" data-stage>
  <div class="mount" data-mount></div>

  <!-- The two tags. One names a building, one names a door, and only ever one is up. -->
  <div class="tag tag--b" data-tag-b hidden></div>
  <div class="tag tag--d" data-tag-d hidden></div>

  <div class="mark" data-mark>
    <b>Luxe&nbsp;Corsa</b>
    <span>Lake Zurich, Illinois</span>
  </div>

  <div class="topright">
    <button class="quiet" type="button" data-overview hidden>← Overview</button>
    <button class="quiet" type="button" data-plan-open>Site plan</button>
  </div>

  <!-- THE ONE INSTRUCTION, and it retires the moment it has been obeyed. -->
  <div class="say" data-say>
    <p class="say__n" data-say-n>121</p>
    <p class="say__s" data-say-s>private suites · 98 available</p>
    <p class="say__t" data-say-t>Choose a building.</p>
  </div>

  <!-- The fallback, for the one switch in twenty the camera hides. No labels at rest. -->
  <button class="step step--prev" type="button" data-step="-1" aria-label="Previous building" hidden>‹</button>
  <button class="step step--next" type="button" data-step="1" aria-label="Next building" hidden>›</button>

  <!-- Secondary: reaching a door that is off screen. Never the way the idea is learnt. -->
  <div class="v6-rail" data-v6-rail hidden>
    <div class="v6-rail__bays" data-bays role="group" aria-label="Suites in this building"></div>
  </div>

  <!-- Only when there is a product. -->
  <div class="prod" data-prod hidden></div>
</div>`

const PLAN = `
<div class="v6 plan" data-plan hidden>
  <div class="plan__bar">
    <button class="plan__exit" type="button" data-plan-exit><span aria-hidden="true">←</span> Back to 3D <kbd>Esc</kbd></button>
    <div class="plan__t"><b>Site plan</b><span data-plan-where>Whole compound</span></div>
    <div class="plan__key">
      <span><i style="background:var(--sand)"></i>Premium</span>
      <span><i style="background:var(--steel-55)"></i>Standard</span>
      <span><i style="background:var(--ink-10)"></i>Sold</span>
    </div>
  </div>
  <div class="plan__grid"><div class="plan__map" data-plan-map></div></div>
</div>`

export function mountV6(host, opts = {}) {
  host.classList.add('v6')
  host.innerHTML = STAGE
  const holder = document.createElement('div')
  holder.innerHTML = PLAN
  const plan = holder.firstElementChild
  document.body.appendChild(plan)

  const q = (sel, root = host) => root.querySelector(sel)
  const stage = q('[data-stage]'), mount = q('[data-mount]')
  const tagB = q('[data-tag-b]'), tagD = q('[data-tag-d]')
  const say = q('[data-say]'), sayN = q('[data-say-n]'), sayS = q('[data-say-s]'), sayT = q('[data-say-t]')
  const ov = q('[data-overview]'), planBtn = q('[data-plan-open]')
  const railEl = q('[data-v6-rail]'), baysEl = q('[data-bays]')
  const prod = q('[data-prod]')
  const steps = [...host.querySelectorAll('[data-step]')]
  const planMap = q('[data-plan-map]', plan)

  const compound = buildCompound(mount)
  let gl = null, THREE = null
  const S = { level: 'compound', building: null, suite: null, hover: null, hoverSuite: null, preview: null, plan: false, entered: false }
  const TOTAL = compound.suites.length
  const AVAILABLE = compound.suites.filter((s) => !s.sold).length
  const kind = (t) => (t === 'A' ? 'Premium' : 'Standard')
  const sqft = (t) => TYPE_SPEC[t].total.replace(/SQ FT/i, 'sq ft')
  const price = (t) => TYPE_SPEC[t].price.replace(/^FROM\s*/i, '')
  const short = (t) => '$' + Math.round(Number(price(t).replace(/[^0-9]/g, '')) / 1000) + 'K'

  /* --- state -------------------------------------------------------------------- */
  function hoverBuilding(b) {
    if (S.hover === b) return
    S.hover = b
    gl?.setHoverBuilding(b ? b.num : null)
    stage.dataset.hot = b && !S.building ? 'true' : 'false'
    paint()
  }
  function previewBuilding(b) {
    if (S.preview === b) return
    S.preview = b
    gl?.setPreviewBuilding(b ? b.num : null)
    paint()
  }
  function hoverSuite(s) {
    if (S.hoverSuite === s) return
    S.hoverSuite = s
    gl?.setHoverSuite(s || null)
    paint()
  }
  function selectBuilding(b) {
    if (!b) return
    Object.assign(S, { building: b, suite: null, hover: null, hoverSuite: null, preview: null, level: 'building', entered: false })
    stage.dataset.hot = 'false'
    gl?.setLevel('building', b.num)
    paint(); renderBays(); paint()
    opts.onLevel?.(S.level, S)
  }
  function selectSuite(s) {
    if (!s || s.sold) return
    Object.assign(S, { suite: s, building: s.bldg, hoverSuite: null, preview: null, level: 'suite', entered: false })
    gl?.setLevel('suite', s.bldg.num, s.index)
    paint()
    opts.onLevel?.(S.level, S)
    opts.onSuite?.(s)
  }
  function overview() {
    Object.assign(S, { level: 'compound', building: null, suite: null, hover: null, hoverSuite: null, preview: null, entered: false })
    stage.dataset.hot = 'false'
    gl?.setLevel('compound')
    paint()
    opts.onLevel?.(S.level, S)
  }
  function backToBuilding() {
    if (S.level !== 'suite' || !S.building) return overview()
    const b = S.building
    Object.assign(S, { suite: null, level: 'building', preview: null, entered: false })
    gl?.setLevel('building', b.num)
    paint()
    opts.onLevel?.(S.level, S)
  }
  function stepBuilding(d) {
    const list = compound.buildings
    if (!S.building) return
    const i = list.indexOf(S.building)
    const next = list[(i + d + list.length) % list.length]
    if (next && next !== S.building) selectBuilding(next)
  }
  function enterSuite() {
    if (!S.suite) return
    S.entered = true
    gl?.enterSuite(S.suite.index)
    paint()
    opts.onEnter?.(S.suite)
  }

  /* --- the two tags, both of which sit ON the thing they name -------------------- */
  const anchors = new Map()
  function buildAnchors() {
    for (const b of compound.buildings) {
      const runs = new Map()
      for (const s of b.suites) { const k = s.ang.toFixed(2); if (!runs.has(k)) runs.set(k, []); runs.get(k).push(s) }
      const pts = []
      for (const list of runs.values()) {
        const r = -(list[0].ang * Math.PI) / 180, ux = Math.cos(r), uz = -Math.sin(r)
        const proj = list.map((s) => ({ s, u: s.cx * ux + s.cy * uz })).sort((a, b2) => a.u - b2.u)
        const first = proj[0].s, last = proj[proj.length - 1].s
        const halfA = (first.slot ?? first.w) / 2, halfB = (last.slot ?? last.w) / 2
        const d = (first.depth ?? first.dep) / 2
        const nx = first.faceNormal[0], nz = first.faceNormal[1]
        const x0 = first.cx - ux * halfA, z0 = first.cy - uz * halfA
        const x1 = last.cx + ux * halfB, z1 = last.cy + uz * halfB
        pts.push([x0 + nx * d, z0 + nz * d], [x1 + nx * d, z1 + nz * d], [x1 - nx * d, z1 - nz * d], [x0 - nx * d, z0 - nz * d])
      }
      anchors.set(b.num, pts)
    }
  }

  function drawTags() {
    if (!gl || !THREE || S.plan) { tagB.hidden = true; tagD.hidden = true; return }
    const r = stage.getBoundingClientRect()
    const w = r.width, h = r.height
    const safe = opts.topSafe ?? 56

    /* THE DOOR TAG WINS. Inside a building the subject is a door, and naming the
       building over the top of it would be answering a question nobody asked. */
    const hs = S.hoverSuite
    if (hs && S.level !== 'compound') {
      const p = gl.doorPoint(hs.index, w, h)
      if (p) {
        const t = TYPE_SPEC[hs.type]
        tagD.dataset.s = hs.sold ? 'sold' : (S.suite === hs ? 'on' : 'hover')
        tagD.style.left = Math.max(120, Math.min(w - 130, p[0])) + 'px'
        tagD.style.top = Math.max(safe, p[1] - 96) + 'px'
        tagD.innerHTML = hs.sold
          ? `<span class="tag__n">${hs.ref}</span><span class="tag__m">Sold</span>`
          : `<span class="tag__n">${hs.ref}</span>`
            + `<span class="tag__m">${kind(hs.type)} · ${sqft(hs.type)}</span>`
            + `<span class="tag__p">${short(hs.type)}</span>`
        tagD.hidden = false
        tagB.hidden = true
        return
      }
    }
    tagD.hidden = true

    const subject = S.suite ? null : (S.preview || S.hover)
    if (!subject) { tagB.hidden = true; return }
    const pts = anchors.get(subject.num)
    if (!pts) { tagB.hidden = true; return }
    const H = gl.roofY ?? 0
    const v = new THREE.Vector3()
    let top = 1e9, topX = 0, behind = false
    for (const [x, z] of pts) {
      v.set(x, H, z); gl.site.localToWorld(v); v.project(gl.camera)
      if (v.z > 1) { behind = true; break }
      const px = (v.x * 0.5 + 0.5) * w, py = (-v.y * 0.5 + 0.5) * h
      if (py < top) { top = py; topX = px }
    }
    if (behind) { tagB.hidden = true; return }
    tagB.dataset.s = S.preview ? 'preview' : 'hover'
    tagB.style.left = Math.max(110, Math.min(w - 120, topX)) + 'px'
    tagB.style.top = Math.max(safe, top - 78) + 'px'
    tagB.innerHTML = `<span class="tag__n">${subject.num}</span>`
      + `<span class="tag__m">${subject.open} of ${subject.suites.length} available</span>`
      + `<span class="tag__go">${S.preview ? 'Switch →' : 'View →'}</span>`
    tagB.hidden = false
  }

  /* --- the rail: secondary, and it says so by being small ----------------------- */
  function renderBays() {
    baysEl.replaceChildren()
    const list = S.building?.suites || []
    if (!list.length) return
    const GAP = 2
    const units = list.reduce((a, s) => a + (s.slot ?? s.w), 0) || 1
    const track = Math.max(200, Math.min(520, host.clientWidth * 0.4))
    const perUnit = Math.min(1.05, Math.max(0.34, (track - GAP * (list.length - 1)) / units))
    for (const s of list) {
      const b = document.createElement('button')
      b.type = 'button'; b.className = 'v6-bay'
      b.dataset.bay = ''
      b.dataset.sold = s.sold ? 'true' : 'false'
      b.dataset.type = s.type
      b.style.width = Math.max(7, Math.round((s.slot ?? s.w) * perUnit)) + 'px'
      b.disabled = s.sold
      b.setAttribute('aria-label', `Suite ${s.ref}, ${kind(s.type)}${s.sold ? ', sold' : ', available'}`)
      b.addEventListener('pointerenter', () => hoverSuite(s))
      b.addEventListener('pointerleave', () => hoverSuite(null))
      b.addEventListener('focus', () => hoverSuite(s))
      b.addEventListener('blur', () => hoverSuite(null))
      b.addEventListener('click', () => selectSuite(s))
      b._s = s
      baysEl.appendChild(b)
    }
  }

  /* --- paint --------------------------------------------------------------------- */
  function paint() {
    const b = S.building, s = S.suite
    stage.dataset.level = S.level
    ov.hidden = S.level === 'compound'
    say.hidden = S.level !== 'compound'
    railEl.hidden = S.level === 'compound'
    for (const el of steps) el.hidden = S.level === 'compound'

    if (S.level === 'compound') {
      const h = S.hover
      sayN.textContent = h ? h.num : String(TOTAL)
      sayS.textContent = h ? `${h.suites.length} suites · ${h.open} available` : `private suites · ${AVAILABLE} available`
      sayT.textContent = h ? 'Click to go in.' : 'Choose a building.'
    }

    /* THE PRODUCT PANEL EXISTS ONLY WHEN THERE IS A PRODUCT. Nothing appears when a
       building is selected — that is what made a selection feel like a mode. */
    /* AND IT IS EMPTIED, not merely hidden. Switching buildings clears the suite, so
       leaving the old panel's markup in the document keeps an ENTER for a product
       nobody has chosen — hidden, but present, and present is what a keyboard, a
       screen reader and a query all find. There is no product, so there is no
       product markup. */
    prod.hidden = !s
    if (!s) prod.replaceChildren()
    if (s) {
      const t = TYPE_SPEC[s.type]
      prod.innerHTML = S.entered
        ? `<p class="prod__k">You are in</p>
           <p class="prod__n">${s.ref}</p>
           <p class="prod__t"><em data-type="${s.type}">${kind(s.type)}</em> · ${sqft(s.type)}</p>
           <p class="prod__p">${price(s.type)}</p>
           <button class="go" type="button" data-go><span>Continue to the suite</span><i aria-hidden="true">↓</i></button>`
        : `<p class="prod__k">Suite</p>
           <p class="prod__n">${s.ref}</p>
           <p class="prod__t"><em data-type="${s.type}">${kind(s.type)}</em> · ${sqft(s.type)}</p>
           <p class="prod__p">${price(s.type)}</p>
           <button class="go" type="button" data-enter><span>Enter suite</span><i aria-hidden="true">→</i></button>
           <button class="specs" type="button" data-specs>Full specs →</button>`
    }

    for (const el of baysEl.children) {
      el.setAttribute('aria-pressed', el._s === s ? 'true' : 'false')
      if (el._s === S.hoverSuite && el._s !== s) el.setAttribute('data-hot', 'true')
      else el.removeAttribute('data-hot')
    }
    drawTags()
  }

  ov.addEventListener('click', overview)
  for (const el of steps) el.addEventListener('click', () => stepBuilding(Number(el.dataset.step)))
  prod.addEventListener('click', (e) => {
    if (e.target.closest('[data-enter]')) enterSuite()
    else if (e.target.closest('[data-go]')) opts.onContinue?.(S.suite)
    else if (e.target.closest('[data-specs]')) opts.onSpecs?.(S.suite)
  })
  /* THE ESCAPE HIERARCHY IS V5.3'S AND IS NOT TOUCHED: one step per press. */
  const onKey = (e) => {
    if (e.key !== 'Escape') return
    if (S.plan) { closePlan(); return }
    if (S.level === 'suite') { backToBuilding(); return }
    if (S.level === 'building') { overview(); return }
  }
  addEventListener('keydown', onKey)

  /* --- the site plan, a reference layer ------------------------------------------ */
  let planBuilt = false, planSvg = null
  function fitPlan() {
    if (!planSvg) return
    try {
      const bb = planSvg.getBBox()
      if (!bb.width || !bb.height) return
      const m = Math.max(bb.width, bb.height) * 0.05
      planSvg.setAttribute('viewBox', `${bb.x - m} ${bb.y - m} ${bb.width + m * 2} ${bb.height + m * 2}`)
    } catch (e) { /* no laid-out box yet; leave the crop alone */ }
  }
  function buildPlan() {
    if (planBuilt) return
    planBuilt = true
    planSvg = compound.svg.cloneNode(true)
    planSvg.style.width = '100%'; planSvg.style.height = '100%'; planSvg.style.visibility = 'visible'
    planSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    planMap.appendChild(planSvg)
    const NS = 'http://www.w3.org/2000/svg'
    for (const b of compound.buildings) {
      const bb = b.box
      const g = planSvg.querySelector(`g[data-building="${b.num}"]`)
      if (bb && bb.width) {
        const t = document.createElementNS(NS, 'text')
        t.textContent = b.num
        t.setAttribute('x', bb.x + bb.width / 2); t.setAttribute('y', bb.y + bb.height / 2)
        t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'middle')
        t.setAttribute('class', 'pnum')
        planSvg.appendChild(t)
        if (g) {
          /* One target per building, at the size the drawing measured it: a <g> is only
             hit where its children paint, and the centre of an eleven-bay run is air. */
          const hit = document.createElementNS(NS, 'rect')
          hit.setAttribute('x', bb.x); hit.setAttribute('y', bb.y)
          hit.setAttribute('width', bb.width); hit.setAttribute('height', bb.height)
          hit.setAttribute('fill', 'transparent'); hit.setAttribute('class', 'phit')
          hit.setAttribute('role', 'button'); hit.setAttribute('tabindex', '0')
          hit.setAttribute('aria-label', `Building ${b.num}, ${b.open} of ${b.suites.length} available`)
          const go = () => { closePlan(); selectBuilding(b) }
          hit.addEventListener('click', go)
          hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } })
          hit.addEventListener('pointerenter', () => g.setAttribute('data-hot', 'true'))
          hit.addEventListener('pointerleave', () => g.removeAttribute('data-hot'))
          g.appendChild(hit)
          b._planGroup = g
        }
      }
    }
  }
  function openPlan() {
    buildPlan()
    S.plan = true
    plan.hidden = false
    drawTags()
    for (const b of compound.buildings) b._planGroup?.toggleAttribute('data-current', b === S.building)
    if (planSvg) {
      planSvg.querySelectorAll('[data-here]').forEach((el) => el.removeAttribute('data-here'))
      if (S.suite) planSvg.querySelector(`[data-ref="${CSS.escape(S.suite.ref)}"]`)?.setAttribute('data-here', 'true')
    }
    const t = q('[data-plan-where]', plan)
    if (t) t.textContent = S.suite ? `Suite ${S.suite.ref}` : S.building ? `Building ${S.building.num}` : 'Whole compound'
    requestAnimationFrame(() => requestAnimationFrame(fitPlan))
  }
  function closePlan() { S.plan = false; plan.hidden = true; paint() }
  planBtn.addEventListener('click', openPlan)
  q('[data-plan-exit]', plan).addEventListener('click', closePlan)
  const onResize = () => { if (S.plan) fitPlan() }
  addEventListener('resize', onResize)

  /* --- the model ------------------------------------------------------------------ */
  let raf = 0
  const api = {
    S, compound, host, stage,
    selectBuilding, selectSuite, hoverBuilding, hoverSuite, previewBuilding,
    overview, backToBuilding, stepBuilding, enterSuite, openPlan, closePlan,
    get gl() { return gl }, get THREE() { return THREE },
    destroy() {
      cancelAnimationFrame(raf)
      removeEventListener('keydown', onKey)
      removeEventListener('resize', onResize)
      plan.remove()
    },
  }

  import('/src/site/compound3d.js').then(async ({ initCompound3D }) => {
    gl = initCompound3D(mount, compound)
    if (!gl) throw new Error('no webgl')
    stage.setAttribute('data-gl', 'on')
    THREE = await import('three')
    const bldgOf = (n) => compound.byNum.get(n)
    gl.onHoverBuilding = (n) => hoverBuilding(n ? bldgOf(n) : null)
    gl.onPreviewBuilding = (n) => previewBuilding(n ? bldgOf(n) : null)
    gl.onHoverSuite = (i) => hoverSuite(i == null ? null : compound.suites[i])
    gl.onPickBuilding = (n) => { const b = bldgOf(n); if (b) selectBuilding(b) }
    gl.onPickSuite = (i) => { const s = compound.suites[i]; if (s) selectSuite(s) }
    buildAnchors()
    gl.roofY = gl.roofTopLocal ?? 0
    const tick = () => { raf = requestAnimationFrame(tick); drawTags() }
    requestAnimationFrame(() => { gl.setLevel('compound'); paint(); tick() })
    opts.onReady?.(api)
  }).catch((e) => console.warn('[v6] the model did not stand', e))

  paint()
  return api
}
