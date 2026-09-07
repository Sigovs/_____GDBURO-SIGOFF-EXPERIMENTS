/* ======================================================================================
   ACT 02 · V5.2 — THE GUIDED SALES INTERFACE, as one mountable module.

   This exists as a module rather than as a script inside a page because the interface has
   to run in TWO places and be the SAME interface in both: the standalone exploration, and
   act 02 of the real homepage. A copy in each would drift, and this project has already
   paid for that once — the drawing and the model were kept in step by handing one bay
   list to both, and this is the same discipline applied to the interface.

   mountV5(host) builds the stage inside `host`, mounts the compound (drawing first, then
   the model on top of it), and returns a small API. The site plan is appended to the
   document rather than to the host, because it is a full-screen utility and act 02 is a
   pinned section three stacking contexts deep.
   ====================================================================================== */
import { buildCompound, TYPE_SPEC } from '/src/site/compound.js'

const STAGE = `
<div class="stage" data-stage>
  <div class="mount" data-mount></div>
  <div data-tag hidden></div>
  <div class="mark"><b>Luxe&nbsp;Corsa</b><span>Lake Zurich, Illinois</span></div>
  <div class="nav">
    <button class="ctx" type="button" data-ctx hidden></button>
    <button type="button" data-overview hidden>← Overview</button>
  </div>
  <div class="dock" data-dock data-level="compound">
    <!-- THE BUILDING NAVIGATOR. One line across the top of the dock, present from
         the moment a building is chosen and never anywhere else. It is a SPATIAL
         SELECTOR, not pagination: the compound is numbered 01 to 11 along its own
         drive, so the strip is that order and the arrows are its neighbours. -->
    <nav class="nav5" data-nav hidden aria-label="Buildings">
      <button class="nav5__step" type="button" data-nav-prev aria-label="Previous building">‹</button>
      <div class="nav5__strip" data-nav-strip></div>
      <button class="nav5__step" type="button" data-nav-next aria-label="Next building">›</button>
    </nav>
    <div class="cell">
      <div class="who__k" data-who-k>Luxe Corsa</div>
      <div class="who__f" data-who-f>121</div>
      <div class="who__s" data-who-s>private suites · 11 buildings</div>
      <div class="tell" data-tell>Choose a building.</div>
      <button class="plink" type="button" data-plan-open>Site plan</button>
    </div>
    <div class="cell bayswrap" data-cell-bays hidden>
      <div class="bayhead" data-bay-head></div>
      <div class="bays" data-bays role="group" aria-label="Suites in this building"></div>
    </div>
    <div class="cell right" data-cell-right hidden></div>
  </div>
</div>`

const PLAN = `
<div class="v5 plan" data-plan hidden>
  <div class="plan__bar">
    <button class="plan__exit" type="button" data-plan-exit>
      <span aria-hidden="true">←</span> Back to 3D <kbd>Esc</kbd>
    </button>
    <div class="plan__t"><b>Site plan</b><span data-plan-where>Whole compound</span></div>
    <div class="plan__key">
      <span><i style="background:var(--sand)"></i>Premium — Type A</span>
      <span><i style="background:var(--steel-55)"></i>Standard — Type B</span>
      <span><i style="background:var(--ink-10)"></i>Sold</span>
    </div>
  </div>
  <div class="plan__grid">
    <div class="plan__map" data-plan-map></div>
    <div class="plan__list" data-plan-list><h4>Buildings</h4></div>
  </div>
</div>`

