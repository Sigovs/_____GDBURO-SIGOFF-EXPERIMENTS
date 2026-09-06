/* ==================================================================================
   MAIN — the page's behaviour.

   Build order, and it is not negotiable (`MJ5`, `DNA39`, `G7`): the static page works
   first and is judged on its own. Everything in this file is behaviour the page needs
   whether or not the motion layer ever loads — selection, levels, states, the A<->B
   toggle, the disclosures. Motion is imported at the end, and if that import fails the
   page is complete and every route still works.

   Nothing here hides content ahead of a script. The `js-motion` class is added only
   once the motion layer has confirmed it took hold.
   ================================================================================== */

import './index.css'
import { buildCompound, restFrame, frameFor, TYPE_SPEC } from './compound.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

/* ---------------------------------------------------------------------------------
   ACT 02 — the compound, its three levels, and selection.

   The three levels each owe a truth the last did not deliver:
     compound  scale and organisation
     building  granularity — a building is made of individually owned rooms
     suite     specificity — this one, this size, this money

   No level is skippable and none is mandatory. Scrolling on leaves the act at whatever
   level the visitor reached. There is no modal, no lightbox, and no state the visitor
   can be trapped in.
   --------------------------------------------------------------------------------- */

const compoundEl = $('[data-compound]')
const railEl = $('[data-rail]')
const LEVELS = ['compound', 'building', 'suite']
const state = { level: 'compound', building: null, suite: null, hover: null }
let compound = null

/* ---------------------------------------------------------------------------------
   THE CAMERA.

   Act 02's three levels are three FRAMINGS of one drawing, not three colour schemes.
   Selecting a building used to change a stroke and leave the picture where it was, and
   a level that does not move the frame is a level the visitor cannot feel — the whole
   act read as a static site plan with hover states on it.

   One object owns the viewBox, and only one (`G6`). Two things want to write it and
   they are not peers:

     the SCROLL owns it while the compound is still resolving. That is a reveal, it is
     scrubbed, and it belongs to the pin.
     the VISITOR owns it from their first selection onward. Selection is a choice, and
     binding a choice to scroll takes the choice away (`SC1`, `DM7`).

   So `resolve()` is a no-op once `owner` is 'user', and returning to compound level
   hands ownership back. There is no frame in which both are writing.

   The tween is GSAP when the motion layer is present and an instant set when it is
   not, which is also the reduced-motion and no-JS path: the state changes either way,
   and what is lost is the travel, never the destination (`MJ5`, `MJ9`).
   --------------------------------------------------------------------------------- */
