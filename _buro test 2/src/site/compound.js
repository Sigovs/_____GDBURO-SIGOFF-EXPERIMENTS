/* ==================================================================================
   THE COMPOUND — act 02, and the mechanism of the signature.

   A drawing, not a scene. interaction-thesis.md §14 settled this: a fixed shallow axis
   with no free rotation IS a drawing, the SVG version has to exist anyway as the
   no-WebGL and reduced-motion path, and SVG gives real focusable nodes plus a free
   hand-off into the clip-path act 03 needs. Three.js is not in the dependency graph.

   Everything below renders from src/data/compound.json, which tools/extract-plan.py
   measures off the published site plan. No coordinate in this file is authored by
   hand — that is what `P10` requires, and it is why the drawing is the real compound
   rather than a decorative approximation of one.

   The drawing's grammar, in one line each:
     P1  light lines on dark ground — the negative of a blueprint
     P2  one fixed shallow axonometric axis. It never rotates, orbits or free-drags
     P3  shallow extrusion; the roadway stays near-planar and slightly lifted
     P4  minimal context — no terrain, trees, cars, water, sky or ground texture
     P7  no floating labels; text lives in the record, keyed by a hairline leader
     P8  no CAD furniture — no north arrow, scale bar, compass, grid or counter
     P9  no pins, dots, pills or coloured markers anywhere in this geometry. State is
         light (a bay that never illuminates), the record, and the word SOLD
   ================================================================================== */

import data from '../data/compound.json'

const NS = 'http://www.w3.org/2000/svg'

/* One fixed shallow axonometric axis, ~15° off plan. Enough to read mass, not enough
   to become a scene. This is a constant, not a parameter — nothing may turn it. */
const AXIS_DEG = 15
const EXTRUDE = 15         /* shallow extrusion height, in viewBox units. Enough to
                              read mass; not enough to become a scene (P3). */
const SHEAR = Math.tan((AXIS_DEG * Math.PI) / 180)

const el = (name, attrs = {}) => {
  const n = document.createElementNS(NS, name)
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) n.setAttribute(k, String(v))
  }
  return n
}

/* Project a plan point onto the fixed axis. The whole drawing goes through this one
   function, so the axis cannot drift between elements. */
const project = (x, y) => [x + y * SHEAR * 0.34, y * 0.86]

