/* ==================================================================================
   REPAIR THE BUILDING LABELS IN src/data/compound.json.

   THE BUG.  extract-plan.py assigned every measured run and every Type A bay to the
   nearest numbered badge BY CENTRE (`label_for`).  The badges on the published plan do
   not sit at the centre of their building — they sit at one END of it, off the corner,
   the way a plan key is drawn.  So a nearest-centre test walks the numbering along a
   cluster of parallel runs: it gave building 03 two runs and building 01 two runs while
   buildings 02 and 05 got none at all, and shipped a nine-building compound that
   claimed eleven.  Five Type A bays were silently dropped with them.

   THE MEASURED TRUTH, read off assets/source/map.png:
     - the left cluster is 03 (one run), 02 (a back-to-back PAIR), 01 (one run)
     - the middle is 04, 05 (two short runs) and 06 (one long run)
     - the right is 07, 08, 10 (a back-to-back PAIR), 09, 11
     - every run carries a white Type A bay at EACH END

   THE FIX, and it is geometric rather than a table of corrections:

     1. GROUP the runs into masses first.  Two runs are one building when they are
        parallel (within 8 degrees), overlap along their length, and their faces touch
        within one depth.  That is what a double-row building IS.  Thirteen runs
        resolve to exactly eleven masses, which is the published count — the grouping
        is checked against it and this script refuses to write if it disagrees.

     2. ASSIGN each MASS to a badge by the distance from the badge to the mass
        RECTANGLE, not to its centre, cheapest first, one badge per mass.  A badge
        sitting off a corner is 0-30 units from that building rectangle and 50-100 from
        its neighbour, so the assignment is unambiguous.

     3. ASSIGN each Type A bay to the RUN it abuts, and take that run building number.
        The Type A bays are the white end caps of the runs; every one lands within 16
        units of its run and within 4.5 units of that run centreline, and the runner-up
        is at least twice as far in every one of the twenty-six cases.  The END it caps
        (L or R along the run axis) is recorded, so the drawing and the model can place
        it where the plan draws it instead of guessing.

   The result reconciles to the published figures exactly: 11 buildings, 121 suites,
   26 Type A, 95 Type B.  Nothing is invented and nothing is hand-placed; every number
   still comes from the measured geometry that was already in the file.
   ================================================================================== */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILE = path.join(ROOT, 'src/data/compound.json')
const d = JSON.parse(fs.readFileSync(FILE, 'utf8'))
const RAD = Math.PI / 180

/* Distance from a point to an oriented rectangle, and the point in the rectangle own
   frame. Zero inside. */
function rectDist(px, py, r) {
  const a = r.ang * RAD, c = Math.cos(a), s = Math.sin(a)
  const dx = px - r.cx, dy = py - r.cy
  const u = dx * c + dy * s
  const v = -dx * s + dy * c
  return {
    d: Math.hypot(Math.max(0, Math.abs(u) - r.length / 2), Math.max(0, Math.abs(v) - r.depth / 2)),
    u, v,
  }
}

/* Two runs are one mass when they are parallel, overlap along their length, and their
   faces touch. This is the back-to-back double-row building the plan draws twice. */
function oneMass(a, b) {
  let da = Math.abs(((a.ang - b.ang) % 180 + 180) % 180)
  if (da > 90) da = 180 - da
  if (da > 8) return false
  const t = ((a.ang + b.ang) / 2) * RAD, c = Math.cos(t), s = Math.sin(t)
  const dx = b.cx - a.cx, dy = b.cy - a.cy
  const along = Math.abs(dx * c + dy * s)
  const across = Math.abs(-dx * s + dy * c)
  return along < ((a.length + b.length) / 2) * 0.7 && across < ((a.depth + b.depth) / 2) * 1.10
}

const parent = d.rows.map((_, i) => i)
const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])))
for (let i = 0; i < d.rows.length; i++) {
  for (let j = i + 1; j < d.rows.length; j++) if (oneMass(d.rows[i], d.rows[j])) parent[find(i)] = find(j)
}
const masses = new Map()
d.rows.forEach((_, i) => {
  const k = find(i)
  if (!masses.has(k)) masses.set(k, [])
  masses.get(k).push(i)
})

if (masses.size !== d.totals.buildings) {
  console.error('REFUSING TO WRITE: grouped ' + masses.size + ' masses, the published count is ' + d.totals.buildings + '.')
  process.exit(1)
}