const camera = (() => {
  let svg = null
  let stage = null
  let rest = null
  let owner = 'scroll'
  let current = null
  let tween = null
  let gsapLib = null
  let gl = null

  const aspect = () => {
    const r = stage?.getBoundingClientRect()
    return r && r.height > 0 ? r.width / r.height : 2.13
  }

  /* Every stroke in the drawing is non-scaling, so a frame at 3x magnification would
     otherwise draw the compound three times larger with the same 1px lines — a third of
     the line per unit area, which is exactly why the old opening crop read faint. The
     scale factor is derived from the live frame against the resting one, so it stays
     correct for camera positions nobody has composed yet. */
  const apply = (f) => {
    current = f
    svg.setAttribute('viewBox', `${f.x} ${f.y} ${f.w} ${f.h}`)
    compoundEl.style.setProperty('--plan-k', Math.sqrt(rest.w / f.w).toFixed(3))
  }

  return {
    init(c, stageEl) {
      svg = c.svg
      stage = stageEl
      rest = restFrame(aspect())
      apply(rest)
    },
    /* The motion layer upgrades the tween in place. Nothing else changes: the camera
       has the same API and the same states whether or not this is ever called. */
    useGsap(lib) { gsapLib = lib; gl?.useGsap(lib) },
    /* Once the model exists it is the act's camera. The SVG frame is still solved and
       still applied — it is what the reduced-motion and no-WebGL paths look at — but
       the LEVEL is now expressed as a move around a physical object, so the level
       change is forwarded to the model as well. One state, two views. */
    useGl(inst) { gl = inst; if (gsapLib) gl.useGsap(gsapLib) },
    /* The 01 -> 02 arrival is the model camera, so it is forwarded rather than
       duplicated: the boundary trigger drives this and the pin drives the SVG frame,
       which keeps one writer per camera. */
    arrival(k) { gl?.arrival(k) },
    /* The threshold needs the chosen door where it actually is on screen, and the
       descent that puts the camera in front of it. Both belong to the model. */
    doorScreen() { return gl?.doorScreen?.() || null },
    descend(k) { gl?.descend?.(k) },
    get owner() { return owner },
    get rest() { return rest },
    aspect,
    /* Re-solve the composed frame when the box changes shape, and re-fly to whatever
       level is current so a resize does not strand the camera on a stale framing. */
    remeasure() {
      if (!svg) return
      rest = restFrame(aspect())
      this.toLevel(state.level, false)
    },
    /* The pin's resolve, 0 -> 1. Ignored once the visitor has taken the wheel. */
    resolve(k, opening) {
      if (!svg || owner === 'user') return
      /* Anchored at 0.16 / 0.74 of the resting frame — the entry road, which is the
         same threshold act 00's gate was, seen in plan. The act opens on that fragment
         and the frame opens out from it, so the compound assembles from the way in. */
      const w = rest.w * (opening + (1 - opening) * k)
      const h = rest.h * (opening + (1 - opening) * k)
      apply({
        x: rest.x + (rest.w - w) * 0.16,
        y: rest.y + (rest.h - h) * 0.74,
        w,
        h,
      })
    },
    release() { owner = 'scroll' },
    toLevel(level, animate = true) {
      if (!svg) return
      let target = rest
      /* The building frame's air is authored per input, not scaled from one number.

         On a pointer, 0.42 of the building's own size as margin puts the mass in the
         frame with the site still legible around it, which is what the level is for.
         On touch that same framing made a bay a 24px target — under the 44px floor,
         and the level's whole promise on a phone is that choosing a building is what
         makes its suites tappable. 0.16 pulls the camera in until a bay is around a
         third bigger, and the surrounding context the pointer version keeps is traded
         away deliberately: a phone has the level instrument directly above the drawing
         instead (`M4`, `G5`). */
      const pad = matchMedia('(max-width: 1024px)').matches ? 0.16 : 0.42
      if (level === 'building' && state.building) {
        target = frameFor(state.building.box, aspect(), pad)
      } else if (level === 'suite' && state.suite) {
        /* The suite is the subject, but a bay framed alone is a rectangle with no
           address. `P6`'s third truth is specificity, and specificity needs the mass it
           is specific to still in shot — so the frame is built on the suite and then
           floored at 34% of the building's own frame, which is far enough in for one
           bay to be unmistakably the subject and far enough out for the run it belongs
           to to be visible around it. */
        const bldgFrame = frameFor(state.suite.bldg.box, aspect(), pad)
        target = frameFor(state.suite.node.getBBox(), aspect(), 1.6)
        const floor = bldgFrame.w * 0.34
        if (target.w < floor) {
          const cx = target.x + target.w / 2
          const cy = target.y + target.h / 2
          target = { x: cx - floor / 2, y: cy - floor / aspect() / 2, w: floor, h: floor / aspect() }
        }
      }
      if (level !== 'compound') owner = 'user'
      this.to(target, animate)
      gl?.setLevel(level, state.building?.num || null, state.suite?.index ?? null)
    },
    to(target, animate = true) {
      tween?.kill?.()
      if (!animate || !gsapLib || prefersReduced()) { apply(target); return }
      const from = current || target
      const proxy = { ...from }
      /* --dur-door is the page's signature duration and this is the page's signature
         move: the frame travelling from the compound to one room is the same event the
         aperture performs between acts. One easing, one length, one idea. */
      tween = gsapLib.to(proxy, {
        x: target.x, y: target.y, w: target.w, h: target.h,
        duration: 0.64,
        ease: 'door',
        overwrite: true,
        onUpdate: () => apply(proxy),
      })
    },
  }
})()

const prefersReduced = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/* ---------------------------------------------------------------------------------
   THE RECORD.
   --------------------------------------------------------------------------------- */

const row = (k, v, fig = false) =>
  `<div class="plate__row"><dt class="plate__k">${k}</dt><dd class="plate__v${fig ? ' t-fig' : ''}">${v}</dd></div>`

