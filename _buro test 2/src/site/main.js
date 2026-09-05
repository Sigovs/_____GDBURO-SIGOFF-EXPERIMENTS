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
import { buildCompound, TYPE_SPEC } from './compound.js'

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
const state = { level: 'compound', building: null, suite: null }
let compound = null

function renderSelection() {
  const plate = $('[data-plate]')
  if (!plate) return

  if (!state.suite) {
    plate.innerHTML = row('Selection', 'None — choose a suite')
    return
  }
  const s = state.suite
  const spec = TYPE_SPEC[s.type]
  plate.innerHTML = [
    row('Type', spec.label),
    row('Building', s.building, true),
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

const row = (k, v, fig = false) =>
  `<div class="plate__row"><dt class="plate__k">${k}</dt><dd class="plate__v${fig ? ' t-fig' : ''}">${v}</dd></div>`

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

function selectSuite(s) {
  if (!s || s.sold) return
  state.suite = s
  state.building = s.building
  state.level = 'suite'

  for (const c of compound.suites) {
    c.node.setAttribute('aria-pressed', c === s ? 'true' : 'false')
    if (c.sold) continue
    c.node.setAttribute('data-state', c === s ? 'lit' : (c.building === s.building ? 'focused' : ''))
  }
  $$('[data-bay-list] button').forEach((b) => {
    b.setAttribute('aria-pressed', b.dataset.suiteIndex === String(s.index) ? 'true' : 'false')
  })

  compoundEl?.setAttribute('data-level', 'suite')
  $$('[data-building]', compound.svg).forEach((g) => {
    if (g.classList.contains('bldg')) {
      g.setAttribute('data-focus', g.dataset.building === s.building ? 'true' : 'false')
    }
  })
  syncLevelButtons()
  renderSelection()

  /* The leader line: from the record's first row to a real anchor point on the lit
     bay, and it stays anchored for the whole act. No bubble, no chip, no tag. */
  drawLeader(s)
}

function drawLeader(s) {
  if (!compound?.leader) return
  const box = s.node.getBBox()
  const vb = compound.svg.viewBox.baseVal
  const x = box.x + box.width
  const y = box.y + box.height / 2
  compound.leader.setAttribute('points', `${x},${y} ${vb.width - 8},${y}`)
  compound.leader.setAttribute('opacity', '1')
}

function setLevel(level) {
  state.level = level
  compoundEl?.setAttribute('data-level', level)
  if (level === 'compound') {
    $$('[data-building]', compound.svg).forEach((g) => g.setAttribute('data-focus', 'false'))
    compound.leader?.setAttribute('opacity', '0')
  }
  syncLevelButtons()
}

function syncLevelButtons() {
  $$('[data-level-btn]').forEach((b) => {
    b.setAttribute('aria-current', b.dataset.levelBtn === state.level ? 'true' : 'false')
  })
}

if (compoundEl) {
  const mount = $('[data-compound-mount]', compoundEl)
  compound = buildCompound(mount)

  /* Pointer and keyboard reach identical states. The drawing is real DOM, so a suite
     is a focusable element with a real accessible name — a <canvas> could not do this,
     which is one of the reasons this act is SVG. */
  for (const s of compound.suites) {
    s.node.addEventListener('click', () => selectSuite(s))
    s.node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSuite(s) }
    })
    s.node.addEventListener('mouseenter', () => {
      if (!s.sold && state.suite !== s) s.node.setAttribute('data-state', 'focused')
    })
    s.node.addEventListener('mouseleave', () => {
      if (!s.sold && state.suite !== s) {
        s.node.setAttribute('data-state', s.building === state.building ? 'focused' : '')
      }
    })
  }

  /* The same control as a plain list. Not a substitute — it writes the same state, and
     on a phone it is where selection actually happens. */
  const list = $('[data-bay-list]')
  if (list) {
    const frag = document.createDocumentFragment()
    for (const s of compound.suites) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'bay-list__btn'
      b.dataset.suiteIndex = String(s.index)
      b.setAttribute('aria-pressed', 'false')
      const spec = TYPE_SPEC[s.type]
      b.innerHTML = s.sold
        ? `Bldg ${s.building} · ${spec.label} · <span class="t-scarce">Sold</span>`
        : `Bldg ${s.building} · ${spec.label} · ${spec.footprint}`
      if (s.sold) b.disabled = true
      else b.addEventListener('click', () => selectSuite(s))
      frag.appendChild(b)
    }
    list.appendChild(frag)
  }

  $$('[data-level-btn]').forEach((b) => {
    b.addEventListener('click', () => setLevel(b.dataset.levelBtn))
  })
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
  .then((m) => m.initMotion({ compound, selectSuite, setSuiteState, setLevel, state }))
  .catch((err) => {
    console.warn('[luxe-corsa] motion layer did not load; the static page stands.', err)
  })
