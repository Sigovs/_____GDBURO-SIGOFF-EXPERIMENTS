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

/* ----------------------------------------------------------------------------------
   CIRCULATION.

   The proposition this compound sells is not storage, it is a DRIVE: a gated road, and
   your own door at the end of it. The published material says so in the owners' own
   words — night drives that "start and finish at my own doors". The drawing has had
   that road in it since the first build and used it as a grey smudge under the masses.

   These two functions make it the organising line instead. `nearestOnSpine` gives the
   point on the measured roadway that serves a given mass, and `routeTo` returns the
   drive from the entry — `spine[0]`, which is the dealership end and the way in — to
   that point. Everything the interaction does with light travels along it.

   Both work in PLAN space and are projected by the caller, so the route is the same
   line the road is rather than an approximation drawn over it (`P10`). */
export function nearestOnSpine(spine, px, py) {
  let best = { i: 0, t: 0, d: Infinity, x: spine[0][0], y: spine[0][1] }
  for (let i = 0; i < spine.length - 1; i++) {
    const [ax, ay] = spine[i]
    const [bx, by] = spine[i + 1]
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy || 1
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
    const x = ax + dx * t
    const y = ay + dy * t
    const d = Math.hypot(px - x, py - y)
    if (d < best.d) best = { i, t, d, x, y }
  }
  return best
}

function routeTo(spine, px, py) {
  const n = nearestOnSpine(spine, px, py)
  return [...spine.slice(0, n.i + 1), [n.x, n.y]]
}

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
      /* THE DRAWN UNIT and THE BUILT SLOT are two different measurements, and conflating
         them is what put a 2.4ft slot between every pair of suites in the model.

         `len` is what the DRAWING shows: a unit with a hairline of air around it, so a
         plan reads as a row of rooms rather than one long bar.  `slot` is what the
         BUILDING is: the full pitch, edge to edge, because a suite's party wall is
         shared with its neighbour and there is no gap between them in the world.

         The model extrudes `slot`.  The drawing draws `len`.  Both come from the same
         `step`, so they cannot drift. */
      len: step * 0.92,
      slot: step,
      dep: row.depth * 0.9,
      depth: row.depth,
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
   not geometry. Nothing measured moves.

   `h` is a SEED rather than a fixed value. The stage's real aspect is not known until
   the element is measured, and a frame whose aspect disagrees with its container is
   exactly what left act 02 with a quarter of its stage empty under the drawing: a
   2.13:1 crop inside a 1.33:1 box letterboxes, and a letterbox at the bottom of a
   composition reads as the picture having stopped early rather than as air. So the
   composed decisions — the committed left crop at x=100, the 60-unit exit at the
   right, the vertical centre — are kept, and the HEIGHT is re-solved against the box
   the drawing is actually given (`restFrame`). Nothing measured moves. */
const FRAME = { x: 100, y: -22, w: 976, h: 458 }

/* The composed frame, re-solved for the stage's real aspect.

   Width and the left crop are the composition and never move. Height follows the box,
   anchored on the same vertical centre the hand-composed frame had, so the drawing
   grows into the stage instead of floating at the top of it. Clamped so a very tall
   box cannot pull in so much empty ground that the compound stops being the subject. */
export function restFrame(aspect) {
  /* The compound is a long diagonal band and the stage is a rectangle, so one of the
     two axes is always the binding one. Fitting the composed frame to the box by
     GROWING it — which is what a first pass did — pads whichever axis is slack and the
     drawing ends up smaller than the stage it was given, floating in its own margin.

     So the frame is fitted the other way: the composed crop is the CONTENT, and the
     slack axis is expanded around its own centre only as far as the aspect requires.
     Every unit of the composition is still in shot, the committed left crop is intact,
     and the drawing is as large as the box allows. */
  const cx = FRAME.x + FRAME.w / 2
  const cy = FRAME.y + FRAME.h / 2
  const a = Math.max(aspect, 0.35)
  let w = FRAME.w
  let h = FRAME.h
  if (w / h > a) h = w / a          /* box is taller than the crop — grow height */
  else w = h * a                    /* box is wider — grow width */
  return { x: cx - w / 2, y: cy - h / 2, w, h }
}

/* Fit a measured box into a frame of the given aspect, with `pad` of the box's own
   larger dimension as air on every side. This is what makes BUILDING and SUITE real
   camera positions rather than a change of stroke colour: the frame is derived from
   the subject's own footprint, so the drawing is reframed on the thing selected. */