function renderSelection() {
  const plate = $('[data-plate]')
  if (!plate) return

  /* Three levels, three records, and each one reports the truth its level owes. The
     compound owes scale, a building owes granularity, a suite owes specificity — so
     the record is not one plate with more rows added, it is a different statement at
     each depth. Hover writes the same plate as selection, because considering a
     building and having chosen one should tell you the same facts. */
  const b = state.hover || state.building
  if (!state.suite && !b) {
    /* PUBLISHED figures, not drawn ones (`CP1`). The plan measures nine of the eleven
       buildings — 02 and 05 carry a badge and Type A units on the source plan but no
       run the extractor could measure — so the drawing holds 116 of the 121 suites.
       Reporting the drawing's own counts here would have quietly contradicted the
       act's own heading two lines above it, and the visitor would be right to believe
       the smaller number. The totals are the source's; the gap is stated rather than
       averaged away. */
    const t = compound.data.totals
    plate.innerHTML =
      row('Buildings', String(t.buildings), true) +
      row('Suites', String(t.bays), true) +
      row('Available', `98 of ${t.bays}`, true) +
      row('Selection', 'None — choose a building')
    return
  }

  if (!state.suite) {
    plate.innerHTML = [
      row('Building', b.num, true),
      row('Suites', String(b.suites.length), true),
      row('Available', String(b.open), true),
      row('Type A', String(b.typeA), true),
      row('Type B', String(b.typeB), true),
      b.sold ? row('Sold', `<span class="t-scarce">${b.sold}</span>`, true) : '',
      row('Selection', state.building ? 'Choose a suite' : 'Select to enter'),
    ].join('')
    return
  }

  const s = state.suite
  const spec = TYPE_SPEC[s.type]
  plate.innerHTML = [
    row('Type', spec.label),
    row('Building', s.building, true),
    row('Bay', s.ordinal, true),
    row('Footprint', spec.footprint, true),
    row('Mezzanine', spec.mezzanine, true),
    row('Total', `<strong>${spec.total}</strong>`, true),
    row('Capacity', spec.capacity, true),
    row('From', `<strong>${spec.price.replace('FROM ', '')}</strong>`, true),
    s.sold ? row('Status', '<span class="t-scarce">Sold</span>') : '',
  ].join('')

  /* The peak's plate and the closing line both name the suite selected here. Three
     traces, capped deliberately: the footprint notation at 03, the type-and-size line
     at 07, and the lit bay in the collapsed rail. Anything beyond that is a CRM
     feature wearing an art direction. */
  syncPeak(s)
}

function syncPeak(s) {
  const spec = TYPE_SPEC[s.type]
  const peak = $('[data-plate-peak]')
  if (peak) {
    peak.innerHTML = [
      row('Type', spec.label),
      row('Footprint', spec.footprint, true),
      row('Mezzanine', spec.mezzanine, true),
      row('Total', `<strong>${spec.total}</strong>`, true),
      row('Capacity', spec.capacity, true),
      row('Electric', '100 amp service', true),
      row('Climate', 'Climate controlled'),
      row('From', `<strong>${spec.price.replace('FROM ', '')}</strong>`, true),
    ].join('')
  }

  /* The footprint notation redraws to the selected type's real proportions. Both types
     are 50' deep and only the width changes, so the notation's height is fixed and its
     width is the only thing that moves — the same truth the A<->B diagram carries. */
  const fp = $('[data-footprint] svg')
  if (fp) {
    const w = s.type === 'A' ? 46 : 35
    fp.querySelectorAll('rect').forEach((r) => r.setAttribute('width', String(w)))
    fp.querySelector('.footprint__mezz')?.setAttribute('height', '61')
  }
  const fpl = $('[data-footprint-label]')
  if (fpl) fpl.textContent = `Selected footprint · ${spec.footprint}`

  const close = $('[data-close-selection]')
  if (close) {
    close.innerHTML = `${spec.label} <span aria-hidden="true">·</span> ${spec.footprint} <span aria-hidden="true">·</span> ${spec.total.toLowerCase()}`
  }
}

/* ---------------------------------------------------------------------------------
   LIGHT — the drawing's whole state, written in one place.

   Every level, hover and selection change funnels through here, so the drawing can
   never hold a combination of attributes that no code path intended. Attributes only:
   the values themselves are in the stylesheet, where the contrast ratios that justify
   them are documented.
   --------------------------------------------------------------------------------- */