/* cheapest-first assignment, one badge per mass */
const pairs = []
for (const [k, idx] of masses) {
  for (const b of d.badges) {
    pairs.push({ k, idx, num: b.label, dist: Math.min(...idx.map((i) => rectDist(b.cx, b.cy, d.rows[i]).d)) })
  }
}
pairs.sort((a, b) => a.dist - b.dist)
const rowBuilding = new Array(d.rows.length)
const takenMass = new Set(), takenNum = new Set()
for (const p of pairs) {
  if (takenMass.has(p.k) || takenNum.has(p.num)) continue
  takenMass.add(p.k); takenNum.add(p.num)
  for (const i of p.idx) rowBuilding[i] = p.num
}
if (takenNum.size !== d.badges.length) {
  console.error('REFUSING TO WRITE: not every badge received a mass.')
  process.exit(1)
}

/* Type A bays: assigned to the run they cap, and the end they cap it at */
const aRow = [], aEnd = []
d.typeA.forEach((a, i) => {
  let best = null
  d.rows.forEach((r, j) => {
    const m = rectDist(a.cx, a.cy, r)
    if (!best || m.d < best.d) best = { j, ...m }
  })
  aRow[i] = best.j
  aEnd[i] = best.u < 0 ? 'L' : 'R'
})

const before = {
  rows: d.rows.map((r) => r.building),
  typeA: d.typeA.map((a) => a.building),
}

d.rows.forEach((r, i) => { r.building = rowBuilding[i] })
d.typeA.forEach((a, i) => {
  a.building = d.rows[aRow[i]].building
  a.row = aRow[i]
  a.end = aEnd[i]
})

/* the reconciliation, checked rather than asserted */
const perB = {}, perA = {}
d.rows.forEach((r) => { perB[r.building] = (perB[r.building] || 0) + r.bays })
d.typeA.forEach((a) => { perA[a.building] = (perA[a.building] || 0) + 1 })
const nums = [...new Set([...Object.keys(perB), ...Object.keys(perA)])].sort()
const sum = (o) => Object.values(o).reduce((x, y) => x + y, 0)
const fail = []
if (nums.length !== d.totals.buildings) fail.push('buildings ' + nums.length + ' != ' + d.totals.buildings)
if (sum(perA) !== d.totals.typeA) fail.push('typeA ' + sum(perA) + ' != ' + d.totals.typeA)
if (sum(perB) !== d.totals.typeB) fail.push('typeB ' + sum(perB) + ' != ' + d.totals.typeB)
if (sum(perA) + sum(perB) !== d.totals.bays) fail.push('bays ' + (sum(perA) + sum(perB)) + ' != ' + d.totals.bays)
if (fail.length) { console.error('REFUSING TO WRITE: ' + fail.join('; ')); process.exit(1) }

d._source.relabel = {
  by: 'tools/relabel-buildings.mjs',
  read: '2026-09-06',
  note: 'The badges on the published plan sit at one END of their building, so the '
    + 'nearest-badge-by-centre test in extract-plan.py walked the numbering along each '
    + 'cluster of parallel runs and left buildings 02 and 05 with no geometry. Runs are '
    + 'now grouped into masses first (parallel, overlapping, touching = one building, '
    + 'which resolves 13 runs into exactly the published 11 masses), each mass is '
    + 'assigned to the nearest badge BY RECTANGLE, and each Type A bay is assigned to '
    + 'the run it caps together with the end it caps. Reconciles to 11 / 121 / 26 / 95.',
  was: before,
}

fs.writeFileSync(FILE, JSON.stringify(d, null, 1))
console.log('RELABELLED  ' + FILE)
console.log('  masses            ' + masses.size)
console.log('  buildings         ' + nums.join(' '))
for (const n of nums) {
  console.log('    ' + n + '   ' + String((perB[n] || 0) + (perA[n] || 0)).padStart(3) + ' suites'
    + '   ' + String(perA[n] || 0).padStart(2) + ' type A'
    + '   ' + String(perB[n] || 0).padStart(2) + ' type B'
    + '   ' + d.rows.filter((r) => r.building === n).length + ' run(s)')
}
console.log('  totals            ' + (sum(perA) + sum(perB)) + ' suites, ' + sum(perA) + ' A, ' + sum(perB) + ' B  — reconciles')
