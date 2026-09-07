/* ======================================================================================
   THE CHOSEN SUITE SURVIVES THE CUT INTO ACT 03.

   THE BUG, measured rather than inferred. A visitor chose suite 03 · 01 — Premium,
   2,430 sq ft, from $699,000 — in act 02. One act later act 03 told them Type B,
   1,863 sq ft, from $549,000, and drew the footprint at 23 by 50 feet. The site was
   contradicting itself about which product the buyer had just chosen, with a price.

   THE CAUSE IS STRUCTURAL. main.js fills act 03's plate in syncPeak(), and that whole
   block is guarded by `if (compoundEl)` — production act 02's own markup. The integrated
   page removes `data-compound` so production act 02 stands down, and the act 03 wiring
   goes with it. Nothing reconnected it.

   THIS IS THE RECONNECTION, AND NOTHING ELSE. Act 03's layout is not touched: the same
   eight rows, the same footprint notation, the same caption. Only the values change, and
   they change to the ones the visitor actually chose. Redesigning that column is a
   separate pass and is not this one.
   ====================================================================================== */
import { TYPE_SPEC } from '/src/site/compound.js'

export function linkAct03(root = document) {
  const plate = root.querySelector('[data-plate-peak]')
  const fp = root.querySelector('[data-footprint] svg')
  const fpLabel = root.querySelector('[data-footprint-label]')
  const head = root.querySelector('[data-act03-head]')

  const row = (k, v, fig) =>
    `<div class="plate__row"><dt class="plate__k">${k}</dt>`
    + `<dd class="plate__v${fig ? ' t-fig' : ''}">${v}</dd></div>`

  return function show(s) {
    if (!s || !plate) return
    const spec = TYPE_SPEC[s.type]
    plate.innerHTML = [
      row('Suite', s.ref, true),
      row('Type', `${s.type === 'A' ? 'Premium' : 'Standard'} · ${spec.label}`),
      row('Footprint', spec.footprint, true),
      row('Mezzanine', spec.mezzanine, true),
      row('Total', `<strong>${spec.total}</strong>`, true),
      row('Capacity', spec.capacity, true),
      row('Electric', '100 amp service', true),
      row('Climate', 'Climate controlled'),
      row('From', `<strong>${spec.price.replace(/^FROM\s*/i, '')}</strong>`, true),
    ].join('')

    /* Both types are 50 ft deep and only the width moves, so the notation's height is
       fixed and its width is the only thing that changes: 46 : 35 is 1.314 against the
       built 30 : 23 = 1.304, the same truth the model and the miniature bays carry. */
    if (fp) {
      const w = s.type === 'A' ? 46 : 35
      fp.querySelectorAll('rect').forEach((r) => r.setAttribute('width', String(w)))
      fp.querySelector('.footprint__mezz')?.setAttribute('height', '61')
    }
    if (fpLabel) fpLabel.textContent = `Selected footprint · ${spec.footprint}`
    if (head) head.textContent = `Suite ${s.ref}`
  }
}