/* THE ROUTE — the drive from the gate to whatever is under consideration.

   It is the act's answer to what pointing at a building TELLS you. Not "this one is
   highlighted" but "this is the way in to it", drawn on the compound's own measured
   roadway, in the compound's own verified light.

   The line is re-pointed and re-drawn from zero on every change of subject, so it
   always travels outward from the gate rather than growing or shrinking from wherever
   the last route happened to end. That direction is the whole meaning of the mark: a
   route that animated backwards would be showing the visitor leaving. */
function setRoute(points) {
  const r = compound?.route
  if (!r) return
  if (!points) {
    compoundEl.style.setProperty('--route-k', '0')
    return
  }
  r.setAttribute('points', points)
  const len = r.getTotalLength()
  r.style.strokeDasharray = String(len)
  r.style.strokeDashoffset = String(len)
  compoundEl.style.setProperty('--route-k', '1')
  /* Two frames of dash, and the only thing in the act that is a duration rather than a
     state. The road is ~1000 units long and the eye has to be able to follow it, which
     is what --dur-settle is for; the light arrives at the door, and stops. */
  requestAnimationFrame(() => {
    r.style.transition = `stroke-dashoffset ${prefersReduced() ? 1 : 900}ms var(--ease-enter)`
    r.style.strokeDashoffset = '0'
  })
}

function paint() {
  const focusNum = state.building?.num || null
  const hoverNum = state.hover?.num || null

  for (const b of compound.buildings) {
    b.node.setAttribute('data-focus', b.num === focusNum ? 'true' : 'false')
    if (b.num === hoverNum && b.num !== focusNum) b.node.setAttribute('data-hover', 'true')
    else b.node.removeAttribute('data-hover')
  }

  for (const c of compound.suites) {
    const chosen = c === state.suite
    c.node.setAttribute('aria-pressed', chosen ? 'true' : 'false')
    if (c.sold) continue
    c.node.setAttribute('data-state', chosen ? 'lit' : '')
    /* Only the subject's bays are reachable by keyboard, for the same reason only the
       subject's bays are reachable by pointer: at compound level the choice is between
       buildings, and 121 tab stops through a drawing nobody has entered yet is not a
       route, it is a trap. */
    c.node.setAttribute('tabindex', c.building === focusNum ? '0' : '-1')
  }

  compoundEl.setAttribute('data-level', state.level)
  railEl?.setAttribute('data-rail-level', String(LEVELS.indexOf(state.level)))
  syncLevelButtons()
  renderSelection()
}

function syncLevelButtons() {
  for (const btn of $$('[data-level-btn]')) {
    const lvl = btn.dataset.levelBtn
    const reached =
      lvl === 'compound' || (lvl === 'building' && state.building) || (lvl === 'suite' && state.suite)
    btn.hidden = !reached
    btn.setAttribute('aria-current', lvl === state.level ? 'true' : 'false')
  }
  /* Both copies, not the first one. The level instrument is authored twice — inline
     above the drawing for one column, in the record for two — and a single-node lookup
     found only the inline copy, which is the one a desktop visitor cannot see. The
     record's instrument was rendering "BUILDING" and "SUITE" with the numbers missing:
     the two facts the stops exist to carry. */
  $$('[data-level-building]').forEach((n) => { n.textContent = state.building?.num || '' })
  $$('[data-level-suite]').forEach((n) => { n.textContent = state.suite?.ref || '' })
}

/* ---------------------------------------------------------------------------------
   THE THREE LEVELS.
   --------------------------------------------------------------------------------- */

function selectBuilding(b, animate = true) {
  if (!b) return
  state.building = b
  state.hover = null
  state.suite = null
  state.level = 'building'
  compound.leader?.setAttribute('opacity', '0')
  setRoute(b.route)
  paint()
  renderIndex()
  camera.toLevel('building', animate)
}

function selectSuite(s, animate = true) {
  if (!s || s.sold) return
  state.suite = s
  state.building = s.bldg
  state.hover = null
  state.level = 'suite'
  /* The route extends by one leg — off the drive and up to this door. Selecting a
     suite therefore COMPLETES a line the building level already drew, which is what
     makes the third level read as arrival rather than as a third zoom. */
  setRoute(s.route)
  paint()
  renderIndex()
  camera.toLevel('suite', animate)
  drawLeader(s)
}

