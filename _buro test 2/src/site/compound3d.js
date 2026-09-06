/* ==================================================================================
   THE COMPOUND, IN THREE DIMENSIONS — act 02's hero.

   A PRESENTATION MODEL, not a scene and not a game. The thing this is trying to be is
   the object an architect puts on a table in front of a buyer: a site slab with real
   thickness, the roads cut into it, the masses standing on it, one good light, and the
   shadows that light casts. Everything below serves that and nothing else.

   THE GEOMETRY IS NOT DRAWN BY EYE. Every footprint, angle, length, depth and door
   orientation comes from `src/data/compound.json` by way of the same build that makes
   the SVG — `compound.js` hands over its own bay list, so the drawing and the model are
   two representations of one measurement and cannot drift apart (`P10`).

   What is authored here rather than measured: storey heights, slab thickness, road
   width, materials and light. Those are not in the source, they are declared, and each
   one is marked where it is set.

   The SVG is not thrown away. It is the reduced-motion path, the no-WebGL path and the
   accessibility floor: every suite is a real focusable button with a real name there,
   and this file never becomes the only way to reach a state.
   ================================================================================== */

import * as THREE from 'three'
/* One implementation of 'which point on the drive serves this thing', shared with the
   drawing so the doors, the aprons, the planting setback and the routes cannot disagree
   about where the roadway is. */
import { nearestOnSpine } from './compound.js'

/* ----------------------------------------------------------------------------------
   DECLARED DIMENSIONS. The source measures the plan; it does not measure the section.

   `units_per_ft` is 0.7507, so one data unit is 1.332 feet and every height below is
   stated in feet first. They are the published building's real figures where the source
   gives them (a suite is 50' deep with a 31' mezzanine, so a two-storey shell), and a
   restrained architectural estimate where it does not.
   ---------------------------------------------------------------------------------- */
const U = 0.7507                     /* units per foot */
const ft = (f) => f * U

const H_SUITE = ft(26)               /* parapet of a two-storey suite shell */
const H_CIVIC = ft(30)               /* clubhouse and dealership — one storey taller */
const H_ROOF = ft(1.6)               /* the roof slab that caps a run */
const SLAB = ft(26)                  /* the site plinth's thickness. A presentation
                                        model's base is a real object with a real edge;
                                        this is what makes the compound sit ON something
                                        rather than float in front of the page. */
const ROAD_W = ft(24)                /* the one declared assumption already in the
                                        source's own note, reused rather than reinvented */
const ROAD_LIFT = 0.35               /* the roadway sits proud of the slab, so its edge
                                        catches the key light like a kerb */

/* Scene scale. The site is ~1100 x 565 data units; at 1:1 the camera numbers get
   unwieldy and the shadow camera loses precision. Everything is built at source scale
   inside one group and that group is scaled once. */
const S = 0.02

/* The palette, lifted straight off the token file so the model and the page are the
   same system. These are the SURFACE colours; light does the rest. */
/* THE VALUE LOGIC, and it is what makes this dark rather than clay.

   The order is: SITE darkest, then road, then roof, then wall, then the civic masses.
   The compound has to be the figure and the site the ground. A pass with those two the
   other way round — a pale concrete plinth carrying dark buildings — rendered as a
   model of a car park, and it is the same defect the flat drawing had before the site
   field went in, arriving again in a new medium.

   Walls sit above roofs on purpose. From three-quarters the roof is the large quiet
   plane and the wall is the edge that meets the sun, so every sunward face gets a
   bright rim and the compound reads as relief rather than as a set of plates. */
const C = {
  void: 0x07080a,
  /* GROUND — engineered earth between the paving. Darkest surface on the model, and
     the thing every other value is measured against. */
  slabTop: 0x191e24,
  slabSide: 0x191f26,   /* the plinth edge must CATCH light — it is what says "object" */
  concrete: 0x363d45,   /* aprons, forecourts, the gate threshold */
  road: 0x1c2128,       /* asphalt: darker than concrete, smoother */
  /* BUILT — the cladding is the lightest thing in the compound, which is what makes the
     architecture the figure. The last pass had wall and roof within one step of each
     other and the buildings merged into their own roofs. */
  wall: 0x6a7683,
  roof: 0x39424d,       /* parapet cap */
  membrane: 0x23292f,   /* the roof field, recessed inside the parapet */
  trim: 0x161b21,       /* fascia, frames, kerbs, door segments */
  civic: 0x7b8794,      /* the clubhouse reads lighter — it is the shared building */
  glass: 0x0b1119,
  door: 0x11161c,
  sold: 0x1b2026,
  lit: 0x8e9aa6,
  lume: 0xcbd6de,
}

const v2 = (x, y) => new THREE.Vector2(x, y)

/* The two suite types, as the callouts say them. The record carries the full spec; a
   label on the model gets the two facts that fit on one line. */
const TYPE_LABEL = {
  A: { label: 'Type A · 2,430 sq ft', foot: "30' x 50'" },
  B: { label: 'Type B · 1,863 sq ft', foot: "23' x 50'" },
}

/* A ribbon along a polyline, as a flat mesh. The road is a SURFACE — it has a width,
   kerbs and a centre — and drawing it as a fat line would give it none of those. */
function ribbon(points, width) {
  const half = width / 2
  const pos = []
  const idx = []
  const norm = []
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const a = points[Math.max(0, i - 1)]
    const b = points[Math.min(points.length - 1, i + 1)]
    let dx = b[0] - a[0]
    let dy = b[1] - a[1]
    const l = Math.hypot(dx, dy) || 1
    dx /= l; dy /= l
    const nx = -dy * half
    const ny = dx * half
    pos.push(p[0] + nx, 0, p[1] + ny)
    pos.push(p[0] - nx, 0, p[1] - ny)
    norm.push(0, 1, 0, 0, 1, 0)
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3
    idx.push(a, c, b, b, c, d)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3))
  g.setIndex(idx)
  return g
}

