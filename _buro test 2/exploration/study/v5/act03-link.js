/* ======================================================================================
   THE SUITE SURVIVES THE CUT.

   A visitor chose suite 03 · 01, Type A, 2,430 sq ft, from $699,000 in act 02. One act
   later act 03 told them Type B, 1,863 sq ft, from $549,000, and drew the footprint at
   23 by 50 feet. Measured, not inferred. The site was contradicting itself about which
   product the buyer had just chosen, with a price.

   The cause was structural. main.js fills act 03's plate in syncPeak(), and the whole of
   that block is guarded by `if (compoundEl)` — production act 02's own markup. The
   integrated page removes `data-compound` so production act 02 stands down, and the act
   03 wiring goes with it. Nothing reconnected it.

   This is that connection, kept OUT of main.js on purpose: main.js owns production's act
   02 and must not learn about V5, and V5 must not learn about act 03's DOM. This module
   is the joint, and it is the only thing that knows both.

   It writes four ranks, which is the point of the record column rather than a detail of
   it: identity, the two numbers a buyer actually holds, the rest of the specification as
   one quiet block, and one action. `From $699,000` and `100 amp service` are not the
   same kind of fact and stop being set as though they were.
   ====================================================================================== */
import { TYPE_SPEC } from '/src/site/compound.js'

const kind = (t) => (t === 'A' ? 'Premium' : 'Standard')

export function linkAct03(root = document) {
  const q = (sel) => root.querySelector(sel)

  const nodes = {
    ref: q('[data-held-ref]'),
    type: q('[data-held-type]'),
    area: q('[data-held-area]'),
    price: q('[data-held-price]'),
    plate: q('[data-plate-peak]'),
    fp: q('[data-footprint] svg'),
    fpLabel: q('[data-footprint-label]'),
    cta: q('[data-held-cta]'),
    empty: q('[data-held-empty]'),
    held: q('[data-held]'),
  }

  const row = (k, v, fig) =>
    `<div class="plate__row"><dt class="plate__k">${k}</dt>`
    + `<dd class="plate__v${fig ? ' t-fig' : ''}">${v}</dd></div>`

  /* Before anything is chosen act 03 must not show a suite. It used to show a hard-coded
     Type B, which is the same lie told to a visitor who never picked at all. */
  function clear() {
    if (nodes.held) nodes.held.hidden = true
    if (nodes.empty) nodes.empty.hidden = false
    if (nodes.plate) nodes.plate.innerHTML = ''
    if (nodes.cta) nodes.cta.hidden = true
    if (nodes.fpLabel) nodes.fpLabel.textContent = 'No suite chosen yet'
    if (nodes.fp) nodes.fp.setAttribute('data-none', 'true')
  }

  function show(s) {
    if (!s) return clear()
    const spec = TYPE_SPEC[s.type]
    if (nodes.held) nodes.held.hidden = false
    if (nodes.empty) nodes.empty.hidden = true

    if (nodes.ref) nodes.ref.textContent = s.ref
    if (nodes.type) {
      nodes.type.textContent = `${kind(s.type)} · ${spec.label}`
      nodes.type.dataset.type = s.type
    }
    /* The two numbers, at display weight, in the reader's own words rather than the
       source's shouting caps. */
    if (nodes.area) nodes.area.textContent = spec.total.replace(/SQ FT/i, 'sq ft')
    if (nodes.price) nodes.price.textContent = spec.price.replace(/^FROM\s*/i, '')

    /* Rank three: the rest, and every row weighs the same as every other row because
       every row on it IS the same kind of fact. */
    if (nodes.plate) {
      nodes.plate.innerHTML = [
        row('Footprint', spec.footprint, true),
        row('Mezzanine', spec.mezzanine, true),
        row('Capacity', spec.capacity.toLowerCase(), true),
        row('Electric', '100 amp service', true),
        row('Climate', 'Climate controlled'),
      ].join('')
    }

    /* The footprint notation redraws to the chosen type's real proportion. Both types
       are 50 ft deep and only the width moves, so the height is fixed — 46 : 35 is
       1.314 against the built 30 : 23 = 1.304, which is the same truth the model and
       the miniature bays carry. */
    if (nodes.fp) {
      nodes.fp.removeAttribute('data-none')
      const w = s.type === 'A' ? 46 : 35
      nodes.fp.querySelectorAll('rect').forEach((r) => r.setAttribute('width', String(w)))
      nodes.fp.querySelector('.footprint__mezz')?.setAttribute('height', '61')
    }
    if (nodes.fpLabel) nodes.fpLabel.textContent = `Chosen footprint · ${spec.footprint}`

    /* Rank four. Act 03 had no action at all. This is not a purchase and does not claim
       one: it is a forward link to the site's own ask in act 07, carrying the suite. */
    if (nodes.cta) {
      nodes.cta.hidden = false
      nodes.cta.innerHTML = `Arrange to stand in ${s.ref}<span aria-hidden="true">→</span>`
      nodes.cta.setAttribute('aria-label', `Arrange to stand in suite ${s.ref} — private tour`)
    }
  }

  clear()
  return { show, clear }
}