function setLevel(level, animate = true) {
  if (level === 'building' && !state.building) return
  if (level === 'suite' && !state.suite) return
  state.level = level
  state.hover = null
  if (level === 'compound') {
    /* Coming out is a real return, not a zoom-out with the old choice still lit. The
       compound is the compound again, and the scroll gets its camera back. */
    state.building = null
    state.suite = null
    compound.leader?.setAttribute('opacity', '0')
    setRoute(null)
    camera.release()
  }
  if (level === 'building') {
    state.suite = null
    compound.leader?.setAttribute('opacity', '0')
    /* Stepping back OUT of a suite retracts the route's last leg: the drive still runs
       to the building, and no longer to one door. The reverse transition is authored
       rather than being the forward one played backwards. */
    setRoute(state.building?.route || null)
  }
  paint()
  renderIndex()
  camera.toLevel(level, animate)
  if (level === 'suite' && state.suite) drawLeader(state.suite)
}

function drawLeader(s) {
  if (!compound?.leader) return
  const box = s.node.getBBox()
  const vb = compound.svg.viewBox.baseVal
  const x = box.x + box.width
  const y = box.y + box.height / 2
  compound.leader.setAttribute('points', `${x},${y} ${vb.x + vb.width - 8},${y}`)
  compound.leader.setAttribute('opacity', '1')
}

/* ---------------------------------------------------------------------------------
   THE INDEX — the same three levels, reachable without the drawing.
   --------------------------------------------------------------------------------- */
function renderIndex() {
  const idx = $('[data-bldg-index]')
  const list = $('[data-bay-list]')
  const head = $('[data-index-head]')
  const note = $('[data-index-note]')
  if (!idx || !list) return

  const inBuilding = !!state.building
  idx.hidden = inBuilding
  list.hidden = !inBuilding
  if (note) note.hidden = !inBuilding
  if (head) {
    head.textContent = inBuilding
      ? `Building ${state.building.num} — ${state.building.suites.length} suites`
      : 'Buildings'
  }
  /* The measurement gap, stated where it applies, in the record's own dated language.
     Two of the eleven buildings are on the published plan as a badge and a Type A count
     with no measurable run, so the drawing has nine. Saying so costs one line; not
     saying so leaves the index silently disagreeing with the heading. */
  const gap = $('[data-index-gap]')
  if (gap) {
    gap.hidden = inBuilding
    gap.textContent =
      `${compound.buildings.length} of ${compound.data.totals.buildings} buildings are dimensioned on the published plan · ` +
      `${compound.suites.length} of ${compound.data.totals.bays} suites drawn`
  }

  for (const btn of $$('button', idx)) {
    btn.setAttribute('aria-current', btn.dataset.bldgBtn === state.building?.num ? 'true' : 'false')
  }

  if (!inBuilding) { list.innerHTML = ''; return }

  const frag = document.createDocumentFragment()
  for (const s of state.building.suites) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'bay-list__btn'
    b.dataset.suiteIndex = String(s.index)
    b.setAttribute('aria-pressed', s === state.suite ? 'true' : 'false')
    const spec = TYPE_SPEC[s.type]
    b.innerHTML = s.sold
      ? `Bay ${s.ordinal} · ${spec.label} · <span class="t-scarce">Sold</span>`
      : `Bay ${s.ordinal} · ${spec.label} · ${spec.footprint}`
    if (s.sold) b.disabled = true
    else b.addEventListener('click', () => selectSuite(s))
    frag.appendChild(b)
  }
  list.replaceChildren(frag)
}