export function frameFor(box, aspect, pad = 0.5) {
  const m = Math.max(box.width, box.height) * pad
  const x0 = box.x - m
  const y0 = box.y - m
  let w = box.width + m * 2
  let h = box.height + m * 2
  if (w / h < aspect) w = h * aspect
  else h = w / aspect
  return {
    x: x0 + (box.width + m * 2 - w) / 2,
    y: y0 + (box.height + m * 2 - h) / 2,
    w,
    h,
  }
}

export function buildCompound(mount) {
  /* The measured roadway, in plan space. Doors face it and every route runs along it,
     so it is read once here and passed down rather than reached for in four places. */
  const spine = data.spine?.length > 1 ? data.spine : null

  const svg = el('svg', {
    class: 'compound__svg',
    viewBox: `${FRAME.x} ${FRAME.y} ${FRAME.w} ${FRAME.h}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label':
      `Site plan of the compound: ${data.totals.buildings} buildings containing ` +
      `${data.totals.bays} private suites, a members' clubhouse and a dealership. ` +
      `Every suite is also listed as a button beneath this drawing.`,
  })

  /* --- THE COMPOUND PERIMETER. One line, and the drawing's boundary rank.

     `P4` asks for "the perimeter as one line" and `§11` reserves --rule-boundary for
     it; the CSS has been there since the first build and nothing emitted it, so the
     drawing shipped with only its partition and construction ranks and no top to the
     hierarchy. This is that line, and there is exactly one of it.

     The points are derived, not drawn: the published plan has no parcel line, so
     `tools/extract-plan.py` takes the outer envelope of the measured masses and the
     roadway that serves them, closed and offset by one unit depth. Nothing here is
     hand-nested (`P10`) — this file only projects what the extractor measured.

     Drawn FIRST, so it sits on the ground plane and every mass stands on top of it.
     The setback keeps it clear of the built faces, so nothing actually overlaps it. */
  if (data.perimeter?.length > 2) {
    const perimPts = pts(data.perimeter.map(([x, y]) => project(x, y)))

    /* THE SITE FIELD — the same measured points as the perimeter, filled.

       The perimeter was shipping as a line and nothing else, which meant the compound
       had a boundary but no GROUND: eleven masses at 1.10:1 against the page, inside an
       outline, floating in a column. A parcel is a plane before it is an edge, and the
       eye cannot read figure from ground when there is only one ground.

       So the enclosed area becomes a surface. It is the darkest thing in the act — the
       compound is a cut into the surveyed deck, not a patch laid on top of it — and it
       is what every mass, the roadway and the perimeter now stand on. No texture, no
       terrain, no gradient (`P4`): one flat value, which is what a site plan's ground
       is. Geometry is the extractor's, unchanged; this adds a fill, not a shape. */
    svg.appendChild(el('polygon', { class: 'site', points: perimPts }))

    svg.appendChild(el('polygon', {
      class: 'perimeter',
      points: perimPts,
      fill: 'none',
    }))
  }

  /* --- the roadway plane. Near-planar and slightly lifted, drawn first so every mass
     sits on it. A field, not a line, and it carries no texture (P3, P4).

     Its centreline is `data.spine` — derived in the extractor from the built masses
     themselves rather than drawn by eye, because the buildings line the road and a path
     through them is the road's line. Nothing here is hand-nested (P10). */
  const road = el('g', { class: 'compound__road' })
  let roadTrace = null
  if (data.spine?.length > 1) {
    const proj = data.spine.map(([x, y]) => project(x, y))
    road.appendChild(el('polyline', {
      class: 'mass-road-line',
      points: pts(proj),
      fill: 'none',
    }))

    /* THE ROAD'S CENTRELINE, as a drawn line rather than as a plane.

       The wide `mass-road-line` above is the road SURFACE — near-planar, lifted, and it
       has a width because a road has a width rather than an outline (P3). This is a
       different object on the same measured points: the centreline itself, hairline,
       which is what the rail has been drawing at the edge of the page since act 00.

       It exists so act 02's recognition has something TRUE to say. The rail's fragment
       and this line are the same kind of object — a spine with masses coming off it —
       so laying one over the other states a fact rather than performing an effect. The
       points come from `data.spine`, which the extractor derives from the built masses
       themselves, so nothing here is hand-nested (P10).

       Invisible until the recognition beat asks for it; afterwards it recedes to
       construction weight and stays, because a road centreline IS a construction line
       and holding it at information weight would leave CAD furniture on a drawing that
       does not need any (P8). Both are driven from act 02's pin — see motion.js. */
    roadTrace = el('polyline', {
      class: 'mass-road-trace',
      points: pts(proj),
      fill: 'none',
      opacity: 0,
    })
    road.appendChild(roadTrace)
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

        /* THE DOOR, and it is the most useful mark on this drawing.

           Every suite is a drive-in room: one commercial overhead door onto the private
           road, which is the entire product. Which of a bay's two long edges carries it
           is not a choice — it is whichever one faces the roadway, and the roadway is
           measured. So both edge midpoints are tested against the nearest point on the
           spine and the closer one wins, which gets the back-to-back runs right for
           free: the two rows of a double building face opposite ways and each row's
           doors turn to follow its own side of the drive.

           Drawn as a segment on the road-facing edge at half the bay's width — the
           opening's real share of the frontage, near enough that a reader counting
           doors is counting the right thing. Absent at compound level, where a building
           is one mass and 121 door marks would be a texture; present from building
           level on, which is where the drawing stops being a plan of the site and
           starts being a plan of the rooms (`P6`). */
        const r = (b.ang * Math.PI) / 180
        const nx = -Math.sin(r)
        const ny = Math.cos(r)
        const faceA = [b.cx + nx * b.dep / 2, b.cy + ny * b.dep / 2]
        const faceB = [b.cx - nx * b.dep / 2, b.cy - ny * b.dep / 2]
        const near = spine ? nearestOnSpine(spine, b.cx, b.cy) : null
        const towardA = !near || Math.hypot(faceA[0] - near.x, faceA[1] - near.y)
          <= Math.hypot(faceB[0] - near.x, faceB[1] - near.y)
        const face = towardA ? faceA : faceB

        /* THE THRESHOLD SITS ON THE APRON, not on the wall.

           Drawn exactly on the bay's road-facing edge, the door was invisible — that
           edge is the run's own outline, which rises to boundary weight for precisely
           the building the doors belong to, so 2px of door was landing on 2px of
           identical line. A mark can only be seen against something it is not.

           So it steps out by APRON units onto the ground in front of the opening, which
           is the conventional way a plan shows a threshold and is also literally where
           the car is: on the apron, facing in. It now reads against the site field, and
           the run outline stays the run outline. */
        const APRON = 5
        const sign = towardA ? 1 : -1
        const front = [face[0] + nx * APRON * sign, face[1] + ny * APRON * sign]
        const hw = (w * 0.5) / 2
        const p1 = project(front[0] + Math.cos(r) * hw, front[1] + Math.sin(r) * hw)
        const p2 = project(front[0] - Math.cos(r) * hw, front[1] - Math.sin(r) * hw)
        const door = el('line', {
          class: 'door',
          x1: p1[0], y1: p1[1] - EXTRUDE,
          x2: p2[0], y2: p2[1] - EXTRUDE,
        })
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

        suites.push({
          node: poly, door, type: b.type, building: num, sold, index: bayIndex,
          /* plan-space centre and the door's own edge point: the last leg of every
             route, and what lets a route end at a door rather than at a
             building-shaped blob */
          cx: b.cx, cy: b.cy, front,
          /* The bay's own footprint in PLAN space, before the axonometric projection.
             The SVG drawing needs the projected quad; the WebGL model needs the plan
             rectangle and extrudes it itself. Both read the same measured numbers from
             the same loop, so the two representations cannot drift apart. */
          w, dep: b.dep, ang: b.ang, faceNormal: [nx * sign, ny * sign],
          /* the built dimensions, for the model: full pitch and full building depth */
          slot: b.slot, depth: b.depth,
        })
        g.appendChild(poly)
        g.appendChild(door)

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

  /* THE ROUTE — the drive from the gate to whatever the visitor is considering.

     One polyline, over the road and on the road's own measured points, drawn from the
     entry outward. It is the act's whole answer to "what does hovering a building
     TELL me": not that the building is highlighted, but that this is the way in to it.
     Restrained light travelling a real relationship, which is the only kind of light
     this system allows to move (`§3`).

     Drawn last of the ground layers and before the masses would be wrong — a road runs
     between buildings, not over them — but it is a lit line rather than a surface, and
     a route that disappeared behind every mass it passes could not be followed. It sits
     above, at hairline weight, and reads as a route drawn ON the plan. */
  const route = el('polyline', { class: 'route', points: '', fill: 'none' })
  svg.appendChild(route)

  mount.appendChild(svg)

  /* --- THE BUILDINGS, as camera subjects.

     A level is only a level if the drawing can be framed on it, and framing needs a
     box. These are read off the rendered geometry rather than recomputed from the
     source: the projection, the extrusion and the bay widths all feed the silhouette,
     so the only honest bounding box is the one the browser measures on what was
     actually drawn. Measured once, after mount, and re-measured never — nothing in
     this drawing moves. */
  const buildings = []
  for (const g of svg.querySelectorAll('.bldg')) {
    const num = g.dataset.building
    const mine = suites.filter((s) => s.building === num)
    buildings.push({
      num,
      node: g,
      box: g.getBBox(),
      suites: mine,
      open: mine.filter((s) => !s.sold).length,
      sold: mine.filter((s) => s.sold).length,
      typeA: mine.filter((s) => s.type === 'A').length,
      typeB: mine.filter((s) => s.type === 'B').length,
      runs: g.querySelectorAll('.mass-run').length,
    })
  }
  buildings.sort((a, b) => a.num.localeCompare(b.num))
  const byNum = new Map(buildings.map((b) => [b.num, b]))

  /* Each building's own place on the drive, in plan space: the mean of the runs that
     make it up, which is the point the road actually serves. */
  for (const b of buildings) {
    const rows = data.rows.filter((r) => r.building === b.num)
    b.cx = rows.reduce((a, r) => a + r.cx, 0) / rows.length
    b.cy = rows.reduce((a, r) => a + r.cy, 0) / rows.length
  }

  /* THE ROUTES, precomputed. There are nine of them and they never change, so they are
     solved once here rather than on every pointer move — a route recalculated on
     pointermove is a nearest-point search per frame for a line that was already known
     before the page loaded. A suite's route is its building's, plus the last leg from
     the drive to that one door. */
  if (spine) {
    for (const b of buildings) {
      /* The drive has to ARRIVE. Terminating the route at the nearest point on the
         measured spine left it ending in open ground a hundred units short of the mass
         it was about — a line that stops before it gets anywhere reads as a draw that
         failed, not as a route.

         The spine is an eight-point centreline and the buildings are served off it, so
         the last leg is the connection between the two: from the roadway to the door
         that is closest to it. It lands on the building's own frontage, which is where
         a drive actually ends, and it is the same move the suite route makes one step
         further in. */
      const legs = routeTo(spine, b.cx, b.cy).map(([x, y]) => project(x, y))
      const end = legs[legs.length - 1]
      let best = null
      for (const s of b.suites) {
        const [px, py] = project(s.front[0], s.front[1])
        const d = Math.hypot(px - end[0], py - (end[1] + EXTRUDE))
        if (!best || d < best.d) best = { d, p: [px, py - EXTRUDE] }
      }
      b.route = pts(best ? [...legs, best.p] : legs)
      b.arrival = best?.p || end
    }
    for (const s of suites) {
      /* The last leg leaves the roadway and arrives AT THE DOOR — lifted by the same
         extrusion the door mark is lifted by, so the line lands on the opening instead
         of on the ground beneath it. This is the join that makes the route read as a
         drive rather than as a highlighted road. */
      const legs = routeTo(spine, s.cx, s.cy).map(([x, y]) => project(x, y))
      const [px, py] = project(s.front[0], s.front[1])
      s.route = pts([...legs, [px, py - EXTRUDE]])
    }
  }

  /* A BAY REFERENCE, and it is deliberately not a unit number.

     The published material numbers buildings and nothing else — there is no suite
     numbering anywhere in the source, and inventing one would put a plausible figure
     on screen that the developer would then have to honour (`CP7`). So each bay gets
     its position in its own building, in drawing order, and the record says in as many
     words that it is a reference to this drawing rather than an address. It is what
     lets the level line name one bay out of eleven without asserting anything. */
  for (const b of buildings) {
    b.suites.forEach((s, i) => {
      s.bldg = b
      s.ordinal = String(i + 1).padStart(2, '0')
      s.ref = `${b.num} · ${s.ordinal}`
      s.node.setAttribute('data-ref', s.ref)
      s.node.setAttribute(
        'aria-label',
        `${s.node.getAttribute('aria-label')} — bay ${s.ordinal} on this drawing`,
      )
    })
  }

  return { svg, suites, buildings, byNum, leader, route, roadTrace, data }
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