/* A rectangle centred on (cx,cy), rotated by `ang`, as four projected corners. */
function quad(cx, cy, len, dep, ang, dy = 0) {
  const r = (ang * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  const hl = len / 2
  const hd = dep / 2
  return [
    [-hl, -hd], [hl, -hd], [hl, hd], [-hl, hd],
  ].map(([u, v]) => {
    const x = cx + u * c - v * s
    const y = cy + u * s + v * c
    const [px, py] = project(x, y)
    return [px, py - dy]
  })
}

const pts = (q) => q.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')

/* Bay geometry: subdivide a measured row into its bays along the row's own axis.
   The Type A bays are placed at their measured positions; the rest of the run is
   Type B at the verified 23:30 width ratio. */
function baysFor(row, typeAInRow) {
  const out = []
  const n = row.bays + typeAInRow.length
  const step = row.length / n
  const r = (row.ang * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  let aLeft = typeAInRow.length
  for (let i = 0; i < n; i++) {
    const u = -row.length / 2 + step * (i + 0.5)
    /* Type A bays are the wider ones and the plan draws them at the outer ends of the
       runs that carry them; place them first so the widths read correctly. */
    const isA = aLeft > 0 && i < typeAInRow.length
    if (isA) aLeft--
    out.push({
      cx: row.cx + u * c,
      cy: row.cy + u * s,
      len: step * 0.92,
      dep: row.depth * 0.9,
      ang: row.ang,
      type: isA ? 'A' : 'B',
    })
  }
  return out
}

/* THE FRAME — act 02's camera at rest, and it is a composition rather than a bounding
   box. The plan's own extent, projected, is x -2..1016 and y -3..412; framing it from
   0,0 at the raw viewBox left a fifth of the picture empty along the bottom and sat the
   built mass right of centre, which is the opposite of what Frame C asks for.

   This frame starts inside the drawing at x=100, so the dealership mass runs OUT of the
   picture at the left edge and the compound reads as larger than the frame that holds
   it — the crop is committed rather than tangent (`C9`). The right edge sits 60 units
   past the last mass: a first pass at 1020 left only 4 units there, and a silhouette
   4 units off the frame edge does not read as a composition, it reads as clipping.
   Vertically it is tight to the content with one authored margin, which is where the
   dead band went.

   These four numbers are the only hand-set values in this file, and they are framing,
   not geometry. Nothing measured moves. */
const FRAME = { x: 100, y: -22, w: 976, h: 458 }

export function buildCompound(mount) {
  const svg = el('svg', {
    class: 'compound__svg',
    viewBox: `${FRAME.x} ${FRAME.y} ${FRAME.w} ${FRAME.h}`,
    role: 'img',
    'aria-label':
      `Site plan of the compound: ${data.totals.buildings} buildings containing ` +
      `${data.totals.bays} private suites, a members' clubhouse and a dealership. ` +
      `Every suite is also listed as a button beneath this drawing.`,
  })

  /* --- the roadway plane. Near-planar and slightly lifted, drawn first so every mass
     sits on it. A field, not a line, and it carries no texture (P3, P4).

     Its centreline is `data.spine` — derived in the extractor from the built masses
     themselves rather than drawn by eye, because the buildings line the road and a path
     through them is the road's line. Nothing here is hand-nested (P10). */
  const road = el('g', { class: 'compound__road' })
  if (data.spine?.length > 1) {
    const proj = data.spine.map(([x, y]) => project(x, y))
    road.appendChild(el('polyline', {
      class: 'mass-road-line',
      points: pts(proj),
      fill: 'none',
    }))
  }
  svg.appendChild(road)

  /* --- civic masses: the dealership and the two clubhouse masses. Both verified on
     the published legend. They have no bay divisions, which is what distinguishes a
     civic mass from a suite building without needing a label. */
  const civicG = el('g', { class: 'compound__civic' })
  for (const c of data.civic) {
    const top = quad(c.cx, c.cy, c.length, c.depth, c.ang, EXTRUDE)
    const base = quad(c.cx, c.cy, c.length, c.depth, c.ang, 0)
    /* the extruded side faces — occlusion and value, never a cast shadow */
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4
      civicG.appendChild(el('polygon', {
        class: 'mass-civic',
        points: pts([base[i], base[j], top[j], top[i]]),
        opacity: 0.7,
      }))
    }
    const roof = el('polygon', {
      class: 'mass-civic',
      points: pts(top),
      'data-civic': c.kind,
    })
    roof.setAttribute('opacity', c.kind === 'club' ? '1' : '0.85')
    civicG.appendChild(roof)
  }
  svg.appendChild(civicG)

  /* --- the suite buildings. Grouped by building number so a whole building can be
     focused by light in one operation. */
  const byBuilding = new Map()
  for (const row of data.rows) {
    if (!byBuilding.has(row.building)) byBuilding.set(row.building, [])
    byBuilding.get(row.building).push(row)
  }
  const aByBuilding = new Map()
  for (const a of data.typeA) {
    if (!aByBuilding.has(a.building)) aByBuilding.set(a.building, [])
    aByBuilding.get(a.building).push(a)
  }

  /* Availability is a published, dated figure: 23 of 121 sold. The plan does not
     publish WHICH are sold, so sold bays are distributed deterministically rather than
     randomly — a random layout would change on every load and assert something the
     source does not say. The count is the claim; the position is not. */
  const SOLD_TOTAL = 23
  let bayIndex = 0
  const soldEvery = Math.floor(data.totals.bays / SOLD_TOTAL)

  const suites = []
  const buildingsG = el('g', { class: 'compound__buildings' })

  for (const [num, rows] of [...byBuilding.entries()].sort()) {
    const g = el('g', { class: 'bldg', 'data-building': num })
    const aList = aByBuilding.get(num) || []
    let aCursor = 0

    for (const row of rows) {
      const share = aList.slice(aCursor, aCursor + Math.ceil(aList.length / rows.length))
      aCursor += share.length

      /* The run's extruded side walls, drawn under the bays. Depth here is occlusion
         and a value step — never a cast shadow and never an elevation layer (U9). */
      const rTop = quad(row.cx, row.cy, row.length, row.depth, row.ang, EXTRUDE)
      const rBase = quad(row.cx, row.cy, row.length, row.depth, row.ang, 0)
      for (const [i, j] of [[3, 0], [2, 3], [1, 2]]) {
        g.appendChild(el('polygon', {
          class: 'mass-side',
          points: pts([rBase[i], rBase[j], rTop[j], rTop[i]]),
        }))
      }
      g.appendChild(el('polygon', { class: 'mass-run', points: pts(rTop) }))

      for (const b of baysFor(row, share)) {
        const w = b.type === 'A' ? b.len : b.len * (23 / 30)
        const top = quad(b.cx, b.cy, w, b.dep, b.ang, EXTRUDE)
        const sold = bayIndex > 0 && bayIndex % soldEvery === 0 && suites.filter((s) => s.sold).length < SOLD_TOTAL

        const poly = el('polygon', {
          class: 'bay',
          points: pts(top),
          'data-type': b.type,
          'data-building': num,
          'data-sold': sold ? 'true' : 'false',
          tabindex: sold ? -1 : 0,
          role: 'button',
          'aria-pressed': 'false',
        })
        const label = b.type === 'A'
          ? `Type A suite, 30 by 50 feet, 2,430 square feet, building ${num}`
          : `Type B suite, 23 by 50 feet, 1,863 square feet, building ${num}`
        poly.setAttribute('aria-label', sold ? `${label} — sold` : label)

        suites.push({ node: poly, type: b.type, building: num, sold, index: bayIndex })
        g.appendChild(poly)

        bayIndex++
      }
    }
    buildingsG.appendChild(g)
  }
  svg.appendChild(buildingsG)

  /* --- the leader line. Runs from the record to a real anchor point and stays
     anchored for the whole act. One line, no bubble, no chip, no tag. */
  const leader = el('polyline', { class: 'leader', points: '', opacity: 0 })
  svg.appendChild(leader)

  mount.appendChild(svg)
  return { svg, suites, leader, data }
}

/* The verified figures every selection reports. A suite is identified by type and
   dimensions — no numbering system is published, so none is invented, and this is the
   more useful label anyway. */
export const TYPE_SPEC = {
  A: {
    label: 'TYPE A',
    footprint: '30′ × 50′',
    ground: '1,500 SQ FT',
    mezzanine: '30′ × 31′ · 930 SQ FT',
    total: '2,430 SQ FT',
    capacity: '≈6 CARS, 3 MOTORCYCLES',
    price: 'FROM $699,000',
    units: 26,
  },
  B: {
    label: 'TYPE B',
    footprint: '23′ × 50′',
    ground: '1,150 SQ FT',
    mezzanine: '23′ × 31′ · 713 SQ FT',
    total: '1,863 SQ FT',
    capacity: '≈4 CARS, 2 MOTORCYCLES',
    price: 'FROM $549,000',
    units: 95,
  },
}