if (compoundEl) {
  const mount = $('[data-compound-mount]', compoundEl)
  compound = buildCompound(mount)
  camera.init(compound, mount)

  /* --- POINTER. Delegated on the SVG, because the target of a pointer event in this
     drawing is a bay or a run or an extruded side wall, and all three of them mean
     "this building". Per-node listeners on 121 bays could only ever answer as bays. */
  const hitBuilding = (e) => compound.byNum.get(e.target.closest?.('.bldg')?.dataset.building)
  const hitSuite = (e) => compound.suites.find((s) => s.node === e.target)

  compound.svg.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return          /* no hover model on touch (`M6`) */
    const b = hitBuilding(e)
    const s = hitSuite(e)

    /* Hover reads at the level the visitor is at: the compound answers with buildings,
       a building answers with its own bays. Never both — a drawing that highlights a
       mass and a cell in the same gesture is telling the eye two subjects. */
    if (state.level === 'compound') {
      if (b !== state.hover) {
        state.hover = b || null
        /* Pointing at a building draws the drive to it. This is what makes the compound
           level worth exploring with the pointer rather than merely worth looking at:
           nine buildings, nine different ways in, and the road that has been sitting
           under the drawing since act 00 turns out to be the thing that organises it. */
        setRoute(state.hover ? state.hover.route : null)
        paint()
      }
      return
    }
    for (const c of compound.suites) {
      if (c.sold || c === state.suite) continue
      const on = c === s && c.building === state.building?.num
      const want = on ? 'focused' : ''
      if (c.node.getAttribute('data-state') !== want) c.node.setAttribute('data-state', want)
    }
  })

  compound.svg.addEventListener('pointerleave', () => {
    if (state.hover) {
      state.hover = null
      setRoute(state.building?.route || null)
      paint()
    }
    for (const c of compound.suites) {
      if (!c.sold && c !== state.suite) c.node.setAttribute('data-state', '')
    }
  })

  /* --- SELECTION. One gesture, and what it means depends on where the visitor is —
     which is the drill-down, and it is the only thing that advances a level. */
  compound.svg.addEventListener('click', (e) => {
    const b = hitBuilding(e)
    if (!b) return
    const s = hitSuite(e)
    if (state.building && b === state.building && s) selectSuite(s)
    else selectBuilding(b)
  })

  /* Keyboard reaches identical states. A bay is a real focusable node with a real
     accessible name, which is one of the reasons this act is SVG rather than canvas. */
  compound.svg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const s = hitSuite(e)
      if (s) { e.preventDefault(); selectSuite(s) }
      return
    }
    if (e.key === 'Escape') { e.preventDefault(); stepOut() }
  })
  compound.svg.addEventListener('focusin', (e) => {
    const s = hitSuite(e)
    if (s && !s.sold && s !== state.suite) s.node.setAttribute('data-state', 'focused')
  })

  /* Escape is the way out of anything, and it is the way out of this too. One level
     per press, so the visitor never loses their place in one keystroke. */
  const stepOut = () => {
    const i = LEVELS.indexOf(state.level)
    if (i > 0) setLevel(LEVELS[i - 1])
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && compoundEl.getAttribute('data-level') !== 'compound') stepOut()
  })

  /* --- THE BUILDING INDEX, built once. */
  const idx = $('[data-bldg-index]')
  if (idx) {
    const frag = document.createDocumentFragment()
    for (const b of compound.buildings) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'bldg-index__btn'
      btn.dataset.bldgBtn = b.num
      btn.setAttribute('aria-pressed', 'false')
      btn.innerHTML =
        `<span class="bldg-index__num">${b.num}</span>` +
        `<span>${b.suites.length} suites</span>` +
        `<span class="bldg-index__meta">${b.open} available</span>`
      btn.setAttribute('aria-label', `Building ${b.num}, ${b.suites.length} suites, ${b.open} available`)
      btn.addEventListener('click', () => selectBuilding(b))
      /* The index is the drawing's twin, so pointing at a row lights the building the
         same way pointing at the building does. */
      btn.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'touch' || state.building) return
        state.hover = b
        setRoute(b.route)
        paint()
      })
      btn.addEventListener('pointerleave', () => {
        if (state.hover === b) { state.hover = null; setRoute(null); paint() }
      })
      frag.appendChild(btn)
    }
    idx.appendChild(frag)
  }

  $$('[data-level-btn]').forEach((b) => {
    b.addEventListener('click', () => setLevel(b.dataset.levelBtn))
  })

  /* The composed frame is solved against the stage's real box, so it has to be
     re-solved when that box changes shape. Debounced to a frame; nothing here reads
     layout during the resize itself. */
  let rAF = 0
  window.addEventListener('resize', () => {
    cancelAnimationFrame(rAF)
    rAF = requestAnimationFrame(() => camera.remeasure())
  })

  paint()
  renderIndex()

  /* ---------------------------------------------------------------------------------
     THE HERO IS NOW THE MODEL.

     Act 02's subject stops being a drawing of the compound and becomes the compound —
     a presentation model on a slab, lit, with shadows, that the visitor can walk
     around. The SVG stays exactly where it was and keeps every job it was already
     doing: it is the reduced-motion path, the no-WebGL path, and the accessibility
     floor where a suite is a real focusable button with a real name (`MJ5`, `G7`).

     One state machine drives both. Everything above — levels, selection, the record,
     the index, the rail, the route — is untouched; the model is another VIEW of that
     state, wired in below. If this import or this context fails, the drawing is still
     standing and every route still works.
     --------------------------------------------------------------------------------- */
  import('./compound3d.js')
    .then(({ initCompound3D }) => {
      const gl = initCompound3D(mount, compound)
      if (!gl) return
      compoundEl.setAttribute('data-gl', 'on')
      camera.useGl(gl)

      const bldgOf = (num) => compound.byNum.get(num)

      /* Pointing at the model writes the same hover state pointing at the drawing
         writes, so the record and the index answer identically either way. */
      gl.onHoverBuilding = (num) => {
        const b = num ? bldgOf(num) : null
        if (b === state.hover) return
        state.hover = b
        setRoute(b ? b.route : (state.building?.route || null))
        gl.setRoute(b ? routePlan(b) : (state.building ? routePlan(state.building) : null))
        paint()
      }
      gl.onHoverSuite = (index) => {
        const s = index == null ? null : compound.suites[index]
        gl.setHoverSuite(s || null)
        for (const c of compound.suites) {
          if (c.sold || c === state.suite) continue
          const want = c === s ? 'focused' : ''
          if (c.node.getAttribute('data-state') !== want) c.node.setAttribute('data-state', want)
        }
      }
      gl.onPickBuilding = (num) => { const b = bldgOf(num); if (b) selectBuilding(b) }
      gl.onPickSuite = (index) => { const s = compound.suites[index]; if (s) selectSuite(s) }

      /* The route, in PLAN space with a height for its last leg, because in three
         dimensions the drive has to arrive at a door that is above the ground. */
      window.requestAnimationFrame(() => gl.setLevel('compound'))
    })
    .catch((err) => { console.warn('[luxe-corsa] the model did not stand; the drawing does.', err) })
}