export function mountV5(host, opts = {}) {
  host.classList.add('v5')
  host.innerHTML = STAGE
  const planEl = document.createElement('div')
  planEl.innerHTML = PLAN
  const plan = planEl.firstElementChild
  document.body.appendChild(plan)

  const q = (sel, root = host) => root.querySelector(sel)
  const stage = q('[data-stage]'), mount = q('[data-mount]'), dock = q('[data-dock]')
  const tag = q('[data-tag]'), ov = q('[data-overview]'), ctx = q('[data-ctx]')
  const baysEl = q('[data-bays]'), bayHead = q('[data-bay-head]')
  const cellBays = q('[data-cell-bays]'), cellRight = q('[data-cell-right]')
  const whoK = q('[data-who-k]'), whoF = q('[data-who-f]'), whoS = q('[data-who-s]'), tell = q('[data-tell]')
  const planMap = q('[data-plan-map]', plan), planList = q('[data-plan-list]', plan)
  const navEl = q('[data-nav]'), navStrip = q('[data-nav-strip]')

  const compound = buildCompound(mount)
  let gl = null, THREE = null
  const S = { level: 'compound', building: null, suite: null, hover: null, hoverSuite: null, preview: null, plan: false, entered: false }
  const TOTAL = compound.suites.length
  const AVAILABLE = compound.suites.filter((s) => !s.sold).length
  const say = (v) => String(v).replace(/\bSQ FT\b/g, 'sq ft').replace(/\bTYPE\b/g, 'Type').replace(/\bFROM\b/g, 'from')
  const kind = (t) => (t === 'A' ? 'Premium' : 'Standard')
  const chip = (t) => `<span class="chip chip--${t.toLowerCase()}">${kind(t)} · Type ${t}</span>`

  /* --- state ---------------------------------------------------------------------- */
  function hoverBuilding(b) {
    if (S.hover === b) return
    S.hover = b
    gl?.setHoverBuilding(b ? b.num : null)
    stage.dataset.hot = b && !S.building ? 'true' : 'false'
    paint()
  }
  function hoverSuite(s) { if (S.hoverSuite === s) return; S.hoverSuite = s; gl?.setHoverSuite(s || null); paint() }
  /* The building offered as the next one while another is committed. Distinct from
     hover, which is the question asked from the compound, and painted differently:
     committed is the compound's own cold light, preview is sand. */
  function previewBuilding(b) {
    if (S.preview === b) return
    S.preview = b
    gl?.setPreviewBuilding(b ? b.num : null)
    paint()
  }
  function selectBuilding(b) {
    if (!b) return
    /* SWITCHING BUILDINGS CLEARS THE PRODUCT CONTEXT. A suite belongs to the building
       it is in; carrying 03's choice into 04 would leave a price on screen for a room
       the visitor is no longer looking at. ENTER goes with it, which is the point. */
    Object.assign(S, { building: b, suite: null, hover: null, hoverSuite: null, preview: null, level: 'building', entered: false })
    stage.dataset.hot = 'false'
    gl?.setLevel('building', b.num)
    /* the bays cell has to be laid out before renderBays can measure the track it must
       fit; paint() is what reveals it, so it goes first */
    paint(); renderNav(); renderBays(); paint()
    opts.onLevel?.(S.level, S)
  }

  /* Step to a neighbour along the compound's own numbering. The list is the drive's
     order, so previous and next are spatial rather than alphabetical. */
  function stepBuilding(d) {
    const list = compound.buildings
    if (!S.building) return
    const i = list.indexOf(S.building)
    const next = list[(i + d + list.length) % list.length]
    if (next && next !== S.building) selectBuilding(next)
  }
  function selectSuite(s) {
    if (!s || s.sold) return
    Object.assign(S, { suite: s, building: s.bldg, hoverSuite: null, level: 'suite', entered: false })
    gl?.setLevel('suite', s.bldg.num, s.index)
    paint()
    opts.onLevel?.(S.level, S)
  }
  /* THE GLOBAL ESCAPE. One action, one place, and it always means the same thing. */
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
  /* ENTER. The commitment, and the handover: the camera goes to the door and the host
     page is told, so the site can carry the visitor on into act 03. */
  function enterSuite() {
    if (!S.suite) return
    S.entered = true
    gl?.enterSuite(S.suite.index)
    paint()
    opts.onEnter?.(S.suite)
  }

  /* --- the building tag: a label that never takes the pointer ---------------------- */
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
  function drawTag() {
    /* THE TAG NAMES WHAT THE POINTER IS ON. While a building is committed and another
       is being considered, the thing that needs naming is the OFFER — the visitor
       already knows where they are, and the dock and the navigator both say so. It
       comes up sand rather than red, which is the same distinction the model makes. */
    const subject = S.suite ? null : (S.preview || S.building || S.hover)
    if (!gl || !THREE || !subject || !anchors.size || S.plan) { tag.hidden = true; return }
    const pts = anchors.get(subject.num)
    if (!pts) { tag.hidden = true; return }
    const H = gl.roofY ?? 0
    const r = stage.getBoundingClientRect()
    const w = r.width, h = r.height
    const v = new THREE.Vector3()
    let top = 1e9, topX = 0, behind = false
    for (const [x, z] of pts) {
      v.set(x, H, z); gl.site.localToWorld(v); v.project(gl.camera)
      if (v.z > 1) { behind = true; break }
      const px = (v.x * 0.5 + 0.5) * w, py = (-v.y * 0.5 + 0.5) * h
      if (py < top) { top = py; topX = px }
    }
    if (behind) { tag.hidden = true; return }
    const on = !!S.building && !S.preview
    tag.id = tag.id || 'tag'
    tag.dataset.s = on ? 'on' : 'hover'
    tag.style.left = Math.max(96, Math.min(w - 110, topX)) + 'px'
    /* The tag must clear whatever the HOST puts across the top of the stage: nothing
       standalone, a fixed site header inside the page. */
    tag.style.top = Math.max(opts.topSafe ?? 56, top - 74) + 'px'
    tag.innerHTML = `<span class="n">${subject.num}<i>${subject.open} of ${subject.suites.length} available</i></span>`
      + (on ? '' : '<span class="go">Click to view →</span>')
    tag.hidden = false
  }

  /* --- the miniature bays ---------------------------------------------------------- */
  /* THE NAVIGATOR. Eleven numbers on one line, in the compound's own order, and it
     is deliberately not eleven buttons of equal shout: the current building is the
     only one set solid, its neighbours are reachable, and the arrows say which way
     the drive runs. Rendered once per building change rather than per paint, because
     the set of buildings never changes and only the marks on it do. */
  function renderNav() {
    if (!navStrip) return
    navStrip.replaceChildren()
    for (const b of compound.buildings) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'nav5__b'
      el.dataset.navB = b.num
      el.textContent = b.num
      el.setAttribute('aria-label', 'Building ' + b.num + ', ' + b.open + ' of ' + b.suites.length + ' available')
      el.addEventListener('pointerenter', () => previewBuilding(b))
      el.addEventListener('pointerleave', () => previewBuilding(null))
      el.addEventListener('focus', () => previewBuilding(b))
      el.addEventListener('blur', () => previewBuilding(null))
      el.addEventListener('click', () => selectBuilding(b))
      el._b = b
      navStrip.appendChild(el)
    }
  }

  function renderBays() {
    baysEl.replaceChildren()
    const list = S.building?.suites || []
    /* THE RATIO IS THE POINT, so it is not allowed to be compressed by the layout.
       A first pass sized each bay as 22 + share*15 px, which is an offset plus a share —
       and an offset flattens a ratio. Measured, a 30ft premium bay came out 37px against
       a 23ft standard at 34px: 1.088, where the building itself is 1.304. Premium had
       stopped reading as wider, which is the one thing this control exists to show.

       Every bay is now the SAME number of pixels per foot, solved so the run fits the
       cell it is in and clamped so a bay is never unreadably thin or comically wide.
       Ratio in, ratio out. */
    const GAP = 2
    const units = list.reduce((a, s) => a + (s.slot ?? s.w), 0) || 1
    const track = Math.max(240, dock.clientWidth - 248 - 360 - 52)
    const perUnit = Math.min(1.72, Math.max(0.60, (track - GAP * Math.max(0, list.length - 1)) / units))
    const nA = list.filter((s) => s.type === 'A').length
    const nSold = list.filter((s) => s.sold).length
    bayHead.innerHTML = `<em>Suites</em><i>${nA} premium</i><i class="b">${list.length - nA} standard</i>`
      + (nSold ? `<i class="s">${nSold} sold</i>` : '')
    for (const s of list) {
      const b = document.createElement('button')
      b.type = 'button'; b.className = 'v5-bay'; b.dataset.bay = ''
      b.dataset.sold = s.sold ? 'true' : 'false'
      b.dataset.type = s.type
      /* WIDTH COMES FROM THE MODEL: a premium bay is 30:23 wider in the building, so it
         is 30:23 wider here. Nothing about premium is asserted; it is measured. */
      b.style.width = Math.max(13, Math.round((s.slot ?? s.w) * perUnit)) + 'px'
      b.disabled = s.sold
      b.setAttribute('aria-label', `Suite ${s.ref}, ${kind(s.type)} Type ${s.type}${s.sold ? ', sold' : ', available'}`)
      b.innerHTML = `<span class="v5-bay__t">${s.ordinal} · ${s.sold ? 'Sold' : kind(s.type)}</span>`
      b.addEventListener('pointerenter', () => hoverSuite(s))
      b.addEventListener('pointerleave', () => hoverSuite(null))
      b.addEventListener('focus', () => hoverSuite(s))
      b.addEventListener('blur', () => hoverSuite(null))
      b.addEventListener('click', () => selectSuite(s))
      b._s = s
      baysEl.appendChild(b)
    }
  }

  /* --- paint ----------------------------------------------------------------------- */
  function paint() {
    dock.dataset.level = S.level
    const b = S.building, s = S.suite
    ov.hidden = S.level === 'compound'
    ctx.hidden = S.level !== 'suite'
    if (S.level === 'suite' && b) ctx.textContent = '← Building ' + b.num
    q('[data-plan-open]').hidden = S.level !== 'compound'
    cellBays.hidden = S.level === 'compound'
    cellRight.hidden = S.level === 'compound'

    /* The navigator exists from the moment there is something to navigate BETWEEN,
       and it is in the same place in every state that has it — a control that moves
       between states is a control the visitor has to find twice. */
    if (navEl) navEl.hidden = S.level === 'compound'
    if (navStrip) {
      for (const el of navStrip.children) {
        el.setAttribute('aria-current', el._b === b ? 'true' : 'false')
        if (el._b === S.preview && el._b !== b) el.setAttribute('data-preview', 'true')
        else el.removeAttribute('data-preview')
      }
    }

    if (S.level === 'suite' && s) {
      const t = TYPE_SPEC[s.type]
      whoK.textContent = 'Suite'; whoF.textContent = s.ref
      whoS.innerHTML = `Building ${b.num} · <b>available</b>`
      tell.innerHTML = chip(s.type)
      cellRight.innerHTML = S.entered
        ? `<div class="price"><span class="k">${say(t.total)}</span><span class="v">${t.price.replace('FROM ', '')}</span><span class="a">${t.capacity.toLowerCase()}</span></div>
           <button class="v5-enter" type="button" data-go><span class="t"><i>You are in</i>Continue to the suite</span><span class="a">↓</span></button>`
        : `<div class="price"><span class="k">${say(t.total)}</span><span class="v">${t.price.replace('FROM ', '')}</span><span class="a">${t.footprint} · ${t.capacity.toLowerCase()}</span></div>
           <button class="v5-enter" type="button" data-enter><span class="t"><i>Next</i>Enter suite ${s.ref}</span><span class="a">→</span></button>`
    } else if (S.level === 'building' && b) {
      const hs = S.hoverSuite
      whoK.textContent = 'Building'; whoF.textContent = b.num
      whoS.innerHTML = `${b.suites.length} suites · <b>${b.open} available</b>`
      tell.innerHTML = hs ? `Suite ${hs.ordinal} ${chip(hs.type)}` : '<span class="tell--go">Choose a suite.</span>'
      cellRight.innerHTML = hs
        ? `<div class="price"><span class="k">${kind(hs.type)} · Type ${hs.type}</span><span class="v">${TYPE_SPEC[hs.type].price.replace('FROM ', '')}</span><span class="a">${say(TYPE_SPEC[hs.type].total)} · ${TYPE_SPEC[hs.type].footprint}</span></div>`
        : `<div class="next"><span class="k">Next</span><span class="v">Pick a suite below</span><span class="a">Each bay is one garage suite. Its real door lights up on the model.</span></div>`
    } else {
      const h = S.hover
      whoK.textContent = h ? 'Building' : 'Luxe Corsa'
      whoF.textContent = h ? h.num : String(TOTAL)
      whoS.innerHTML = h
        ? `${h.suites.length} suites · <b>${h.open} available</b>`
        : `private suites · 11 buildings · <b>${AVAILABLE} available</b>`
      tell.innerHTML = h ? '<span class="tell--go">Click to view it.</span>' : 'Choose a building.'
    }
    for (const el of baysEl.children) {
      el.setAttribute('aria-pressed', el._s === s ? 'true' : 'false')
      if (el._s === S.hoverSuite && el._s !== s) el.setAttribute('data-hot', 'true')
      else el.removeAttribute('data-hot')
    }
    drawTag()
  }

  ov.addEventListener('click', overview)
  ctx.addEventListener('click', backToBuilding)
  q('[data-nav-prev]')?.addEventListener('click', () => stepBuilding(-1))
  q('[data-nav-next]')?.addEventListener('click', () => stepBuilding(1))
  cellRight.addEventListener('click', (e) => {
    if (e.target.closest('[data-enter]')) enterSuite()
    else if (e.target.closest('[data-go]')) opts.onContinue?.(S.suite)
  })
  /* ONE PREDICTABLE HIERARCHY, one step at a time. Escape used to jump from a suite
     all the way home, so the same key meant "close this" in one place and "abandon
     everything" in another. It now undoes exactly the last commitment:

       site plan open   ->  close it, and the 3D state underneath is untouched
       suite chosen     ->  back to its building
       building chosen  ->  back to the compound
       already home     ->  nothing */
  const onKey = (e) => {
    if (e.key !== 'Escape') return
    if (S.plan) { closePlan(); return }
    if (S.level === 'suite') { backToBuilding(); return }
    if (S.level === 'building') { overview(); return }
  }
  addEventListener('keydown', onKey)

  /* --- the site plan --------------------------------------------------------------- */
  let planBuilt = false, planSvg = null
  function fitPlan() {
    if (!planSvg) return
    try {
      const bb = planSvg.getBBox()
      if (!bb.width || !bb.height) return
      const m = Math.max(bb.width, bb.height) * 0.05
      planSvg.setAttribute('viewBox', (bb.x - m) + ' ' + (bb.y - m) + ' ' + (bb.width + m * 2) + ' ' + (bb.height + m * 2))
    } catch (e) { /* a drawing with no laid-out box has no bbox; leave the crop alone */ }
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
      /* THE NUMBER GOES WHERE THE BUILDING WAS MEASURED, not where a clone reports it.
         getBBox on a node inside a panel that has never been laid out returns zeros, so
         the first pass stacked every number in one corner and only the last one showed.
         compound.js already measured each building's box on the mounted drawing; that
         is the honest coordinate and it is reused. */
      const bb = b.box
      if (bb && bb.width) {
        const t = document.createElementNS(NS, 'text')
        t.textContent = b.num
        t.setAttribute('x', bb.x + bb.width / 2); t.setAttribute('y', bb.y + bb.height / 2)
        t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'middle')
        t.setAttribute('class', 'pnum')
        planSvg.appendChild(t)
      }
      /* THE DRAWING IS THE CONTROL, not a picture with a list beside it. A visitor
         looking at a plan points at the building on the plan; making them find the
         same number in a column to the right is a step that exists only because the
         map was easier to draw than to wire. One press, and it is the same press
         either way: choose, and you are there. */
      const row = document.createElement('button')
      row.type = 'button'; row.className = 'prow'
      const a = b.suites.filter((x) => x.type === 'A').length
      row.innerHTML = `<b>${b.num}</b><span>${b.suites.length} suites<i>${a} premium</i></span><em>${b.open} free</em>`
      row.addEventListener('click', () => { closePlan(); selectBuilding(b) })
      row.addEventListener('pointerenter', () => b._planGroup?.setAttribute('data-hot', 'true'))
      row.addEventListener('pointerleave', () => b._planGroup?.removeAttribute('data-hot'))
      b._planRow = row
      planList.appendChild(row)

      /* THE DRAWING IS THE CONTROL, not a picture with a list beside it. A visitor
         looking at a plan points at the building on the plan; making them find the
         same number in a column to the right is a step that exists only because the
         map was easier to draw than to wire.

         AND IT NEEDS ITS OWN HIT TARGET. A <g> is only hit where its CHILDREN paint,
         so a run of eleven bays with air between them answers the pointer in stripes
         and misses entirely at the centre of its own box — measured: pointing at the
         middle of building 07 lit nothing. One transparent rectangle on the box the
         drawing already measured makes the building a single target, which is the
         same thing the model's pick proxies do and for the same reason. */
      const g = planSvg.querySelector('g[data-building="' + b.num + '"]')
      if (g && b.box && b.box.width) {
        const hit = document.createElementNS(NS, 'rect')
        hit.setAttribute('x', b.box.x); hit.setAttribute('y', b.box.y)
        hit.setAttribute('width', b.box.width); hit.setAttribute('height', b.box.height)
        hit.setAttribute('fill', 'transparent')
        hit.setAttribute('class', 'phit')
        hit.setAttribute('role', 'button')
        hit.setAttribute('tabindex', '0')
        hit.setAttribute('aria-label', 'Building ' + b.num + ', ' + b.open + ' of ' + b.suites.length + ' available')
        const go = () => { closePlan(); selectBuilding(b) }
        hit.addEventListener('click', go)
        hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } })
        hit.addEventListener('pointerenter', () => { g.setAttribute('data-hot', 'true'); row.setAttribute('data-hot', 'true') })
        hit.addEventListener('pointerleave', () => { g.removeAttribute('data-hot'); row.removeAttribute('data-hot') })
        g.appendChild(hit)
        b._planGroup = g
      }
    }
  }
  /* FIT TO VIEW ON EVERY OPEN. The panel has no size while hidden, so a viewBox solved
     once at build time is solved against a zero box. It is re-solved after layout, every
     time it opens, which is what makes the whole site visible with no initial pan. */
  function openPlan() {
    buildPlan()
    S.plan = true
    plan.hidden = false
    drawTag()
    /* A REFERENCE LAYER HAS TO SAY WHERE YOU ALREADY ARE, or it is a second place
       rather than a view of the one you are in. The building being inspected and the
       suite chosen inside it are marked on the drawing and in the list. */
    for (const b of compound.buildings) {
      const on = b === S.building
      b._planGroup?.toggleAttribute('data-current', on)
      b._planRow?.toggleAttribute('data-current', on)
    }
    if (planSvg) {
      planSvg.querySelectorAll('[data-here]').forEach((el) => el.removeAttribute('data-here'))
      if (S.suite) planSvg.querySelector('[data-ref="' + CSS.escape(S.suite.ref) + '"]')?.setAttribute('data-here', 'true')
    }
    const t = q('[data-plan-where]', plan)
    if (t) {
      t.textContent = S.suite ? ('Suite ' + S.suite.ref)
        : S.building ? ('Building ' + S.building.num)
        : 'Whole compound'
    }
    requestAnimationFrame(() => requestAnimationFrame(fitPlan))
  }
  function closePlan() { S.plan = false; plan.hidden = true; paint() }
  q('[data-plan-open]').addEventListener('click', openPlan)
  q('[data-plan-exit]', plan).addEventListener('click', closePlan)
  const onResize = () => { if (S.plan) fitPlan() }
  addEventListener('resize', onResize)

  /* --- the model -------------------------------------------------------------------- */
  let raf = 0
  const api = {
    S, compound, host, stage,
    selectBuilding, selectSuite, hoverBuilding, hoverSuite, overview, backToBuilding,
    stepBuilding, previewBuilding,
    enterSuite, openPlan, closePlan,
    get gl() { return gl }, get THREE() { return THREE },
    destroy() {
      cancelAnimationFrame(raf)
      removeEventListener('keydown', onKey)
      removeEventListener('resize', onResize)
      plan.remove()
      gl?.destroy?.()
    },
  }

  import('/src/site/compound3d.js').then(async ({ initCompound3D }) => {
    gl = initCompound3D(mount, compound)
    if (!gl) throw new Error('no webgl')
    stage.setAttribute('data-gl', 'on')
    THREE = await import('three')
    const bldgOf = (n) => compound.byNum.get(n)
    gl.onHoverBuilding = (n) => hoverBuilding(n ? bldgOf(n) : null)
    gl.onHoverSuite = (i) => hoverSuite(i == null ? null : compound.suites[i])
    gl.onPreviewBuilding = (n) => previewBuilding(n ? bldgOf(n) : null)
    gl.onPickBuilding = (n) => { const b = bldgOf(n); if (b) selectBuilding(b) }
    gl.onPickSuite = (i) => { const s = compound.suites[i]; if (s) selectSuite(s) }
    buildAnchors()
    /* THE ROOF HEIGHT, IN THE SITE'S OWN UNITS. Measuring a world Box3 and dividing by
       site.scale gave a WORLD height used as a LOCAL one — about half a foot, so the tag
       was anchored to the slab and only looked right because it is offset upward in
       pixels anyway. The model reports its own parapet height now. */
    gl.roofY = gl.roofTopLocal ?? 0
    const tick = () => { raf = requestAnimationFrame(tick); drawTag() }
    requestAnimationFrame(() => { gl.setLevel('compound'); paint(); tick() })
    opts.onReady?.(api)
  }).catch((e) => console.warn('[v5] the model did not stand', e))

  paint()
  return api
}