export function initCompound3D(mount, model, opts = {}) {
  const data = model.data
  if (!data?.perimeter?.length) return null

  /* The measured roadway centreline, read once. Doors face it, aprons are laid against
     it, planting is kept clear of it and every route runs along it — four things that
     must all agree about where the drive is. */
  const spine = data.spine?.length > 1 ? data.spine : null

  /* --- RENDERER ------------------------------------------------------------------
     ACES tone mapping and a real colour space, because the whole look depends on a
     dark image holding its shadow detail rather than crushing to black. DPR is capped
     at 2: this is a page, and the third pixel of a retina display buys nothing on
     matte architectural surfaces. */
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  } catch { return null }
  if (!renderer.getContext()) return null

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.22
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.domElement.className = 'compound__gl'
  mount.appendChild(renderer.domElement)

  const scene = new THREE.Scene()

  /* Atmospheric separation. The far end of the compound sits back into the ground
     value instead of staying at the same contrast as the near end — the single
     cheapest thing that makes a model read as deep rather than flat. */
  /* Fog resolves toward the act's own ground value, so the far end of the compound
     dissolves INTO the page instead of fading to a black that is not on the palette. */
  scene.fog = new THREE.Fog(0x141920, 19, 62)

  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 260)
  const narrow = () => window.matchMedia('(max-width: 1024px)').matches

  /* --- THE SKY, and it is what sets the hour. -------------------------------------
     RoomEnvironment lit every surface with the reflections of a white studio, which is
     why the first passes read as a clay model no matter what the key did: a PBR surface
     is mostly its environment, and the environment was a room.

     This is a blue-hour dome instead — deep indigo overhead falling to a cold pale band
     at the horizon and a near-black ground bounce — built once into a tiny gradient
     texture and pushed through PMREM. Every roof plane now reflects a sky, every wall
     picks up horizon light along its top edge, and the compound is outdoors at dusk
     rather than on a turntable in a studio. */
  const pmrem = new THREE.PMREMGenerator(renderer)
  const skyCanvas = document.createElement('canvas')
  skyCanvas.width = 4
  skyCanvas.height = 256
  {
    const g = skyCanvas.getContext('2d')
    const grad = g.createLinearGradient(0, 0, 0, 256)
    grad.addColorStop(0.00, '#0a1220')   /* zenith  — deep indigo */
    grad.addColorStop(0.42, '#1d3348')   /* upper sky */
    grad.addColorStop(0.52, '#4a6478')   /* the horizon band, and the brightest thing */
    grad.addColorStop(0.60, '#141a20')   /* ground haze */
    grad.addColorStop(1.00, '#05070a')   /* the dark under-bounce */
    g.fillStyle = grad
    g.fillRect(0, 0, 4, 256)
  }
  const skyTex = new THREE.CanvasTexture(skyCanvas)
  skyTex.mapping = THREE.EquirectangularReflectionMapping
  skyTex.colorSpace = THREE.SRGBColorSpace
  const skyScene = new THREE.Scene()
  skyScene.background = skyTex
  scene.environment = pmrem.fromScene(skyScene, 0.02).texture
  scene.environmentIntensity = 1.15
  skyTex.dispose()

  /* --- LIGHT ---------------------------------------------------------------------
     One key, one sky, one low fill, and that is the whole rig. Architectural models are
     lit like objects on a table: a single raking sun that produces long readable
     shadows across the site, a cool hemisphere for the sky it sits under, and a very
     low warm bounce so the shadowed faces do not go dead. */
  /* THE KEY. A low raking sun off the left shoulder — low enough that every run throws
     its length across the slab, which is the shadow that makes a model read as solid.
     Warm-neutral against the cool sky, because a single-temperature rig renders as a
     clay render rather than as a lit object. */
  /* THE LAST SUN. Very low, very warm, off the west shoulder — the light that is about
     to leave. Low enough that every run lays its own length across the site, which is
     the shadow that makes a model read as solid, and warm enough to hold a real
     temperature argument against the indigo sky. This is the only light that casts. */
  const key = new THREE.DirectionalLight(0xffd9a8, 4.6)
  key.position.set(-19, 9.5, 6)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.bias = -0.0008
  key.shadow.normalBias = 0.02
  const sc = key.shadow.camera
  sc.left = -15; sc.right = 15; sc.top = 15; sc.bottom = -15; sc.near = 1; sc.far = 60
  sc.updateProjectionMatrix()
  scene.add(key)
  scene.add(key.target)

  /* The sky as a lamp, cold over near-black ground. It is the FILL at this hour — at
     blue hour the sky is doing most of the work and the sun is doing the drawing. */
  scene.add(new THREE.HemisphereLight(0x6f90b4, 0x05070a, 1.55))

  /* THE RIM. Cold, low, from behind: it puts a cool edge along every far roof plane so
     the compound has a silhouette instead of dissolving into its own shadow. It casts
     nothing and it is the coldest thing in the rig — the temperature split between this
     and the key IS the hour. */
  const rim = new THREE.DirectionalLight(0x9fc2e6, 1.9)
  rim.position.set(11, 3.2, -18)
  scene.add(rim)

  /* THE CAMERA FILL, and it is the one light in this rig that is not physical.

     Two problems have one answer. The near half of the compound sat in the key's own
     shadow and rendered muddy; and orbiting to the far side put the whole model into
     silhouette, because a fixed sun means a quarter of every turn is backlit.

     So one soft, cold, low-intensity light rides with the camera — the photographer's
     on-axis fill. It casts nothing and it is weak enough that the key still draws every
     form; what it does is lift the shadow side off the floor so surfaces stay readable
     from any angle. This is a deliberate departure from a physically-motivated rig and
     it is the difference between a render that survives being turned and one that only
     works from the angle it was composed at. */
  const camFill = new THREE.DirectionalLight(0xa8c0d8, 1.15)
  scene.add(camFill)
  scene.add(camFill.target)

  /* THE TABLE. A plane at the slab's underside, carrying nothing but the shadow the
     model throws onto it. This is what makes the compound an OBJECT PLACED ON the page
     rather than a picture floating in front of it — the contact shadow is the whole of
     the effect, so the plane itself is invisible. */
  const table = new THREE.Mesh(
    new THREE.PlaneGeometry(4200, 4200),
    new THREE.ShadowMaterial({ opacity: 0.62, color: 0x000000 }),
  )
  table.rotation.x = -Math.PI / 2
  table.receiveShadow = true

  /* --- MATERIALS. One instance each, shared by every mesh that wears it. ---------- */
  /* THE MATERIAL PALETTE.

     Nine surfaces, and what separates them is ROUGHNESS and METALNESS as much as value.
     A palette that varies only in colour renders as flat fills on meshes no matter how
     it is lit, because every surface returns the environment identically; the moment
     the metal cladding is smoother than the concrete and the membrane is rougher than
     both, the same light produces three different surfaces.

       ground      engineered earth, fully matte, no specular at all
       concrete    the plinth and the aprons — cool, matte, faintly reflective
       asphalt     darker than concrete and slightly smoother, so the drive reads wet-ish
                   at dusk the way asphalt does
       wall        premium metal cladding: the lightest surface and the only one with
                   real metalness, so it carries the key's highlight along every sunward
                   face
       roof        parapet cap — cladding's duller cousin
       membrane    the roof field itself, the roughest thing in the model
       trim        dark metal: fascia, frames, kerbs, door segmentation
       door        segmented dark metal, smoother than trim so the leaf reads as a
                   different component from its frame
       glass       deep blue-black with a controlled reflection, civic buildings only */
  const M = {
    slab: new THREE.MeshStandardMaterial({ color: C.slabTop, roughness: 1, metalness: 0 }),
    slabSide: new THREE.MeshStandardMaterial({ color: C.slabSide, roughness: 0.95, metalness: 0 }),
    concrete: new THREE.MeshStandardMaterial({ color: C.concrete, roughness: 0.88, metalness: 0.03 }),
    road: new THREE.MeshStandardMaterial({ color: C.road, roughness: 0.62, metalness: 0.05 }),
    wall: new THREE.MeshStandardMaterial({ color: C.wall, roughness: 0.46, metalness: 0.34 }),
    roof: new THREE.MeshStandardMaterial({ color: C.roof, roughness: 0.66, metalness: 0.2 }),
    membrane: new THREE.MeshStandardMaterial({ color: C.membrane, roughness: 0.99, metalness: 0 }),
    trim: new THREE.MeshStandardMaterial({ color: C.trim, roughness: 0.4, metalness: 0.55 }),
    civic: new THREE.MeshStandardMaterial({ color: C.civic, roughness: 0.4, metalness: 0.3 }),
    glass: new THREE.MeshStandardMaterial({ color: C.glass, roughness: 0.08, metalness: 0.55 }),
    door: new THREE.MeshStandardMaterial({ color: C.door, roughness: 0.3, metalness: 0.62 }),
    sold: new THREE.MeshStandardMaterial({ color: C.sold, roughness: 0.85, metalness: 0.1 }),
    wallLight: new THREE.MeshBasicMaterial({ color: 0xffc07a }),
  }

  /* --- THE MODEL GROUP. Everything measured lives in here, at source scale. ------- */
  const root = new THREE.Group()
  root.scale.setScalar(S)
  scene.add(root)

  /* The compound's own centre, so the model turns about itself rather than about the
     origin of a coordinate system nobody chose. */
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const [x, y] of data.perimeter) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }
  const cX = (minX + maxX) / 2
  const cY = (minY + maxY) / 2
  const site = new THREE.Group()
  site.position.set(-cX, 0, -cY)
  root.add(site)

  /* --- THE SITE SLAB. The model's base, and a real object with a real edge. -------
     ExtrudeGeometry emits two material groups — the caps and the sides — so the top
     face and the plinth edge can be different materials without a second mesh. */
  /* rotateX(+90) maps a shape point (x, y) to world (x, 0, y), so PLAN Y GOES IN
     UNNEGATED — every mass below places itself at world z = plan y, and negating here
     built the slab as a mirror image of the compound standing on it. */
  const shape = new THREE.Shape(data.perimeter.map(([x, y]) => v2(x, y)))
  const slabGeo = new THREE.ExtrudeGeometry(shape, { depth: SLAB, bevelEnabled: false })
  slabGeo.rotateX(Math.PI / 2)
  const slab = new THREE.Mesh(slabGeo, [M.slab, M.slabSide])
  slab.position.z = 0
  slab.receiveShadow = true
  slab.name = 'slab'
  site.add(slab)

  /* The table goes under the plinth, in the site's own space, so it turns with the
     model and the contact shadow never slides off it. */
  table.position.y = -SLAB
  site.add(table)

  /* --- THE ROADWAY, laid onto the slab. ------------------------------------------ */
  let road = null
  if (data.spine?.length > 1) {
    const g = ribbon(data.spine.map(([x, y]) => [x, y]), ROAD_W)
    road = new THREE.Mesh(g, M.road)
    road.position.y = ROAD_LIFT
    road.receiveShadow = true
    site.add(road)
  }

  /* ================================================================================
     SITE CONTEXT.

     The model was buildings standing on a bare plate, and a bare plate is not a site.
     Everything added below is DERIVED from geometry that was already measured — no
     feature is placed by eye and nothing is invented:

       APRONS      the paved forecourt each run needs, laid on the door side, because
                   the doors' orientation was already solved against the roadway
       LANDSCAPE   the ground that is neither road nor building nor apron, given its own
                   darker, rougher material so the site reads as ground rather than deck
       PLANTING    low masses set along the parcel edge, at sample points the algorithm
                   rejects unless they clear every building and the drive
       GATE        two piers and a lit threshold at spine[0], which is the entry the
                   whole route already starts from and the subject of act 00's photograph

     ================================================================================ */

  /* --- APRONS. The forecourt in front of every run's doors. ---------------------- */
  const apronMat = M.concrete
  const apronGeo = new THREE.PlaneGeometry(1, 1)
  const APRON_D = ft(46)          /* deep enough to stand a car on, which is the point */
  for (const row of data.rows) {
    const B = buildingApronDir(row)
    if (!B) continue
    const a = new THREE.Mesh(apronGeo, apronMat)
    a.rotation.x = -Math.PI / 2
    a.rotation.z = (row.ang * Math.PI) / 180
    a.scale.set(row.length * 1.04, APRON_D, 1)
    a.position.set(
      row.cx + B[0] * (row.depth / 2 + APRON_D / 2),
      ROAD_LIFT * 0.5,
      row.cy + B[1] * (row.depth / 2 + APRON_D / 2),
    )
    a.receiveShadow = true
    site.add(a)
  }

  /* --- PARKING, AND THE KERB. -----------------------------------------------------

     The site read as a dark plate because nothing on it had a scale. A parking bay is
     about eighteen feet long and nine wide, and once a few hundred of them are marked
     on the aprons the eye finally has a unit to measure the buildings against — it is
     the cheapest scale cue in site design and the one this model was missing.

     Every stripe is derived: they run along each measured run's apron, perpendicular to
     the run's own axis, at the real bay pitch. One InstancedMesh for all of them.

     The kerb is the other half: a hairline of concrete down both edges of the measured
     drive, which is what stops the asphalt bleeding into the ground plane. */
  {
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x8d97a2, roughness: 0.85, metalness: 0 })
    const stripeGeo = new THREE.PlaneGeometry(1, 1)
    const PITCH = ft(9.5)
    const LEN = ft(17)
    const marks = []
    for (const row of data.rows) {
      const dir = buildingApronDir(row)
      if (!dir) continue
      const r = (row.ang * Math.PI) / 180
      const ux = Math.cos(r), uy = Math.sin(r)
      const n = Math.floor(row.length / PITCH)
      /* The parking sits on the OUTER half of the apron, leaving the inner half as the
         manoeuvring aisle in front of the doors — which is how a drive-in court works. */
      const off = row.depth / 2 + APRON_D * 0.62
      for (let k = 0; k <= n; k++) {
        const u = -row.length / 2 + k * PITCH
        marks.push([row.cx + ux * u + dir[0] * off, row.cy + uy * u + dir[1] * off, r])
      }
    }
    if (marks.length) {
      const stripes = new THREE.InstancedMesh(stripeGeo, stripeMat, marks.length)
      const m4 = new THREE.Matrix4()
      const sc3 = new THREE.Vector3(ft(0.5), LEN, 1)
      for (const [i, [x, y, r]] of marks.entries()) {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, r + Math.PI / 2))
        m4.compose(new THREE.Vector3(x, ROAD_LIFT * 0.6, y), q, sc3)
        stripes.setMatrixAt(i, m4)
      }
      stripes.instanceMatrix.needsUpdate = true
      site.add(stripes)
    }

    /* The kerb. Two thin concrete lines following the measured centreline at half the
       road width — the edge the asphalt stops at. */
    if (spine) {
      for (const side of [1, -1]) {
        const pts3 = spine.map(([x, y], i) => {
          const a = spine[Math.max(0, i - 1)]
          const b2 = spine[Math.min(spine.length - 1, i + 1)]
          const dx = b2[0] - a[0], dy = b2[1] - a[1]
          const l = Math.hypot(dx, dy) || 1
          return [x + (-dy / l) * (ROAD_W / 2) * side, y + (dx / l) * (ROAD_W / 2) * side]
        })
        const kerb = new THREE.Mesh(ribbon(pts3, ft(1.4)), M.concrete)
        kerb.position.y = ROAD_LIFT + 0.05
        kerb.receiveShadow = true
        site.add(kerb)
      }
    }
  }

  /* Which way a run's doors face — the same test the doors themselves went through,
     applied to the run rather than to each bay. */
  function buildingApronDir(row) {
    if (!spine) return null
    const r = (row.ang * Math.PI) / 180
    const nx = -Math.sin(r)
    const ny = Math.cos(r)
    const n = nearestOnSpine(spine, row.cx, row.cy)
    const a = [row.cx + nx * row.depth, row.cy + ny * row.depth]
    const b = [row.cx - nx * row.depth, row.cy - ny * row.depth]
    return Math.hypot(a[0] - n.x, a[1] - n.y) <= Math.hypot(b[0] - n.x, b[1] - n.y)
      ? [nx, ny] : [-nx, -ny]
  }

  /* --- PLANTING. -------------------------------------------------------------------

     The last pass planted single icosahedrons and they read as moss balls, because a
     tree is not a blob: it is a dark vertical with a mass held above it, and the GAP
     between the two is what the eye identifies. So every tree here is a trunk plus a
     canopy, and the canopies come in three families with different silhouettes —
     upright, spreading and columnar — assigned deterministically so the planting has
     variety without ever being random.

     Foliage is very dark olive, well below the architecture in value. Landscape frames
     buildings; the moment planting competes with a facade it has stopped being
     landscape and started being scenery. */
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x14171a, roughness: 0.95, metalness: 0 })
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1e2a22, roughness: 1, metalness: 0, flatShading: true })
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 1, 6)
  const canopyGeo = [
    new THREE.IcosahedronGeometry(1, 1),                 /* upright — the common one */
    new THREE.DodecahedronGeometry(1, 0),                /* spreading, flatter crown */
    new THREE.ConeGeometry(0.72, 2.1, 7, 1),             /* columnar, for the edges */
  ]
  const treeGeo = canopyGeo[0]
  const treeMat = leafMat
  {
    const occupied = []
    for (const row of data.rows) occupied.push([row.cx, row.cy, Math.max(row.length, row.depth) * 0.7])
    for (const c of data.civic) occupied.push([c.cx, c.cy, Math.max(c.length, c.depth) * 0.7])

    const clear = (x, y) => {
      for (const [ox, oy, rad] of occupied) if (Math.hypot(x - ox, y - oy) < rad) return false
      if (spine) { const n = nearestOnSpine(spine, x, y); if (n.d < ROAD_W * 1.9) return false }
      return true
    }

    /* Walk the measured parcel line and step inward. A tree is planted only where the
       point survives every test, so the planting reads the site's own leftover ground
       instead of being scattered over it. */
    const per = data.perimeter
    let planted = 0
    for (let i = 0; i < per.length && planted < 120; i++) {
      const [px, py] = per[i]
      const [qx, qy] = per[(i + 1) % per.length]
      const mx = (px + qx) / 2
      const my = (py + qy) / 2
      const toC = [cX - mx, cY - my]
      const l = Math.hypot(toC[0], toC[1]) || 1
      for (const inset of [22, 46, 74]) {
        const x = mx + (toC[0] / l) * inset
        const y = my + (toC[1] / l) * inset
        if (!clear(x, y)) continue

        /* Family, height and rotation all derive from the vertex index: the planting is
           varied and completely deterministic, so it is the same compound on every load
           and in every screenshot. */
        const fam = (i + (inset > 40 ? 1 : 0)) % 3
        const h = ft(15) + ((i * 37) % 9) * ft(1.6)
        const trunkH = h * (fam === 2 ? 0.34 : 0.44)
        const crown = h - trunkH

        const trunk = new THREE.Mesh(trunkGeo, trunkMat)
        trunk.scale.set(ft(1.5), trunkH, ft(1.5))
        trunk.position.set(x, trunkH / 2, y)
        trunk.castShadow = true
        site.add(trunk)

        const canopy = new THREE.Mesh(canopyGeo[fam], leafMat)
        const spread = fam === 1 ? 0.78 : fam === 2 ? 0.42 : 0.62
        canopy.scale.set(crown * spread, crown * (fam === 2 ? 0.62 : 0.55), crown * spread)
        canopy.position.set(x, trunkH + crown * 0.44, y)
        canopy.rotation.set((i % 5) * 0.06, i * 1.7, (i % 3) * 0.05)
        canopy.castShadow = true
        site.add(canopy)
        planted++
      }
    }
  }

  let gateAnchor = null
  /* --- THE GATE. Two piers and a threshold at the entry the route starts from. ---- */
  if (spine) {
    const [gx, gy] = spine[0]
    const [nx2, ny2] = spine[1]
    const dx = nx2 - gx, dy = ny2 - gy
    const l = Math.hypot(dx, dy) || 1
    const px = -dy / l, py = dx / l
    const pierGeo = new THREE.BoxGeometry(1, 1, 1)
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x1c222a, roughness: 0.85 })
    for (const s of [1, -1]) {
      const pier = new THREE.Mesh(pierGeo, pierMat)
      pier.scale.set(ft(4), ft(16), ft(4))
      pier.position.set(gx + px * (ROAD_W / 2 + ft(4)) * s, ft(8), gy + py * (ROAD_W / 2 + ft(4)) * s)
      pier.rotation.y = -Math.atan2(dy, dx)
      pier.castShadow = true
      site.add(pier)
      if (s > 0) gateAnchor = pier
      /* The lamp on the pier. This is the light act 00's photograph is of, and it is the
         first warm thing the eye finds on the model. */
      const lamp = new THREE.Mesh(pierGeo, new THREE.MeshBasicMaterial({ color: 0xffcf94 }))
      lamp.scale.set(ft(3.2), ft(0.5), ft(3.2))
      lamp.position.set(pier.position.x, ft(15.4), pier.position.z)
      lamp.rotation.y = pier.rotation.y
      site.add(lamp)
      const glow = new THREE.PointLight(0xffc98a, 9, ft(70), 2)
      glow.position.set(pier.position.x, ft(14), pier.position.z)
      site.add(glow)
    }
  }

  /* --- THE DRIVE, LIT. ------------------------------------------------------------

     A private road at dusk is not a dark ribbon: it is a lit ribbon, and the lighting
     is the first thing that tells a visitor the place is occupied and looked after. So
     the measured centreline gets a rhythm of warm markers down both kerbs — the pole
     lights — set at a constant spacing along the polyline's real arc length rather than
     one per vertex, because the vertices are wherever the extractor put them and a
     lighting rhythm has to be even to read as designed.

     They are emissive quads, not lights: 40-odd point lights would cost more than the
     rest of the scene put together and would each need a shadow decision. Two real
     PointLights carry the actual illumination, at the gate, where the eye enters. */
  if (spine) {
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffbe7d })
    const lampGeo = new THREE.PlaneGeometry(1, 1)
    const SPACING = ft(78)
    const marks = []
    let carry = 0
    for (let i = 0; i < spine.length - 1; i++) {
      const [ax, ay] = spine[i]
      const [bx, by] = spine[i + 1]
      const seg = Math.hypot(bx - ax, by - ay)
      const ux = (bx - ax) / seg
      const uy = (by - ay) / seg
      for (let d = SPACING - carry; d < seg; d += SPACING) {
        marks.push([ax + ux * d, ay + uy * d, -uy, ux])
      }
      carry = (carry + seg) % SPACING
    }
    const lamps = new THREE.InstancedMesh(lampGeo, lampMat, marks.length * 2)
    const m4 = new THREE.Matrix4()
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
    let n = 0
    for (const [x, y, nx3, ny3] of marks) {
      for (const side of [1, -1]) {
        m4.compose(
          new THREE.Vector3(x + nx3 * (ROAD_W / 2 - ft(1)) * side, ROAD_LIFT + 0.08, y + ny3 * (ROAD_W / 2 - ft(1)) * side),
          q,
          new THREE.Vector3(ft(2.4), ft(5.5), 1),
        )
        lamps.setMatrixAt(n++, m4)
      }
    }
    lamps.instanceMatrix.needsUpdate = true
    site.add(lamps)
  }

  /* --- THE ROUTE. The drive from the gate, kept from the previous pass because it is
     the one piece of light in the model that describes a relationship rather than an
     object. A tube, not a line: a line of one pixel disappears the moment the camera
     is not square on to it. */
  const routeMat = new THREE.MeshBasicMaterial({ color: C.lume, transparent: true, opacity: 0 })
  let routeMesh = null

  const setRoute = (planPts) => {
    if (routeMesh) { site.remove(routeMesh); routeMesh.geometry.dispose(); routeMesh = null }
    if (!planPts || planPts.length < 2) { routeMat.opacity = 0; return null }
    const curve = new THREE.CatmullRomCurve3(
      planPts.map(([x, y, h]) => new THREE.Vector3(x, (h ?? 0) + ROAD_LIFT + 0.5, y)),
      false, 'catmullrom', 0.06,
    )
    const g = new THREE.TubeGeometry(curve, Math.min(160, planPts.length * 14), 0.75, 6, false)
    routeMesh = new THREE.Mesh(g, routeMat)
    site.add(routeMesh)
    return routeMesh
  }

  /* --- THE MASSES ----------------------------------------------------------------
     Every suite is its own box, because every suite has to be its own raycast target
     and its own selectable object. The party walls between them are therefore real
     geometry rather than a drawn line, which is what gives a run its rhythm under a
     raking light — the joints cast their own small shadows.

     A run then gets ONE roof slab over its bays, slightly proud, so the building still
     reads as a single mass from the compound view and only resolves into rooms when
     the camera comes in. That is the whole level structure, built into the geometry. */
  const bayGeo = new THREE.BoxGeometry(1, 1, 1)
  const suiteObjs = []
  const buildingObjs = new Map()

  for (const b of model.buildings) {
    const g = new THREE.Group()
    g.userData = { kind: 'building', num: b.num }
    site.add(g)
    buildingObjs.set(b.num, { num: b.num, group: g, bays: [], roofs: [], model: b, lift: 0 })
  }

  for (const s of model.suites) {
    const B = buildingObjs.get(s.building)
    if (!B) continue
    const m = new THREE.Mesh(bayGeo, s.sold ? M.sold : M.wall)
    /* The measured footprint, extruded. A 0.94 factor on the width leaves the party
       wall a visible joint rather than a coincident face — coplanar neighbours z-fight
       and, worse, read as one continuous block. */
    m.scale.set(s.w * 0.94, H_SUITE, s.dep * 0.96)
    m.position.set(s.cx, H_SUITE / 2, s.cy)
    m.rotation.y = -(s.ang * Math.PI) / 180
    m.castShadow = true
    m.receiveShadow = true
    m.userData = { kind: 'suite', index: s.index, building: s.building }
    B.group.add(m)

    /* THE DOOR. The face that opens onto the drive, on the side the previous pass
       already worked out from the measured roadway — reused, not recomputed. A thin
       inset panel in a metallic material: it is a commercial overhead door, and under a
       raking key light a slightly metallic recess is what makes a wall read as having
       an opening in it. */
    const dw = s.w * 0.66
    const dh = H_SUITE * 0.5
    const [fnx, fny] = s.faceNormal
    const rot = -(s.ang * Math.PI) / 180
    const faceD = s.dep * 0.48

    /* THE REVEAL. A door set flush in a wall is a rectangle of a different colour; a
       door set BACK behind a frame is an opening, because the frame's own edge throws a
       shadow across the head and one jamb. This is the frame — trim material, oversized
       by a hand's width all round, sitting proud of the wall. */
    const frame = new THREE.Mesh(bayGeo, M.trim)
    frame.scale.set(dw + ft(1.1), dh + ft(1.1), ft(0.7))
    frame.position.set(s.cx + fnx * (faceD + ft(0.2)), dh / 2, s.cy + fny * (faceD + ft(0.2)))
    frame.rotation.y = rot
    frame.castShadow = true
    frame.receiveShadow = true
    B.group.add(frame)

    /* The leaf itself, recessed INSIDE that frame. Segmented dark metal: a commercial
       sectional door is four horizontal panels, and at this scale the segmentation is
       what tells the eye how big the opening is — the single most useful scale cue on
       the whole elevation. */
    const door = new THREE.Mesh(bayGeo, M.door)
    door.scale.set(dw, dh, ft(0.5))
    door.position.set(s.cx + fnx * (faceD - ft(0.5)), dh / 2, s.cy + fny * (faceD - ft(0.5)))
    door.rotation.y = rot
    door.receiveShadow = true
    B.group.add(door)

    for (let seg = 1; seg <= 3; seg++) {
      const line = new THREE.Mesh(bayGeo, M.trim)
      line.scale.set(dw, ft(0.28), ft(0.6))
      line.position.set(
        s.cx + fnx * (faceD - ft(0.3)),
        (dh / 4) * seg,
        s.cy + fny * (faceD - ft(0.3)),
      )
      line.rotation.y = rot
      B.group.add(line)
    }

    /* One small wall light over every door. It is the detail that makes a compound at
       dusk read as occupied, and it is emissive rather than a light source — 116 point
       lights would be a different kind of project. */
    const lamp = new THREE.Mesh(bayGeo, M.wallLight)
    lamp.scale.set(ft(1.5), ft(0.34), ft(0.5))
    lamp.position.set(
      s.cx + fnx * (faceD + ft(0.6)),
      dh + ft(3.4),
      s.cy + fny * (faceD + ft(0.6)),
    )
    lamp.rotation.y = rot
    B.group.add(lamp)

    const obj = { suite: s, mesh: m, door, baseY: H_SUITE / 2 }
    B.bays.push(obj)
    suiteObjs[s.index] = obj
  }

  /* ================================================================================
     THE ROOF ASSEMBLY — four parts, and this is what stops a run being a box.

     A single flat slab on top of a wall is the whole reason the last pass read as
     extruded massing: from a three-quarter aerial the roof is most of the pixels, and
     one undifferentiated plane at one value across sixty percent of the model is a
     shape, not a building. A real low-rise commercial roof is a PARAPET with a darker
     membrane recessed inside it, and the step between the two is a shadow line that
     runs the whole length of the building.

     So each run gets:

       FASCIA     a band at the top of the wall, oversailing very slightly. It is the
                  horizontal that gives the elevation a scale reference and it catches
                  the key along its whole length.
       PARAPET    a cap that oversails the fascia. Its own thickness is what makes the
                  roof edge read as an edge rather than as a cut.
       MEMBRANE   the roof surface, INSET inside the parapet and dropped below its top,
                  so the parapet casts a line across the roof. Darker and rougher than
                  everything else — a membrane roof is the least reflective thing on a
                  building.
       KERB       the small upstand where membrane meets parapet, in the trim material.

     Four thin boxes per run, on shared geometry and shared materials. The cost is
     nothing; the difference is the whole read of the model.
     ================================================================================ */
  const OVER_F = ft(0.9)          /* fascia oversail */
  const OVER_P = ft(1.8)          /* parapet oversail — deeper, so it shades the fascia */
  const H_FASCIA = ft(2.6)
  const H_PARAPET = ft(2.2)
  const INSET = ft(3.2)           /* how far the membrane sits inside the parapet */

  const roofAssembly = (cx, cy, len, dep, ang, top, group, num, out) => {
    const rot = -(ang * Math.PI) / 180

    const fascia = new THREE.Mesh(bayGeo, M.trim)
    fascia.scale.set(len + OVER_F * 2, H_FASCIA, dep + OVER_F * 2)
    fascia.position.set(cx, top - H_FASCIA / 2, cy)
    fascia.rotation.y = rot
    fascia.castShadow = true
    fascia.receiveShadow = true
    group.add(fascia)

    /* THE PARAPET IS A RING, NOT A LID.

       Built as a solid box it simply covered the membrane, so every roof rendered as
       one flat cap and the whole two-tone idea was invisible — the roofs stayed the
       single grey plane this pass set out to kill. Four bars round the edge leave the
       field open, the membrane shows through it, and the parapet now casts a shadow
       ACROSS that field which is the line that makes a low-rise roof read. */
    const PL = len + OVER_P * 2
    const PD = dep + OVER_P * 2
    const T = ft(1.6)                        /* parapet wall thickness */
    const cs = Math.cos(rot), sn = Math.sin(rot)
    const place = (m, ox, oz) => {
      m.position.set(cx + ox * cs + oz * sn, top + H_PARAPET / 2, cy - ox * sn + oz * cs)
      m.rotation.y = rot
      m.castShadow = true
      m.receiveShadow = true
      m.userData = { kind: 'building', num }
      group.add(m)
    }
    const long1 = new THREE.Mesh(bayGeo, M.roof); long1.scale.set(PL, H_PARAPET, T)
    const long2 = new THREE.Mesh(bayGeo, M.roof); long2.scale.set(PL, H_PARAPET, T)
    const end1 = new THREE.Mesh(bayGeo, M.roof); end1.scale.set(T, H_PARAPET, PD - T * 2)
    const end2 = new THREE.Mesh(bayGeo, M.roof); end2.scale.set(T, H_PARAPET, PD - T * 2)
    place(long1, 0, (PD - T) / 2)
    place(long2, 0, -(PD - T) / 2)
    place(end1, (PL - T) / 2, 0)
    place(end2, -(PL - T) / 2, 0)

    /* The roof field, sitting on the wall head inside that ring. The roughest, darkest
       surface in the model — a membrane roof reflects almost nothing. */
    const membrane = new THREE.Mesh(bayGeo, M.membrane)
    membrane.scale.set(PL - T * 2, ft(0.4), PD - T * 2)
    membrane.position.set(cx, top + ft(0.2), cy)
    membrane.rotation.y = rot
    membrane.receiveShadow = true
    membrane.userData = { kind: 'building', num }
    group.add(membrane)

    out?.push(long1, long2, end1, end2, membrane)
    return long1
  }

  for (const row of data.rows) {
    const B = buildingObjs.get(row.building)
    if (!B) continue
    roofAssembly(row.cx, row.cy, row.length, row.depth, row.ang, H_SUITE, B.group, row.building, B.roofs)
  }

  /* --- CIVIC MASSES. The clubhouse and the dealership: taller, smoother, no bays.
     The material does the distinguishing — a civic building in this compound is the one
     that is not a row of doors. */
  const civicAnchors = {}
  const civicGroup = new THREE.Group()
  site.add(civicGroup)
  for (const c of data.civic) {
    const m = new THREE.Mesh(bayGeo, M.civic)
    m.scale.set(c.length, H_CIVIC, c.depth)
    m.position.set(c.cx, H_CIVIC / 2, c.cy)
    m.rotation.y = -(c.ang * Math.PI) / 180
    m.castShadow = true
    m.receiveShadow = true
    m.userData = { kind: 'civic', of: c.kind }
    civicGroup.add(m)
    if (c.kind === 'club' && !civicAnchors.club) civicAnchors.club = m
    if (c.kind === 'dealership') civicAnchors.dealership = m

    /* THE GLAZED BAND. What distinguishes a civic building here is not a label, it is
       that you can see into it — a continuous dark glass band at head height, set very
       slightly proud so its own reveal reads. The clubhouse is where the compound is
       social, and glass is the only material on the model that says so. */
    const bandH = H_CIVIC * 0.34
    for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = -(c.ang * Math.PI) / 180
      const cs = Math.cos(rr), sn = Math.sin(rr)
      const halfL = c.length / 2, halfD = c.depth / 2
      const ox = ax * (halfL + ft(0.3))
      const oz = az * (halfD + ft(0.3))
      const g2 = new THREE.Mesh(bayGeo, M.glass)
      g2.scale.set(ax ? ft(0.6) : c.length * 0.9, bandH, az ? ft(0.6) : c.depth * 0.9)
      g2.position.set(c.cx + ox * cs - oz * sn, H_CIVIC * 0.6, c.cy + ox * sn + oz * cs)
      g2.rotation.y = rr
      civicGroup.add(g2)
    }

    roofAssembly(c.cx, c.cy, c.length, c.depth, c.ang, H_CIVIC, civicGroup, null, null)
  }

  /* --- CAMERA. A masterplan model seen from the near corner, slightly above. ------
     Spherical about the site centre so orbiting is one number, and pitch is clamped:
     you may walk around this model, you may not fly under the table it is on, and you
     may not look at it flat from above — a plan view is what the SVG already is. */
  /* dist is solved, not guessed: the site is ~1100 source units, so ~22 world units at
     S. A 30-degree vertical fov on a 2:1 stage gives ~60 horizontal, and half the model
     over tan(30) puts the whole compound in frame at ~19. 23 leaves it composed with air
     rather than tangent to the edges. */
  /* THE MODEL TURNS, so the frame has to hold its BOUNDING CIRCLE rather than its
     bounding box: the compound is 1100 x 565 source units, a radius of ~12.4 world
     units about the centre it spins on, and a distance solved for the box alone put a
     corner of the site through the left edge of the frame a quarter of a turn later.
     27.5 holds the whole compound at every angle it will ever be at. */
  const cam = { az: -0.58, el: 0.42, dist: 20.4, target: new THREE.Vector3(0, -2.1, 0) }
  const camTo = { ...cam, target: cam.target.clone() }

  /* Every distance in this file is composed against the desktop stage's 3:2. A phone's
     stage is square, which at the same vertical fov is a NARROWER horizontal field — so
     the identical distance crops the compound at both edges. The correction is one
     factor applied to every camera position rather than a second set of numbers to keep
     in step: pull back in proportion to how much narrower the frame is. */
  const fit = () => Math.min(1.32, Math.max(1, 1.30 / Math.max(0.5, camera.aspect)))

  const applyCamera = () => {
    const { az, el, target } = cam
    const dist = cam.dist * fit()
    /* The label band is desktop-only, so on one column the model does not need to sit
       low to leave room above it — it takes the whole frame instead. */
    const lift = narrow() ? 0.25 : 1
    const ty = target.y * lift
    camera.position.set(
      target.x + dist * Math.cos(el) * Math.sin(az),
      ty + dist * Math.sin(el),
      target.z + dist * Math.cos(el) * Math.cos(az),
    )
    camera.lookAt(target.x, ty, target.z)
    key.target.position.copy(target)
    key.target.updateMatrixWorld()

    /* The fill rides with the camera, lifted and thrown a little off-axis so it models
       rather than flattens. */
    camFill.position.copy(camera.position)
    camFill.position.y += dist * 0.22
    camFill.target.position.set(target.x, ty, target.z)
    camFill.target.updateMatrixWorld()
  }

  /* ================================================================================
     CALLOUTS — the exhibit label, not the tooltip.

     A presentation model in a gallery is annotated: a fine leader from a real point on
     the object out to clear space, and a small block of type at the end of it. That is
     the whole idea here, and every part of it is chosen against the thing it must not
     become.

       ANCHORED IN THE MODEL   the origin is a world position on real geometry, so the
                               leader stays attached as the model breathes and orbits.
       NEVER OVER THE SUBJECT  labels sit outward from the compound's own centre, so the
                               annotation moves away from the object rather than across
                               it as the camera turns.
       OCCLUSION-AWARE         an anchor with a building in front of it dims rather than
                               floats, which is the difference between a label ON the
                               model and a label over a screenshot of it.
       BOUNDED                 at most four are ever on screen. A label cloud is a
                               diagram of labels, not an annotated object.

     DOM, not sprites: this is type, it has to be the page's own type, and 14px mono set
     in a texture at this scale would be unreadable (`I7`). ================================================================================ */
  const calLayer = document.createElement('div')
  calLayer.className = 'cal'
  calLayer.setAttribute('aria-hidden', 'true')   /* the record already says all of this */
  mount.appendChild(calLayer)
  const calSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  calSvg.setAttribute('class', 'cal__lines')
  calLayer.appendChild(calSvg)

  const callouts = []
  const makeCallout = () => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
    line.setAttribute('class', 'cal__leader')
    calSvg.appendChild(line)
    const dot = document.createElement('i')
    dot.className = 'cal__dot'
    calLayer.appendChild(dot)
    const box = document.createElement('div')
    box.className = 'cal__box'
    box.innerHTML = '<b class="cal__k"></b><span class="cal__v"></span>'
    calLayer.appendChild(box)
    const c = { line, dot, box, k: box.querySelector('.cal__k'), v: box.querySelector('.cal__v'), anchor: new THREE.Vector3(), on: false }
    callouts.push(c)
    return c
  }
  for (let i = 0; i < 4; i++) makeCallout()

  let calSpec = []          /* [{ obj3d | point, k, v }] — set by the level, read each frame */
  const calRay = new THREE.Raycaster()
  let calTick = 0

  const setCallouts = (spec) => {
    calSpec = spec.slice(0, callouts.length)
    for (let i = 0; i < callouts.length; i++) {
      const on = i < calSpec.length
      callouts[i].on = on
      callouts[i].box.style.display = on ? '' : 'none'
      callouts[i].dot.style.display = on ? '' : 'none'
      callouts[i].line.style.display = on ? '' : 'none'
      if (on) {
        callouts[i].k.textContent = calSpec[i].k
        callouts[i].v.textContent = calSpec[i].v
      }
    }
  }

  const tmpV = new THREE.Vector3()
  const updateCallouts = () => {
    const r = mount.getBoundingClientRect()
    if (!r.width) return
    calSvg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`)
    calTick++
    for (let i = 0; i < calSpec.length; i++) {
      const c = callouts[i]
      const s = calSpec[i]
      if (s.obj3d) s.obj3d.getWorldPosition(tmpV)
      else tmpV.copy(s.point)
      const world = tmpV.clone()
      tmpV.project(camera)
      const behind = tmpV.z > 1
      const x = (tmpV.x * 0.5 + 0.5) * r.width
      const y = (-tmpV.y * 0.5 + 0.5) * r.height

      /* The label goes OUTWARD from the frame's centre, so it never lies across the
         compound however the model is turned — and then it is CLAMPED by its own
         measured width, which is the part a first pass left out: a right-aligned block
         pushed off the left edge simply loses its first characters, and a callout that
         reads "21 SUITES" is worse than no callout at all. If the outward side has no
         room, the label flips to the inward side rather than being cropped. */
      /* THE LEADER RISES, then jogs. A callout that reaches sideways crosses the model
         at half the angles the model turns through; a callout that rises leaves it,
         because the compound is a horizontal object and the air is above it. This is
         the section-drawing convention and it is the reason the annotations stay
         readable while the site breathes.

         Each callout has its own band height, so three labels rising from three points
         cannot land on one line and overprint each other. */
      const w = c.box.offsetWidth || 90
      const PAD = 12
      const bh = c.box.offsetHeight || 62
      const BAND = bh + 14 + [0, 52, 104, 156][i]
      const ly = Math.max(bh + 14, Math.min(y - 40, BAND))
      let dirX = x < r.width * 0.5 ? 1 : -1
      const JOG = 26
      if (dirX > 0 && x + JOG + w > r.width - PAD) dirX = -1
      else if (dirX < 0 && x - JOG - w < PAD) dirX = 1
      let lx = x + dirX * JOG
      lx = dirX < 0 ? Math.max(PAD + w, lx) : Math.min(r.width - PAD - w, lx)

      /* An anchor that has left the frame takes its label with it. */
      const outside = x < -40 || x > r.width + 40 || y < -40 || y > r.height + 40
      c.box.style.visibility = outside ? 'hidden' : ''
      c.dot.style.visibility = outside ? 'hidden' : ''
      c.line.style.visibility = outside ? 'hidden' : ''

      c.dot.style.transform = `translate(${x}px, ${y}px)`
      c.line.setAttribute('points', `${x},${y} ${x},${ly} ${lx},${ly}`)
      c.box.style.transform = `translate(${lx}px, ${ly}px)`
      c.box.dataset.side = dirX < 0 ? 'left' : 'right'

      /* Occlusion, every fourth frame: a raycast from the camera to the anchor that
         stops short means something is in front of it. */
      if (calTick % 4 === 0) {
        calRay.set(camera.position, world.clone().sub(camera.position).normalize())
        const hit = calRay.intersectObject(site, true).find((h) => h.object.visible && h.object.type === 'Mesh')
        const dist = camera.position.distanceTo(world)
        s.occluded = !!(hit && hit.distance < dist - 0.35)
      }
      const dim = behind || s.occluded
      c.box.style.opacity = dim ? '0.22' : '1'
      c.line.style.opacity = dim ? '0.18' : '1'
      c.dot.style.opacity = dim ? '0.22' : '1'
    }
  }

  /* --- SIZE ---------------------------------------------------------------------- */
  const resize = () => {
    const r = mount.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return
    renderer.setSize(r.width, r.height, false)
    camera.aspect = r.width / r.height
    camera.updateProjectionMatrix()
  }
  resize()

  /* --- AMBIENT MOTION ------------------------------------------------------------
     The model turns, very slowly, and it is the site that turns rather than the camera
     that flies: a presentation model on a turntable is the reference, and turning the
     camera instead would swing the key light across the compound and make the whole
     image pulse. At this rate a full revolution takes about eleven minutes, which is
     under the threshold at which the eye reads it as an animation — it reads as the
     object being present.

     It stops the moment the visitor touches the model and resumes, gently, after they
     stop. It also stops whenever a building or suite is being inspected: a subject
     under examination does not drift. */
  /* AMBIENT MOTION IS AN OSCILLATION, not a turntable.

     A continuous revolution eventually presents the compound end-on, and the compound
     is a long L: a quarter turn foreshortens it to a third of the width it was composed
     at, and the resting frame — the one this act is judged on before anyone touches it
     — becomes whichever angle the visitor happens to arrive at. That is not a composed
     frame, it is a lottery.

     So the model breathes around the angle it WAS composed at: +/- 0.085 radians, one
     cycle every 46 seconds. Under the threshold at which the eye reads it as an
     animation — it reads as the object being present — and the composition is never
     more than five degrees from the authored one. Free orbit is still the visitor's:
     dragging sets `site.rotation.y` aside and the camera's own azimuth takes over. */
  const AMB_AMP = 0.085
  const AMB_PERIOD = 46
  let ambient = 1                           /* 0..1, eased by hand on interaction */
  let idleSince = performance.now()
  let ambientPhase = 0
  let dragging = false

  /* --- RAYCAST -------------------------------------------------------------------
     Hover is resolved once per frame against the objects that are legal targets AT THE
     CURRENT LEVEL, not against everything in the scene. At compound level the whole
     model answers as buildings; inside a building, its own bays answer as suites. That
     is the same rule the SVG version enforces with pointer-events, expressed the way a
     3D scene has to express it. */
  const ray = new THREE.Raycaster()
  const ptr = new THREE.Vector2()
  let ptrInside = false
  let level = 'compound'
  let focusNum = null
  let hoverNum = null
  let hoverSuite = null
  let selectedSuite = null

  const suiteIndexOf = (suite) => (suite ? suite.index : -1)

  const targetsForLevel = () => {
    if (level === 'compound') {
      const out = []
      for (const B of buildingObjs.values()) out.push(...B.bays.map((b) => b.mesh), ...B.roofs)
      return out
    }
    const B = buildingObjs.get(focusNum)
    return B ? B.bays.map((b) => b.mesh) : []
  }

  const pick = () => {
    if (!ptrInside) return null
    ray.setFromCamera(ptr, camera)
    const hits = ray.intersectObjects(targetsForLevel(), false)
    return hits.length ? hits[0].object : null
  }

  /* --- STATE ON THE MODEL --------------------------------------------------------
     Light and ELEVATION, and the elevation is the point. A building that is being
     considered lifts off the slab; the one selected lifts further and its neighbours
     settle back. In a physical model this is exactly the gesture — the piece comes up
     off the board — and it is a spatial answer to a spatial question, which is what
     this act has been missing.

     Every animated property has one owner: `lift` is GSAP's, emissive is GSAP's,
     material colour is set outright. Nothing is tweened from two places. */
  const gsapRef = { lib: opts.gsap || null }

  const setY = (obj, y) => { obj.position.y = y }

  const tweenGroupLift = (B, to, dur = 0.5) => {
    const g = gsapRef.lib
    if (!g) { B.group.position.y = to; B.lift = to; return }
    g.to(B, {
      lift: to, duration: dur, ease: 'door', overwrite: true,
      onUpdate: () => { B.group.position.y = B.lift },
    })
  }

  const tweenSuiteLift = (o, to, dur = 0.45) => {
    const g = gsapRef.lib
    const state = { y: o.mesh.position.y }
    if (!g) { setY(o.mesh, o.baseY + to); setY(o.door, o.baseY * 0.54 + to); return }
    g.killTweensOf(state)
    g.to(state, {
      y: o.baseY + to, duration: dur, ease: 'door', overwrite: true,
      onUpdate: () => {
        const d = state.y - o.baseY
        setY(o.mesh, o.baseY + d)
        setY(o.door, H_SUITE * 0.27 + d)
      },
    })
  }

  /* Materials are shared, so a per-object state cannot be a material property. These
     three are the only per-instance overrides in the model, and each one gets its own
     material instance created lazily — three of them, not 116. */
  /* THE HIGHLIGHT LANGUAGE, and every step of it is LIGHT rather than colour.

     A building that is being shown does four things at once, which is what separates
     "the model is showing me this" from "a hover changed a fill":

       it LIFTS off the slab                    (the lift tweens, below)
       its walls take the sun                   M_focus / M_hover — a value step
       its roof stops absorbing and starts      M_roofFocus carries a faint emissive, so
         reading as a lit plane                 the roof glows rather than just lightening
       everything else falls away               M_sub / M_roofSub, a full step down

     The emissive is deliberately tiny. A roof that GLOWS is a game object; a roof that
     is one step off black in the dark is a roof with light on it. --lume-cold is the
     compound's own verified LED and the only light source name this system has. */
  const lume = new THREE.Color(C.lume)

  const M_focus = M.wall.clone()
  M_focus.color.setHex(0x59636f)
  M_focus.emissive = lume.clone(); M_focus.emissiveIntensity = 0.045

  const M_hover = M.wall.clone()
  M_hover.color.setHex(0x6d7885)
  M_hover.emissive = lume.clone(); M_hover.emissiveIntensity = 0.09

  /* THE ONE SUITE. Not a lighter grey — a surface with the compound's light on it, at
     four times the roof's intensity, which at this exposure is the brightest thing in
     the frame without ever clipping to white. */
  const M_lit = M.wall.clone()
  M_lit.color.setHex(C.lit)
  M_lit.emissive = lume.clone()
  M_lit.emissiveIntensity = 0.42
  M_lit.roughness = 0.55

  const M_sub = M.wall.clone(); M_sub.color.setHex(0x272d35)
  const M_roofFocus = M.roof.clone()
  M_roofFocus.color.setHex(0x424b57)
  M_roofFocus.emissive = lume.clone(); M_roofFocus.emissiveIntensity = 0.05
  const M_roofSub = M.roof.clone(); M_roofSub.color.setHex(0x1d2228)

  /* THE DOOR, LIT FROM INSIDE. The one detail that says a suite is OCCUPIED rather than
     available: warm light behind the opening of the selected suite. It is the only warm
     interior light in the model and it appears exactly once. */
  const M_doorLit = new THREE.MeshBasicMaterial({ color: 0xffc98a })

  const paint3d = () => {
    for (const B of buildingObjs.values()) {
      const isFocus = B.num === focusNum
      const isHover = B.num === hoverNum && !focusNum
      const subordinate = (focusNum && !isFocus)

      for (const r of B.roofs) r.material = isFocus || isHover ? M_roofFocus : (subordinate ? M_roofSub : M.roof)

      for (const o of B.bays) {
        if (o.suite.sold) { o.mesh.material = M.sold; continue }
        if (selectedSuite && o.suite === selectedSuite) {
          o.mesh.material = M_lit
          o.door.material = M_doorLit
          continue
        }
        o.door.material = M.door
        if (isFocus) {
          o.mesh.material = (hoverSuite && o.suite === hoverSuite) ? M_hover : M_focus
          continue
        }
        if (isHover) { o.mesh.material = M_focus; continue }
        o.mesh.material = subordinate ? M_sub : M.wall
      }

      /* THE LIFT. Considering a building raises it a little off the slab; inspecting
         one raises it further. Nothing else in the model moves vertically, so the
         gesture is unambiguous. */
      /* The building's lift is a NUDGE, not a levitation. Nine feet read as a block
         being pulled off a board; two and a half reads as the piece being eased
         forward for inspection, which is the gesture that was wanted. The separation
         is carried by light and by the neighbours falling away, not by altitude. */
      const want = isFocus ? ft(2.6) : (isHover ? ft(1.1) : 0)
      if (Math.abs(B.lift - want) > 0.001) tweenGroupLift(B, want)
    }

    /* One suite, separated from its neighbours. */
    for (const o of suiteObjs) {
      if (!o) continue
      /* SEVEN FEET WAS A WHITE LEGO BRICK sitting on the roofline. A suite is part of
         a building and must stay part of it: it steps forward by a foot and a half —
         enough for its own party walls to throw a shadow and for the eye to find it
         instantly — and everything else that distinguishes it is illumination. */
      const want = (selectedSuite && o.suite === selectedSuite) ? ft(1.6) : 0
      const cur = o.mesh.position.y - o.baseY
      if (Math.abs(cur - want) > 0.001) tweenSuiteLift(o, want)
    }

    /* The civic masses are context once a building is the subject. */
    const civicDim = focusNum ? 0.42 : 1
    M.civic.color.setHex(focusNum ? 0x232830 : C.civic)
    void civicDim
  }

  /* --- CAMERA MOVES. GSAP owns az / el / dist / target and nothing else does. ----- */
  const flyTo = (to, dur = 1.0) => {
    const g = gsapRef.lib
    if (!g) { Object.assign(cam, { az: to.az ?? cam.az, el: to.el ?? cam.el, dist: to.dist ?? cam.dist }); if (to.target) cam.target.copy(to.target); return }
    g.killTweensOf(cam); g.killTweensOf(cam.target)
    g.to(cam, { az: to.az ?? cam.az, el: to.el ?? cam.el, dist: to.dist ?? cam.dist, duration: dur, ease: 'door', overwrite: true })
    if (to.target) g.to(cam.target, { x: to.target.x, y: to.target.y, z: to.target.z, duration: dur, ease: 'door', overwrite: true })
  }

  /* The world position of a building or a suite, so the camera can take it as its
     target rather than aiming at the middle of the site and hoping. */
  const worldOf = (obj3d) => {
    const p = new THREE.Vector3()
    obj3d.getWorldPosition(p)
    return p
  }

  /* --- PUBLIC API. main.js owns the STATE; this file owns the picture. ------------ */
  const api = {
    renderer, scene, camera, root, site,
    useGsap(lib) { gsapRef.lib = lib },

    resize,

    /* WHAT THE MODEL SAYS ABOUT ITSELF, per level. Three at rest, naming the three
       things a first-time visitor needs from a site plan — the way in, the shared
       building, and the scale of the thing. Then the subject, and only the subject. */
    syncCallouts() {
      /* THREE at rest, ONE when a building is being considered, ONE when a suite is
         chosen. The last pass allowed four and they read as a label cloud; an exhibit
         board annotates the two or three things that orient you and leaves the rest to
         the record. Hovering REPLACES the compound set rather than adding to it — the
         model answers the pointer with one statement, not with a fifth line. */
      if (level === 'compound') {
        const B = hoverNum ? buildingObjs.get(hoverNum) : null
        if (B?.roofs[0]) {
          setCallouts([{ obj3d: B.roofs[0], k: `BUILDING ${B.num}`, v: `${B.model.open} of ${B.bays.length} available` }])
          return
        }
        const spec = []
        const biggest = [...buildingObjs.values()].sort((a, b) => b.bays.length - a.bays.length)[0]
        if (biggest?.roofs[0]) spec.push({ obj3d: biggest.roofs[0], k: String(data.totals.bays), v: 'Private suites' })
        if (civicAnchors.club) spec.push({ obj3d: civicAnchors.club, k: 'Clubhouse', v: "Members' building" })
        if (gateAnchor) spec.push({ obj3d: gateAnchor, k: 'Entry', v: 'Private access' })
        setCallouts(spec)
        return
      }
      if (level === 'building') {
        const B = buildingObjs.get(focusNum)
        if (!B?.roofs[0]) return setCallouts([])
        setCallouts([
          { obj3d: B.roofs[0], k: `Building ${B.num}`, v: `${B.bays.length} suites · ${B.model.open} available` },
        ])
        return
      }
      const o = suiteObjs[suiteIndexOf(selectedSuite)]
      if (!o) return setCallouts([])
      const spec = TYPE_LABEL[o.suite.type]
      setCallouts([
        { obj3d: o.mesh, k: `Suite ${o.suite.ref}`, v: `${spec.label} · ${spec.foot}` },
      ])
    },

    setLevel(next, num, suiteIndex) {
      level = next
      focusNum = next === 'compound' ? null : num
      selectedSuite = next === 'suite' && suiteIndex != null ? suiteObjs[suiteIndex]?.suite || null : null
      if (next !== 'suite') selectedSuite = null
      hoverSuite = null
      hoverNum = null

      if (next === 'compound') {
        flyTo({ az: cam.az, el: 0.42, dist: 20.4, target: new THREE.Vector3(0, -2.1, 0) }, 1.1)
      } else if (next === 'building') {
        const B = buildingObjs.get(num)
        if (B?.roofs[0]) {
          const p = worldOf(B.roofs[0])
          flyTo({ el: 0.32, dist: 12.4, target: p }, 1.1)
        }
      } else if (next === 'suite') {
        const o = suiteObjs[suiteIndex]
        if (o) flyTo({ el: 0.30, dist: 8.2, target: worldOf(o.mesh) }, 1.0)
      }
      paint3d()
      this.syncCallouts()
    },

    setHoverBuilding(num) {
      if (hoverNum === num) return
      hoverNum = num
      paint3d()
      this.syncCallouts()
    },
    setHoverSuite(s) {
      if (hoverSuite === s) return
      hoverSuite = s
      paint3d()
    },
    setRoute(planPts) {
      setRoute(planPts)
      const g = gsapRef.lib
      if (!routeMesh) return
      if (!g) { routeMat.opacity = 0.55; return }
      routeMat.opacity = 0
      g.to(routeMat, { opacity: 0.55, duration: 0.5, ease: 'power2.out', overwrite: true })
    },
    clearRoute() {
      const g = gsapRef.lib
      if (g) g.to(routeMat, { opacity: 0, duration: 0.3, overwrite: true })
      else routeMat.opacity = 0
    },

    /* Callbacks main.js supplies. */
    onHoverBuilding: null,
    onHoverSuite: null,
    onPickBuilding: null,
    onPickSuite: null,

    dispose() {
      running = false
      ro?.disconnect()
      renderer.dispose()
      pmrem.dispose()
      bayGeo.dispose()
      slabGeo.dispose()
      renderer.domElement.remove()
    },
  }

  /* --- POINTER -------------------------------------------------------------------
     Drag orbits. Wheel is NOT captured — the page scrolls, always, and a 3D object
     that eats the scroll wheel is the single most hostile thing a site can do
     (`SC1`: the reader keeps the transport). Touch is the same rule, expressed by
     `touch-action: pan-y`: a vertical swipe scrolls the page, a horizontal one turns
     the model, and the browser arbitrates rather than a heuristic in this file. */
  const el = renderer.domElement
  let lastX = 0, lastY = 0, moved = 0

  const toNDC = (e) => {
    const r = el.getBoundingClientRect()
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1
    ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1
    ptrInside = true
  }

  el.addEventListener('pointerdown', (e) => {
    dragging = true; moved = 0
    lastX = e.clientX; lastY = e.clientY
    el.setPointerCapture?.(e.pointerId)
    ambient = 0
  })

  el.addEventListener('pointermove', (e) => {
    toNDC(e)
    if (!dragging) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX; lastY = e.clientY
    moved += Math.abs(dx) + Math.abs(dy)
    cam.az -= dx * 0.005
    /* Pitch is clamped between a low three-quarter and a steep-but-not-plan view. */
    cam.el = Math.max(0.10, Math.min(0.85, cam.el + dy * 0.004))
    idleSince = performance.now()
  })

  const endDrag = (e) => {
    if (!dragging) return
    dragging = false
    el.releasePointerCapture?.(e.pointerId)
    idleSince = performance.now()
    /* A drag is not a click. Anything past a few pixels was the visitor turning the
       model, and turning the model must never select something. */
    if (moved < 6) doPick()
  }
  el.addEventListener('pointerup', endDrag)
  el.addEventListener('pointercancel', endDrag)
  el.addEventListener('pointerleave', () => { ptrInside = false; hoverNum = null; hoverSuite = null })

  function doPick() {
    const hit = pick()
    if (!hit) return
    if (hit.userData.kind === 'suite' && level !== 'compound' && hit.userData.building === focusNum) {
      api.onPickSuite?.(hit.userData.index)
    } else {
      api.onPickBuilding?.(hit.userData.building || hit.userData.num)
    }
  }

  /* --- FRAME ---------------------------------------------------------------------- */
  let running = true
  let last = performance.now()
  let visible = true

  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting }, { rootMargin: '120px' })
  io.observe(mount)

  const ro = new ResizeObserver(resize)
  ro.observe(mount)

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function frame(now) {
    if (!running) return
    requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now

    /* Nothing renders while the act is off screen. A 3D scene ticking behind six other
       acts is a battery bug with a nice view. */
    if (!visible) return

    /* Hover, once per frame rather than once per pointer event. */
    if (!dragging && ptrInside) {
      const hit = pick()
      if (level === 'compound') {
        const n = hit ? (hit.userData.building || hit.userData.num) : null
        if (n !== hoverNum) { hoverNum = n; paint3d(); api.onHoverBuilding?.(n) }
      } else {
        const i = hit && hit.userData.kind === 'suite' ? hit.userData.index : null
        api.onHoverSuite?.(i)
      }
    }

    /* Ambient turn — and it is the site that turns. Suspended while a subject is being
       inspected, and for a beat after the visitor lets go. */
    if (!reduced && !dragging && !focusNum) {
      const idle = (now - idleSince) / 1000
      ambient += ((idle > 1.6 ? 1 : 0) - ambient) * Math.min(1, dt * 1.6)
      ambientPhase += dt
      site.rotation.y = Math.sin((ambientPhase / AMB_PERIOD) * Math.PI * 2) * AMB_AMP * ambient
    }

    applyCamera()
    renderer.render(scene, camera)
    updateCallouts()
  }
  requestAnimationFrame(frame)

  paint3d()
  applyCamera()

  return api
}