/* The measured drive, as plan points the model can lift into 3D. Shared by both views
   so the line the SVG draws and the tube the model lays down are the same route. */
function routePlan(subject) {
  const spine = compound?.data?.spine
  if (!spine || !subject) return null
  const pt = subject.suites ? subject : null
  const target = pt ? pt : subject
  const cx = target.cx
  const cy = target.cy
  if (cx == null) return null
  let bi = 0, bx = spine[0][0], by = spine[0][1], bd = Infinity
  for (let i = 0; i < spine.length - 1; i++) {
    const [ax, ay] = spine[i]
    const [nx2, ny2] = spine[i + 1]
    const dx = nx2 - ax, dy = ny2 - ay
    const l2 = dx * dx + dy * dy || 1
    const t = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / l2))
    const px = ax + dx * t, py = ay + dy * t
    const d = Math.hypot(cx - px, cy - py)
    if (d < bd) { bd = d; bi = i; bx = px; by = py }
  }
  const legs = [...spine.slice(0, bi + 1).map(([x, y]) => [x, y, 0]), [bx, by, 0]]
  const front = subject.front || subject.suites?.[0]?.front
  if (front) legs.push([front[0], front[1], 0])
  return legs
}

/* ---------------------------------------------------------------------------------
   ACT 03 — the peak. Four states, four truths.
   --------------------------------------------------------------------------------- */

const TRUTHS = {
  delivered: ['What you are actually given.', 'Suite as delivered · stand-in, not the property'],
  garage: ['What it holds, at true proportion.', 'Suite interior, occupied · developer render'],
  lounge: ['What the second level becomes.', 'Mezzanine, finished · developer render'],
  personalized: ['What someone made of theirs.', 'Owner fit-out · developer render'],
}

function setSuiteState(name) {
  $$('[data-state]', $('[data-suite]') || document).forEach((n) => {
    if (n.classList.contains('suite__state')) {
      n.setAttribute('data-active', n.dataset.state === name ? 'true' : 'false')
    }
  })
  $$('[data-state-btn]').forEach((b) => {
    b.setAttribute('aria-current', b.dataset.stateBtn === name ? 'true' : 'false')
  })
  const [truth, caption] = TRUTHS[name] || TRUTHS.delivered
  const t = $('[data-state-truth]'); if (t) t.textContent = truth
  const c = $('[data-state-caption]'); if (c) c.textContent = caption
}
$$('[data-state-btn]').forEach((b) => b.addEventListener('click', () => setSuiteState(b.dataset.stateBtn)))

/* ---------------------------------------------------------------------------------
   ACT 06 — the A <-> B diagram, and the disclosures.

   The depth axis and the mezzanine band are locked and visibly locked. Only the width
   edge travels. Because the depth is anchored, the visitor reads the difference as
   WIDTH, which is what it actually is, instead of as "one is bigger".
   --------------------------------------------------------------------------------- */

const AB = {
  A: { w: 200, label: '30′', rows: [
    ['Footprint', '30′ × 50′'], ['Ground floor', '1,500 sq ft'],
    ['Mezzanine', '30′ × 31′ · 930 sq ft'], ['Total', '<strong>2,430 sq ft</strong>'],
    ['Capacity', '≈6 cars, 3 motorcycles'], ['Units', '26 of 121'], ['From', '<strong>$699,000</strong>'],
  ] },
  B: { w: 153, label: '23′', rows: [
    ['Footprint', '23′ × 50′'], ['Ground floor', '1,150 sq ft'],
    ['Mezzanine', '23′ × 31′ · 713 sq ft'], ['Total', '<strong>1,863 sq ft</strong>'],
    ['Capacity', '≈4 cars, 2 motorcycles'], ['Units', '95 of 121'], ['From', '<strong>$549,000</strong>'],
  ] },
}

function setAB(type) {
  const d = AB[type]
  const unit = $('[data-ab-unit]')
  const mezz = $('[data-ab-mezz]')
  const wdim = $('[data-ab-wdim]')
  const wlab = $('[data-ab-wlabel]')
  if (!unit) return

  /* A width tween on one rect. The depth line and the mezzanine line do not move — the
     lock is the point, and it has to be visible. */
  for (const n of [unit, mezz]) n?.setAttribute('width', String(d.w))
  wdim?.setAttribute('x2', String(44 + d.w))
  $('[data-ab-mezzline]')?.setAttribute('x2', String(44 + d.w))
  if (wlab) { wlab.setAttribute('x', String(44 + d.w / 2 - 12)); wlab.textContent = d.label }

  const plate = $('[data-ab-plate]')
  if (plate) plate.innerHTML = d.rows.map(([k, v]) => row(k, v, true)).join('')
  $$('[data-ab-btn]').forEach((b) => b.setAttribute('aria-current', b.dataset.abBtn === type ? 'true' : 'false'))
}
$$('[data-ab-btn]').forEach((b) => b.addEventListener('click', () => setAB(b.dataset.abBtn)))

/* An expandable schedule that does not move the list it lives in. */
$$('[data-disclose]').forEach((d) => {
  const btn = $('[data-disclose-btn]', d)
  btn?.addEventListener('click', () => {
    const open = d.getAttribute('data-open') === 'true'
    d.setAttribute('data-open', open ? 'false' : 'true')
    btn.setAttribute('aria-expanded', open ? 'false' : 'true')
    const sign = $('.disclose__sign', btn); if (sign) sign.textContent = open ? '+' : '−'
  })
})

/* ---------------------------------------------------------------------------------
   The act number in the header. The only thing that changes across a seam.
   --------------------------------------------------------------------------------- */

const actNum = $('[data-act-number]')
if (actNum && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) actNum.textContent = e.target.dataset.act
    }
  }, { rootMargin: '-45% 0px -45% 0px' })
  $$('[data-act]').forEach((a) => io.observe(a))
}

/* ---------------------------------------------------------------------------------
   Motion, last, and optional.

   If this import fails every act still renders as its composed frame, the compound
   draws at level 01 with all states visible, and every route, figure and action works.
   What is lost is the choreography — no content, and no means of the task (`MJ5`).
   --------------------------------------------------------------------------------- */

import('./motion.js')
  .then((m) => m.initMotion({ compound, selectSuite, setSuiteState, setLevel, state, cam: camera }))
  .catch((err) => {
    console.warn('[luxe-corsa] motion layer did not load; the static page stands.', err)
  })
