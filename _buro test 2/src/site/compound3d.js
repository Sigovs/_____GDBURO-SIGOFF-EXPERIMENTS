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
/* The civil plan's own geometry — visual, not surveyed, and the module says so. */
import * as SV from '../data/site-visual.js'

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
  concrete: 0x454e58,   /* aprons, forecourts, the gate threshold — lifted, so the
                           forecourt reads as a different surface from the drive */
  road: 0x14181d,       /* asphalt: now clearly the darkest paved thing on the site */
  /* BUILT — the cladding is the lightest thing in the compound, which is what makes the
     architecture the figure. The last pass had wall and roof within one step of each
     other and the buildings merged into their own roofs. */
  wall: 0x6a7683,
  roof: 0x39424d,       /* parapet cap */
  membrane: 0x23292f,   /* the roof field, recessed inside the parapet */
  trim: 0x2c333b,       /* fascia, frames, kerbs, door segments — lifted off black:
                           at 0x161b21 every frame and segment read as a void */
  civic: 0x7b8794,      /* the clubhouse reads lighter — it is the shared building */
  glass: 0x223243,      /* lifted off black: at 0x0b1119 it returned nothing and read as a hole */
  grass: 0x10150f,      /* planted ground — dark olive, well below the architecture */
  water: 0x16202e,      /* the basin: near-black, and it borrows the sky */
  door: 0x323b46,       /* THE LEAF. At 0x1b222b with metalness 0.62 this was a black
                           mirror with a night sky in it — the darkest thing in the model
                           and the reason every bay read as a hole. A sectional door is
                           PAINTED steel: mid-charcoal, mostly diffuse, a little sheen. */
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
  /* EXPOSURE IS A DESIGN VALUE, and 1.22 was under-exposing the product. Measured on
     the composited frame, the garage doors — the entire proposition — sat within a few
     values of the wall around them and the compound read as one dark mass with roofs on
     it. Opened up until the door rhythm reads at the rest camera without the sky
     clipping or the shadows losing their foot. The hour is unchanged; the print is. */
  renderer.toneMappingExposure = 1.46
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.domElement.className = 'compound__gl'

  /* --- THE SKY THE MODEL STANDS AGAINST -------------------------------------------
     The environment dome lights the model, but nothing was ever drawn BEHIND it: the
     canvas is alpha and the page under it is #060708, so every surface facing away from
     the key resolved to the same black as the page and its silhouette disappeared.

     That is not an abstract loss. It is what produced the "black slab" the review kept
     finding beside the clubhouse: the clubhouse roof edge catches the horizon while the
     wall beneath it is turned away from every light in the rig, so the wall vanishes
     into the page and the lit roof edge is left floating in nothing. Raycasting the
     rectangle names the civic mass and its roof, in that order, at every pixel — the
     geometry was always there and always correct. There was simply nothing for it to be
     seen against.

     So the compound now sits in front of the same blue hour that lights it: indigo
     overhead, the cold horizon band behind the far end of the site, the ground haze the
     fog already resolves to (#141920) at the base. Silhouettes read, the dead quadrants
     of the frame carry tone instead of nothing, and the model is outdoors.

     Drawn in the DOM under a transparent canvas rather than as scene.background: the
     camera looks DOWN at the compound, so a mapped dome would put its dark under-bounce
     across the whole frame and its horizon nowhere near the horizon. */
  const sky = document.createElement('div')
  sky.className = 'compound__sky'
  sky.setAttribute('aria-hidden', 'true')
  sky.style.cssText = 'position:absolute;inset:0;pointer-events:none;'
    + 'background:'
    + 'radial-gradient(120% 78% at 50% 96%, rgba(20,25,32,.85) 0%, rgba(20,25,32,0) 62%),'
    + 'radial-gradient(78% 52% at 62% 30%, rgba(56,84,106,.30) 0%, rgba(56,84,106,0) 70%),'
    + 'linear-gradient(to bottom, #0a1220 0%, #10202e 26%, #1a3245 40%, #14202b 56%, #0a0e13 78%, #07090c 100%)'
  mount.appendChild(sky)
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
  const key = new THREE.DirectionalLight(0xffd9a8, 6.0)
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
  scene.add(new THREE.HemisphereLight(0x6f90b4, 0x05070a, 1.62))

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
  /* CLIPPED TO THE SITE.  At 4200 x 4200 this plane reached 31 units past the plinth on
     every side — nearly four times the compound — and it is invisible except where a
     shadow lands on it.  Every shadow that fell beyond the plinth edge therefore drew a
     dark slab hanging in empty space, which is the "large grey trapezoid" the audit
     found.  The contact shadow is the whole point of the plane, and a contact shadow
     only exists where there is ground: the receiver is now the site's own footprint. */
  const table = new THREE.Mesh(
    new THREE.ShapeGeometry(new THREE.Shape(data.perimeter.map(([x, y]) => v2(x, y)))),
    new THREE.ShadowMaterial({ opacity: 0.62, color: 0x000000 }),
  )
  table.rotation.x = Math.PI / 2
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
    trim: new THREE.MeshStandardMaterial({ color: C.trim, roughness: 0.52, metalness: 0.34 }),
    civic: new THREE.MeshStandardMaterial({ color: C.civic, roughness: 0.4, metalness: 0.3 }),
    glass: new THREE.MeshStandardMaterial({ color: C.glass, roughness: 0.06, metalness: 0.5, envMapIntensity: 2.2 }),
    door: new THREE.MeshStandardMaterial({ color: C.door, roughness: 0.54, metalness: 0.26 }),
    sold: new THREE.MeshStandardMaterial({ color: C.sold, roughness: 0.85, metalness: 0.1 }),
    /* GRASS — the site's second ground. Utterly matte and a touch green, so it separates
       from concrete by material as well as by value. */
    grass: new THREE.MeshStandardMaterial({ color: C.grass, roughness: 1, metalness: 0 }),
    /* WATER — smooth and slightly metallic so it returns the sky and almost nothing
       else. At blue hour that makes the basin the brightest horizontal on the site. */
    /* Near-mirror. A basin at dusk is not a dark shape, it is a hole with the sky in it,
       and only a very low roughness returns enough of the horizon band to say so. */
    water: new THREE.MeshStandardMaterial({ color: C.water, roughness: 0.045, metalness: 0.9, envMapIntensity: 2.4 }),
    wallLight: new THREE.MeshBasicMaterial({ color: 0xffc07a }),
    /* THE LAND. Darker than the plinth top so the site reads as a pad cut into it, and
       fully matte so it never competes with a horizontal the compound owns. Its far
       edge is past the fog, so it becomes haze rather than ending. */
    terrain: new THREE.MeshStandardMaterial({ color: 0x11161b, roughness: 1, metalness: 0 }),
  }

  /* FEET TO WORLD UNITS. The measured geometry is built at source scale inside `site`
     and the SCALE IS ON ITS PARENT — site.scale is 1, root.scale is S. Three separate
     offsets in this file multiplied by `site.scale.y || 1`, got 1, and were therefore
     fifty times too large: the ENTER camera aimed a hundred and fifty feet above the
     door it was meant to be standing at, and the apron pool light sat four hundred feet
     out in a field. One conversion now, and it is the right one. */
  const wft = (f) => ft(f) * S

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
  /* THE PLATE'S EDGE IS CHAMFERED, and that one change is most of what stopped it
     reading as a cut-out. A prism with a hard 90-degree arris returns exactly one value
     along its whole rim; a bevel gives the rim a second facet at a different angle to
     the key, so the plinth draws a continuous highlight around itself and reads as a
     machined object with a thickness. Small — a foot and a half — because this is a
     presentation model, not a plinth in a museum. */
  const slabGeo = new THREE.ExtrudeGeometry(shape, {
    depth: SLAB,
    bevelEnabled: true,
    bevelThickness: ft(1.6),
    bevelSize: ft(1.6),
    bevelSegments: 2,
  })
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

  /* --- THE LAND THE SITE IS CUT INTO ----------------------------------------------
     The plinth is a deliberate object with a real machined edge, and on its own against
     a sky that was the problem: an outdoor hour behind a plate that stops in mid-air
     reads as a model on a table someone forgot to photograph the table of. Two readings
     were fighting and the floating one was winning.

     So the site now has land around it. One large matte plane at the plinth's underside,
     far enough out that its own edge is well past the fog's far plane — which means it
     resolves to exactly the haze value the fog resolves to, and that value is the one
     the sky gradient carries at the horizon. The compound becomes a raised pad in open
     ground at dusk, the plinth edge becomes the cut that pad is made by, and there is
     no edge anywhere for the eye to find. */
  const terrain = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), M.terrain)
  terrain.rotation.x = -Math.PI / 2
  terrain.position.y = -SLAB - ft(0.4)
  terrain.receiveShadow = true
  terrain.name = 'terrain'
  site.add(terrain)

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
  /* AN APRON BELONGS ON A DOOR SIDE.  Four buildings — 01, 03, 06 and 10 — are built
     from two parallel rows, and the old rule gave every row an apron on whichever face
     was nearer the drive.  For the back row of a pair that face is the blind rear wall,
     so four full-length concrete forecourts were being laid in open ground behind
     buildings, which is the light trapezoid the audit found sitting on its own.

     The doors already solved this per bay.  The apron now asks THEM which way the run
     faces instead of asking the roadway a second time. */
  const rowDoorDir = (row) => {
    const bays = model.suites.filter((s) => Math.abs(s.ang - row.ang) < 0.01 &&
      Math.hypot(s.cx - row.cx, s.cy - row.cy) < row.length * 0.62)
    if (!bays.length) return buildingApronDir(row)
    let x = 0, y = 0
    for (const b of bays) { x += b.faceNormal[0]; y += b.faceNormal[1] }
    const L = Math.hypot(x, y)
    return L < 0.001 ? buildingApronDir(row) : [x / L, y / L]
  }
  for (const row of data.rows) {
    const B = rowDoorDir(row)
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
      const dir = rowDoorDir(row)
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

  /* ================================================================================
     THE SITE, from the civil plan.  REFERENCE_DERIVED_VISUAL throughout.

     Everything in this block comes from `src/data/site-visual.js`, which reads the
     published civil render through a transform fitted on the eleven building badges
     the render and the measured data share. It is visual truth, not survey truth, and
     the file says so at the top of itself.

     Four things, in the order they are laid down: the landscape ground the paving sits
     in, the roundabout that organises the drive, the basin that carries the ground off
     the edge of the plate, and the planting that frames the architecture.
     ================================================================================ */

  /* --- LANDSCAPE GROUND. The second site material, and the end of the one-value
     plate. Soft-edged discs of planted ground laid into the paving — grass reads
     darker and far rougher than concrete, and the difference between the two is what
     finally gives the site a surface instead of a silhouette. */
  {
    /* Each zone is now a traced polygon rather than a scaled disc, so its edge follows
       the kerb, the setback or the parcel line it actually sits against. The shapes
       come from `site-visual.js`, which reads them off the civil render. */
    for (const z of SV.landscape) {
      const shape = new THREE.Shape(z.outline.map(([x, y]) => v2(x, y)))
      const geo = new THREE.ShapeGeometry(shape, 6)
      geo.rotateX(Math.PI / 2)
      const g = new THREE.Mesh(geo, M.grass)
      g.position.y = ROAD_LIFT * 0.25
      g.receiveShadow = true
      site.add(g)
    }
  }

  /* --- THE ROUNDABOUT and the turning head. Carriageway, kerb ring, planted island —
     three concentric pieces, which is all a roundabout is. */
  for (const r of [SV.roundabout, SV.culDeSac]) {
    const road2 = new THREE.Mesh(new THREE.CircleGeometry(r.outer, 48), M.road)
    road2.rotation.x = -Math.PI / 2
    road2.position.set(r.cx, ROAD_LIFT, r.cy)
    road2.receiveShadow = true
    site.add(road2)

    const kerb = new THREE.Mesh(new THREE.RingGeometry(r.island, r.island + ft(1.6), 44), M.concrete)
    kerb.rotation.x = -Math.PI / 2
    kerb.position.set(r.cx, ROAD_LIFT + 0.08, r.cy)
    site.add(kerb)

    const island = new THREE.Mesh(new THREE.CircleGeometry(r.island, 40), M.grass)
    island.rotation.x = -Math.PI / 2
    island.position.set(r.cx, ROAD_LIFT + 0.12, r.cy)
    island.receiveShadow = true
    site.add(island)
  }

  /* --- THE RETENTION BASIN.

     Dark, smooth and very slightly metallic, so at blue hour it returns the sky and
     nothing else — a basin at dusk is a hole with the sky in it. It is the quiet
     counterweight the architecture needed: the only horizontal surface on the site that
     is brighter than the ground around it, and the only one that is not paved.

     It sits proud of the parcel envelope on the plan and it is left that way. The
     ground it needs is laid under it, which is also what softens the plate's north-east
     corner — the hard polygon edge stops being the end of the world there. */
  {
    /* Same convention as the slab: the geometry is rotated ON ITSELF so a shape point
       (x, y) lands at world (x, 0, y). Rotating the MESH instead mirrors the outline
       about the axis and puts the basin on the wrong side of the site — which is
       exactly where a first pass put it. */
    const pondPts = SV.pond.outline.map(([x, y]) => v2(x, y))
    const cen = pondPts.reduce((a, p) => ({ x: a.x + p.x / pondPts.length, y: a.y + p.y / pondPts.length }), { x: 0, y: 0 })

    /* The bank: the same outline grown about its own centre, so the water sits in a
       margin of planted ground rather than meeting the paving at a hard line. */
    const bankGeo = new THREE.ShapeGeometry(
      new THREE.Shape(pondPts.map((p) => v2(cen.x + (p.x - cen.x) * 1.3, cen.y + (p.y - cen.y) * 1.3))),
    )
    bankGeo.rotateX(Math.PI / 2)
    const bank = new THREE.Mesh(bankGeo, M.grass)
    bank.position.y = ROAD_LIFT * 0.2
    bank.receiveShadow = true
    site.add(bank)

    const waterGeo = new THREE.ShapeGeometry(new THREE.Shape(pondPts))
    waterGeo.rotateX(Math.PI / 2)
    const water = new THREE.Mesh(waterGeo, M.water)
    water.position.y = ROAD_LIFT * 0.3
    water.receiveShadow = true
    site.add(water)
  }

  /* --- PLANTING — THE REAL TREES. --------------------------------------------------

     The procedural trunk-and-icosahedron was honest about being a placeholder and it
     looked like one. These are the source library's own chestnuts: the FBX turned out
     to hold FIVE distinct trees, so they are exported one per file and the site plants
     different trees rather than one tree a hundred times.

     Loaded asynchronously and added when they arrive. The compound is complete without
     them and simply gains its planting a moment later, so a slow connection gets a
     finished model rather than a broken one.

     Placement is unchanged and still derived — sampled along the measured parcel line,
     stepped inward, rejected unless the point clears every building and the drive, and
     now also drawn toward the landscaped zones, which is where planting belongs. What
     changed is what gets planted.

     Blue hour: the loaded materials are overridden to the site's own foliage value.
     A daylight-green tree at dusk is the single fastest way to break the hour. */
  const treeSpots = []
  {
    const occupied = []
    for (const row of data.rows) occupied.push([row.cx, row.cy, Math.max(row.length, row.depth) * 0.62])
    for (const c of data.civic) occupied.push([c.cx, c.cy, Math.max(c.length, c.depth) * 0.62])
    const clear = (x, y) => {
      for (const [ox, oy, rad] of occupied) if (Math.hypot(x - ox, y - oy) < rad) return false
      if (spine) { const n = nearestOnSpine(spine, x, y); if (n.d < ROAD_W * 1.55) return false }
      return true
    }

    /* Along the parcel line, stepped inward. */
    const per = data.perimeter
    for (let i = 0; i < per.length; i++) {
      const [px, py] = per[i]
      const [qx, qy] = per[(i + 1) % per.length]
      const mx = (px + qx) / 2, my = (py + qy) / 2
      const toC = [cX - mx, cY - my]
      const l = Math.hypot(toC[0], toC[1]) || 1
      for (const inset of [24, 52]) {
        const x = mx + (toC[0] / l) * inset
        const y = my + (toC[1] / l) * inset
        if (clear(x, y)) treeSpots.push([x, y, i])
      }
    }

    /* And clustered inside the landscaped zones — a planted area with no planting in it
       is just a differently coloured floor. Three per zone, at its own vertices pulled
       toward its centroid, so the group sits inside the shape rather than on its edge. */
    for (const [zi, z] of SV.landscape.entries()) {
      const pts = z.outline
      const cx2 = pts.reduce((a, q) => a + q[0], 0) / pts.length
      const cy2 = pts.reduce((a, q) => a + q[1], 0) / pts.length
      for (let k = 0; k < pts.length; k += 2) {
        const x = cx2 + (pts[k][0] - cx2) * 0.55
        const y = cy2 + (pts[k][1] - cy2) * 0.55
        if (clear(x, y)) treeSpots.push([x, y, zi * 7 + k])
      }
    }
  }

  /* The library, loaded once and instanced by cloning. Draco-compressed GLB, ~1.3 MB
     each, three silhouettes — enough variation that no two neighbours match. */
  const TREES = ['tree-1', 'tree-2', 'tree-3', 'tree-4', 'tree-5']
  const foliage = new THREE.MeshStandardMaterial({ color: 0x1c2620, roughness: 1, metalness: 0 })
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.95, metalness: 0 })

  const plantTrees = async () => {
    const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/loaders/DRACOLoader.js'),
    ])
    const draco = new DRACOLoader()
    /* The decoder that ships with the installed three, vendored into public/ — the CDN
       path guessed at first simply 404s, and a decoder that is not there fails silently
       into a compound with no planting. */
      /* ROOT-RELATIVE, NOT DOCUMENT-RELATIVE.  './draco/' and './models/' resolve against
       whatever URL the page happens to sit at, so the whole planting silently vanished
       on every page that is not the site root — the exploration at /exploration/study/
       and the integrated review at /exploration/integrated/ both requested
       .../study/models/tree-1.glb, got index.html back, and logged a JSON parse error
       nobody was reading. Measured: 0 silhouettes planted at 106 points. */
    draco.setDecoderPath('/draco/gltf/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(draco)

    const models = []
    for (const name of TREES) {
      try {
        /* A PLAIN RUNTIME PATH, not a bundler URL.

           `new URL(..., import.meta.url)` makes Vite's import-analysis try to resolve
           the whole family at build time — it globbed every GLB into the module graph
           and then failed to parse the result. Large binary assets belong in `public/`
           and are fetched by path: nothing to analyse, nothing to inline, and the files
           are served exactly as they were exported. */
        const g = await loader.loadAsync(`/models/${name}.glb`)
        models.push(g.scene)
      } catch (err) { console.warn('[luxe-corsa] tree', name, 'did not load', err) }
    }
    console.info('[luxe-corsa] planting', models.length, 'silhouettes at', treeSpots.length, 'points')
    if (!models.length) return

    /* KEEP THE GLB'S OWN MATERIALS, and grade them.

       A first pass replaced every tree material with two of our own, which threw away
       the leaf alpha the whole silhouette depends on — the export renames meshes to
       'Mesh'/'Mesh_1', so a name-based leaf test matched nothing and both halves of the
       tree became opaque dark bark. Invisible against a dark site.

       The imported materials already carry the source's bark and leaf maps. So they are
       kept and TUNED instead: alpha cut-out enabled wherever a map has transparency,
       roughness pushed up, and the colour multiplied down toward the site's foliage
       value so a daylight-green tree reads at blue hour. */
    for (const m of models) {
      m.traverse((n) => {
        if (!n.isMesh || !n.material) return
        const mats = Array.isArray(n.material) ? n.material : [n.material]
        for (const mat of mats) {
          mat.roughness = 1
          mat.metalness = 0
          mat.envMapIntensity = 0.10
          /* Foliage at dusk is nearly black with a green bias; multiplying the map by a
             dark colour keeps its variation and removes the daylight. */
          /* Well below the architecture. Untextured foliage takes the full key, so a
             mid green renders as a pale pom-pom against a dark site — landscape has to
             sit under the buildings in value or it stops framing them and starts
             competing with them. */
          /* RE-GRADED FOR THE NEW PRINT. This value was tuned at exposure 1.22 with a 4.6 key;
             opening the print up to 1.46 / 6.0 to make the garage doors read turned the same
             foliage back into pale daylight pom-poms, brighter than the buildings they are
             meant to frame. Scaled by the same factor the exposure moved. */
          mat.color.setRGB(0.052, 0.064, 0.044)
          if (mat.map) {
            mat.alphaTest = 0.4
            mat.transparent = false
            mat.side = THREE.DoubleSide
          }
          mat.needsUpdate = true
        }
        n.castShadow = true
        n.receiveShadow = false
      })
    }

    /* NORMALISE ON THE MODEL THAT ACTUALLY ARRIVED.

       The export normalises each tree to one unit tall in Blender, but glTF carries
       Blender's own unit conversion on the scene root — so the model that reaches the
       browser was about 1/6000th of a unit, and multiplying it by a height in feet gave
       trees three thousandths of a unit tall. Invisible, and the geometry probe still
       reported a tidy 0..1 local box because the shrink lives on an ancestor.

       So each silhouette is measured once, here, and every clone is scaled by the
       ratio that actually puts it at the height we want. Whatever any exporter does to
       the transform, the tree ends up the size the site asked for. */
    const unit = models.map((m) => {
      const box = new THREE.Box3().setFromObject(m)
      return Math.max(1e-6, box.max.y - box.min.y)
    })

    for (const [x, y, seed] of treeSpots) {
      const pick = seed % models.length
      const src = models[pick]
      const t = src.clone(true)
      const h = ft(26) + ((seed * 37) % 11) * ft(2.2)
      t.scale.setScalar(h / unit[pick])
      t.position.set(x, 0, y)
      t.rotation.y = seed * 1.31
      site.add(t)
      if (!window.__lcTree) { window.__lcTree = t }
    }
    console.info('[luxe-corsa] planted', treeSpots.length)
  }
  plantTrees()


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
      if (s > 0) {
        /* THE BEAM, spanning both piers at head height. */
        const beam = new THREE.Mesh(pierGeo, pierMat)
        beam.scale.set(ROAD_W + ft(11), ft(4.6), ft(3.4))
        beam.position.set(gx, ft(15.2), gy)
        beam.rotation.y = -Math.atan2(dy, dx)
        beam.castShadow = true
        site.add(beam)
        /* THE WORDMARK PLATE. Emissive, in the project's red, set on the beam's face —
           the one saturated thing at the entrance and the reason the interface may use
           that red for a committed selection at all. */
        const plate = new THREE.Mesh(pierGeo, new THREE.MeshBasicMaterial({ color: 0xd8453c }))
        plate.scale.set(ROAD_W * 0.44, ft(1.5), ft(0.4))
        plate.position.set(gx - px * ft(1.9), ft(15.2), gy - py * ft(1.9))
        plate.rotation.y = beam.rotation.y
        site.add(plate)
        const wash = new THREE.PointLight(0xffd0a4, 5, ft(52), 2)
        wash.position.set(gx, ft(12), gy)
        site.add(wash)
      }
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

  /* THE DRIVE'S OWN EDGES. Two concrete upstands offset to either side of the measured
     centreline, at the road's half width. Without them the asphalt has no boundary and
     the eye reads a dark shape rather than a carriageway. */
  if (spine) {
    for (const side of [1, -1]) {
      const edge = []
      for (let i = 0; i < spine.length; i++) {
        const [x, y] = spine[i]
        const [nx2, ny2] = spine[Math.min(i + 1, spine.length - 1)]
        const [px2, py2] = spine[Math.max(i - 1, 0)]
        let dx = nx2 - px2, dy = ny2 - py2
        const L = Math.hypot(dx, dy) || 1
        dx /= L; dy /= L
        edge.push([x - dy * (ROAD_W / 2) * side, y + dx * (ROAD_W / 2) * side])
      }
      const k = new THREE.Mesh(ribbon(edge, ft(1.2)), M.concrete)
      k.position.y = ROAD_LIFT + 0.04
      k.receiveShadow = true
      site.add(k)
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
    buildingObjs.set(b.num, { num: b.num, group: g, bays: [], roofs: [], picks: [], model: b, lift: 0 })
  }

  for (const s of model.suites) {
    const B = buildingObjs.get(s.building)
    if (!B) continue
    const m = new THREE.Mesh(bayGeo, s.sold ? M.sold : M.wall)
    /* THE MASS FILLS ITS SLOT.

       This is the correction the whole pass turns on.  The width was shrunk twice —
       0.92 in the bay builder and 0.94 again here — and the depth twice more, which cut
       a 2.4-to-2.9 ft slot, 26 ft tall, clean through the building between every pair of
       suites, front to back.  Measured on every one of the thirteen runs it came to
       13.5 % of the pitch for a Type A bay and over 30 % for a Type B.  A visitor saw
       DOOR, VOID, DOOR.  A commercial building does not have holes in it.

       Adjacent boxes now share a face exactly.  They do not z-fight: the two coplanar
       faces are back to back, so one is always facing away and only ever one is drawn.
       The joint the old comment wanted is now a real PIER, built below. */
    m.scale.set(s.slot ?? s.w, H_SUITE, s.depth ?? s.dep)
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
    /* THE PIER.  The vertical division between two suites: full height, standing proud
       of the door plane, and the element the reference elevation is built out of.  Every
       bay carries the pier on its own leading edge, so a run of n suites draws n piers
       and the last bay's far edge is closed by the run's end pier below. */
    const slotW = s.slot ?? s.w
    const PIER_W = ft(1.9)
    const clear = slotW - PIER_W          /* the opening available between two piers */
    const rot0 = -(s.ang * Math.PI) / 180
    const [fnx0, fny0] = s.faceNormal
    const faceD0 = (s.depth ?? s.dep) * 0.5

    const pierL = new THREE.Mesh(bayGeo, M.wall)
    pierL.scale.set(PIER_W, H_SUITE, ft(1.5))
    pierL.position.set(
      s.cx - Math.cos(rot0) * (slotW / 2) + fnx0 * (faceD0 - ft(0.4)),
      H_SUITE / 2,
      s.cy + Math.sin(rot0) * (slotW / 2) + fny0 * (faceD0 - ft(0.4)),
    )
    pierL.rotation.y = rot0
    pierL.castShadow = true
    pierL.receiveShadow = true
    B.group.add(pierL)

    /* THE DOOR occupies ~80 % of the clear bay between piers, which is what the
       reference elevation shows and what a car actually needs — and the share is where
       PREMIUM and STANDARD become architecture rather than a colour key. */
    const dw = clear * (s.type === 'A' ? 0.88 : 0.72)
    const dh = H_SUITE * 0.5
    const [fnx, fny] = s.faceNormal
    const rot = -(s.ang * Math.PI) / 180
    const faceD = faceD0

    /* THE REVEAL, AND THE BLACK RECTANGLE THIS FIXES.

       The frame was ONE SOLID BOX the full size of the opening, sitting PROUD of the
       wall, with the leaf buried half a foot BEHIND the wall face. So the leaf was never
       visible at all: what a visitor saw in every bay was the front face of that solid
       slab, in trim material at metalness 0.55 — a semi-mirror with a dark sky to
       reflect, which renders as pure black. Measured at building level, every bay in the
       compound was a black rectangle, and that is the object the review kept finding.

       A frame is a RING, not a plate. Four bars — head, cill and two jambs — stand proud
       around the opening and throw the shadow that makes it an opening. The leaf sits
       just inside them where it can be seen, and is what the light in the interface
       actually lands on. */
    const REV = ft(0.62)                       /* the reveal's own width */
    const frameZ = faceD + ft(0.26)
    const bar = (w, h, ox, oy) => {
      const m = new THREE.Mesh(bayGeo, M.trim)
      m.scale.set(w, h, ft(0.62))
      m.position.set(
        s.cx + Math.cos(rot) * ox + fnx * frameZ,
        dh / 2 + oy,
        s.cy - Math.sin(rot) * ox + fny * frameZ,
      )
      m.rotation.y = rot
      m.castShadow = true
      m.receiveShadow = true
      B.group.add(m)
      return m
    }
    const frame = bar(dw + REV * 2, REV, 0, dh / 2 + REV / 2)   /* head */
    bar(REV, dh + REV, (dw + REV) / 2, 0)                        /* jamb, one side */
    bar(REV, dh + REV, -(dw + REV) / 2, 0)                       /* jamb, the other */

    /* The leaf, just inside the reveal so the frame's own edge shades its head and one
       jamb. Segmented: a commercial sectional door is four horizontal panels, and at
       this scale the segmentation is what tells the eye how big the opening is. */
    const door = new THREE.Mesh(bayGeo, M.door)
    door.scale.set(dw, dh, ft(0.5))
    door.position.set(s.cx + fnx * (faceD + ft(0.04)), dh / 2, s.cy + fny * (faceD + ft(0.04)))
    door.rotation.y = rot
    door.castShadow = true
    door.receiveShadow = true
    B.group.add(door)

    for (let seg = 1; seg <= 3; seg++) {
      const line = new THREE.Mesh(bayGeo, M.trim)
      line.scale.set(dw * 0.985, ft(0.26), ft(0.62))
      line.position.set(
        s.cx + fnx * (faceD + ft(0.1)),
        (dh / 4) * seg,
        s.cy + fny * (faceD + ft(0.1)),
      )
      line.rotation.y = rot
      B.group.add(line)
    }

    /* THE GLAZED HEAD.  Every real Luxe Corsa door has a windowed top section, and it is
       the detail that stops a bay reading as a black rectangle: it catches the sky where
       the rest of the leaf catches nothing. */
    const glazeH = dh * 0.30
    const glazeY = dh - glazeH * 0.56
    const glaze = new THREE.Mesh(bayGeo, M.glass)
    glaze.scale.set(dw * 0.92, glazeH, ft(0.30))
    glaze.position.set(
      s.cx + fnx0 * (faceD0 - ft(0.30)),
      glazeY,
      s.cy + fny0 * (faceD0 - ft(0.30)),
    )
    glaze.rotation.y = rot0
    B.group.add(glaze)
    /* the transom under it — one light line across every bay, which is what makes the
       glazed section read at compound distance rather than only in close-up */
    const transom = new THREE.Mesh(bayGeo, M.roof)
    transom.scale.set(dw * 0.96, ft(0.42), ft(0.5))
    transom.position.set(
      s.cx + fnx0 * (faceD0 - ft(0.16)),
      glazeY - glazeH / 2,
      s.cy + fny0 * (faceD0 - ft(0.16)),
    )
    transom.rotation.y = rot0
    B.group.add(transom)

    /* THE UNIT PLAQUE IS GONE. Eighty-seven near-black rectangles across the facades read
       as signs stuck to the buildings, and the number on them is unreadable at every
       authored camera. If an object reads as an artifact, its name does not save it. */
    const plaque = new THREE.Mesh(bayGeo, M.trim)
    plaque.visible = false
    const plaqueW = Math.min(ft(1.4), (clear - dw) * 0.42)
    plaque.scale.set(plaqueW, ft(0.9), ft(0.14))
    plaque.position.set(
      s.cx + Math.cos(rot0) * (dw / 2 + plaqueW) + fnx0 * (faceD0 + ft(0.12)),
      dh * 0.84,
      s.cy - Math.sin(rot0) * (dw / 2 + plaqueW) + fny0 * (faceD0 + ft(0.12)),
    )
    plaque.rotation.y = rot0
    B.group.add(plaque)

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

    const obj = { suite: s, mesh: m, door, glaze, transom, lamp, baseY: H_SUITE / 2 }
    B.bays.push(obj)
    suiteObjs[s.index] = obj
  }

  /* THE CORNER REVEAL, on the two end piers of every run. The architect's elevation puts
     a thin red line down the corner pilaster; it is the building's own identity mark and
     the reason the interface may use that red for selection at all. */
  {
    const revealMat = new THREE.MeshStandardMaterial({ color: 0xd8453c, roughness: 0.5, metalness: 0.1,
      emissive: new THREE.Color(0xd8453c), emissiveIntensity: 0.22 })
    for (const B of buildingObjs.values()) {
      const bays = B.bays.map((o) => o.suite)
      if (bays.length < 2) continue
      const byRun = new Map()
      for (const s of bays) { const k = s.ang.toFixed(2); if (!byRun.has(k)) byRun.set(k, []); byRun.get(k).push(s) }
      for (const list of byRun.values()) {
        const r0 = -(list[0].ang * Math.PI) / 180
        const ux = Math.cos(r0), uz = -Math.sin(r0)
        const proj = list.map((s) => ({ s, u: s.cx * ux + s.cy * uz })).sort((a, b) => a.u - b.u)
        for (const end of [proj[0], proj[proj.length - 1]]) {
          const s = end.s
          const half = (s.slot ?? s.w) / 2
          const sign = end === proj[0] ? -1 : 1
          const fd = (s.depth ?? s.dep) * 0.5
          const rev = new THREE.Mesh(bayGeo, revealMat)
          rev.scale.set(ft(0.34), H_SUITE * 0.82, ft(0.5))
          rev.position.set(
            s.cx + ux * sign * (half - ft(1.0)) + s.faceNormal[0] * (fd + ft(0.5)),
            H_SUITE * 0.41,
            s.cy + uz * sign * (half - ft(1.0)) + s.faceNormal[1] * (fd + ft(0.5)),
          )
          rev.rotation.y = r0
          B.group.add(rev)
        }
      }
    }
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

  /* --- THE PICK PROXIES ------------------------------------------------------------
     A BUILDING'S IDENTITY IS NOT A PILE OF DECORATIVE MESHES.

     Compound-level hover used to raycast the 121 suite boxes plus every parapet bar and
     membrane in the model and read the building number off whichever one the ray
     happened to reach first. That works until it doesn't: a fascia overhanging its
     neighbour, a parapet bar standing proud over the gap between two runs, a roof slab
     seen edge-on — any of them can be the nearest hit while the pointer is visibly over
     a different building, which is exactly how 06 answered as 04.

     So each measured RUN gets one proxy: a single box on the run's own measured
     rectangle, from the slab to the top of the parapet, carrying the building number.
     It is the only thing compound-level picking is ever allowed to hit. Every building
     therefore has one canonical identity, adjacent buildings cannot claim each other's
     pointer because their measured rectangles do not overlap, and the target is the
     building's real footprint rather than an approximation of it — nothing is inflated.

     It draws nothing: colorWrite off, so there is no pixel, no depth write, no shadow. */
  const pickProxies = []
  const M_pick = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false })
  for (const row of data.rows) {
    const B = buildingObjs.get(row.building)
    if (!B) continue
    const h = H_SUITE + H_PARAPET
    const p = new THREE.Mesh(bayGeo, M_pick)
    p.scale.set(row.length, h, row.depth)
    p.position.set(row.cx, h / 2, row.cy)
    p.rotation.y = -(row.ang * Math.PI) / 180
    p.castShadow = false
    p.receiveShadow = false
    p.renderOrder = -999
    p.userData = { kind: 'building', num: row.building, building: row.building, pick: true }
    B.group.add(p)
    B.picks.push(p)
    pickProxies.push(p)
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
    /* GLASS NEEDS AN EDGE TO BE GLASS.  A near-black band with no frame, no head and no
       mullion is not a window — it is a hole, and from three-quarters on it read as a
       black bar sticking out of the clubhouse.  The band is rebuilt as a real opening:
       a trim surround one step proud, the glass recessed behind it, and mullions at a
       structural pitch so the head has something to land on. */
    const bandH = H_CIVIC * 0.34
    const bandY = H_CIVIC * 0.6
    for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = -(c.ang * Math.PI) / 180
      const cs = Math.cos(rr), sn = Math.sin(rr)
      const halfL = c.length / 2, halfD = c.depth / 2
      const runL = ax ? c.depth * 0.86 : c.length * 0.86
      const put = (offset, mesh) => {
        const ox = ax * (halfL + offset)
        const oz = az * (halfD + offset)
        mesh.position.set(c.cx + ox * cs - oz * sn, bandY, c.cy + ox * sn + oz * cs)
        mesh.rotation.y = rr
        civicGroup.add(mesh)
      }
      /* the surround, proud of the wall — this is the reveal that makes it an opening */
      const frame = new THREE.Mesh(bayGeo, M.trim)
      frame.scale.set(ax ? ft(0.3) : runL + ft(0.8), bandH + ft(1.2), az ? ft(0.3) : runL + ft(0.8))
      frame.castShadow = true
      put(ft(0.14), frame)
      /* the glass, set back inside it */
      const g2 = new THREE.Mesh(bayGeo, M.glass)
      g2.scale.set(ax ? ft(0.3) : runL, bandH, az ? ft(0.3) : runL)
      put(ft(0.10), g2)
      /* MULLIONS, on one honest basis: a face on the +/-X side runs along local Z and a
         face on the +/-Z side runs along local X, so the offset goes into whichever axis
         is free. The previous attempt mixed the two and the mullions came off the
         building as loose sticks — the artifact this block exists to remove. */
      const bays = Math.max(2, Math.round(runL / ft(19)))
      for (let i = 1; i < bays; i++) {
        const u = (i / bays - 0.5) * runL
        const lx = ax ? ax * (halfL + ft(0.16)) : u
        const lz = az ? az * (halfD + ft(0.16)) : u
        const mull = new THREE.Mesh(bayGeo, M.roof)
        mull.scale.set(ft(0.34), bandH * 0.96, ft(0.34))
        mull.position.set(c.cx + lx * cs - lz * sn, bandY, c.cy + lx * sn + lz * cs)
        mull.rotation.y = rr
        civicGroup.add(mull)
      }
      /* THE HEAD AND THE CILL. Without them the band has no top and no bottom and reads
         as a slot cut in the wall rather than as a window in it. */
      for (const dy of [bandH / 2 + ft(0.55), -bandH / 2 - ft(0.55)]) {
        const rail = new THREE.Mesh(bayGeo, M.roof)
        rail.scale.set(ax ? ft(0.34) : runL, ft(0.9), az ? ft(0.34) : runL)
        const lx = ax * (halfL + ft(0.14)), lz = az * (halfD + ft(0.14))
        rail.position.set(c.cx + lx * cs - lz * sn, bandY + dy, c.cy + lx * sn + lz * cs)
        rail.rotation.y = rr
        rail.castShadow = true
        civicGroup.add(rail)
      }
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
  /* THE TWO POSES THE ACT MOVES BETWEEN.

     HERO is the composed resting frame. ARRIVE is act 01's viewpoint expressed in this
     model's own coordinates: down near the ground, close in, turned along the drive.
     The boundary between the acts interpolates one into the other. */
  /* HERO IS SOLVED, NOT SET.

     A hand-set distance is a number that was right for the model on the day it was
     typed. Measured on the corrected data, dist 20.4 put building 11 a hundred and
     fifty pixels off the right edge of a 1440 frame — and a building a visitor cannot
     see is a building a visitor cannot choose, which makes CHOOSE A BUILDING a lie.

     So the rest pose is fitted to the eleven numbered buildings themselves: their own
     union box, projected at a trial distance, binary-searched for the largest scale
     that still clears a declared safe area. The safe area is the composition — the
     margins are asymmetric because the interface is: the top strip belongs to the mark
     and SITE PLAN, the bottom to the dock.

     The dealership is deliberately NOT in the fit. It is the way in, it sits a long way
     west of everything numbered, and including it shrank the compound by a fifth to
     hold a building that cannot be selected. It runs out of the left edge instead —
     a committed crop, which reads as the site continuing past the frame rather than as
     the frame having been drawn too small. */
  const HERO = { az: -0.58, el: 0.42, dist: 20.4, ty: -2.1, tx: 0, tz: 0 }
  const ARRIVE = { az: -1.12, el: 0.055, dist: 12.4, ty: 0.6 }
  const SAFE = { left: 44, right: 56, top: 104, bottom: 132 }

  const cam = { az: HERO.az, el: HERO.el, dist: HERO.dist, target: new THREE.Vector3(0, HERO.ty, 0) }
  const camTo = { ...cam, target: cam.target.clone() }

  /* Every distance in this file is composed against the desktop stage's 3:2. A phone's
     stage is square, which at the same vertical fov is a NARROWER horizontal field — so
     the identical distance crops the compound at both edges. The correction is one
     factor applied to every camera position rather than a second set of numbers to keep
     in step: pull back in proportion to how much narrower the frame is. */
  const fit = () => Math.min(1.32, Math.max(1, 1.30 / Math.max(0.5, camera.aspect)))

  /* HOW CLOSE THE VISITOR MAY GET, per level. The model should become more inspectable
     as the hierarchy deepens — that is the reward for going in — but at no level may the
     camera end up inside a building or so far out that the compound is a speck. */
  const RANGE = {
    compound: [13, 34],
    building: [5.5, 22],
    suite: [3.2, 16],
    /* ENTER IS THE ONE CAMERA THAT IS NOT A MODEL-VIEWER'S.
       Everything above is a distance at which a person is looking AT the compound; this
       is the distance at which they are standing IN FRONT OF ONE DOOR. The scene is
       built at 0.751 local units per foot and scaled by 0.02, so a world unit is about
       67 feet: the suite level's 3.2 floor is 213 feet back, which is why pressing ENTER
       put the visitor in an empty field with a light on the ground. This range starts at
       roughly forty feet, which is where a car would be. */
    entered: [0.42, 4],
  }
  let entered = false

  const applyCamera = () => {
    const [lo, hi] = (entered ? RANGE.entered : RANGE[level]) || RANGE.compound
    cam.dist = Math.max(lo, Math.min(hi, cam.dist))
    const { az, el, target } = cam
    const dist = cam.dist * fit()
    /* The target's height is solved by fitHero against the real stage, so there is no
       per-breakpoint lift to keep in step any more. */
    const ty = target.y
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

  /* --- FIT THE REST POSE TO THE ELEVEN BUILDINGS ----------------------------------
     Solved against the projection itself rather than against a formula, because the
     frame that matters is the one the visitor gets: the eight corners of the union box
     are projected at a trial pose and the pose is accepted only if every one of them
     lands inside the safe area. Two passes — first the target, so the box is centred in
     the safe rect, then a binary search on distance for the largest the compound can be
     while still clearing it. Twenty-two iterations is exact to a pixel and costs
     nothing: this runs at init and on resize, never per frame. */
  /* Declared here rather than beside the handlers that own them: the resize handler
     re-solves the rest pose and has to know whether the visitor is resting at compound
     and whether a drag is in progress, and it runs before either section is reached. */
  let dragging = false
  let level = 'compound'

  const fitHero = () => {
    const box = new THREE.Box3()
    let any = false
    for (const B of buildingObjs.values()) {
      for (const p of B.picks) { box.expandByObject(p); any = true }
    }
    if (!any) return
    const c = box.getCenter(new THREE.Vector3())
    HERO.tx = c.x
    HERO.tz = c.z

    const W = Math.max(1, mount.clientWidth || window.innerWidth)
    const H = Math.max(1, mount.clientHeight || window.innerHeight)
    const inner = {
      x0: SAFE.left, x1: W - SAFE.right,
      y0: SAFE.top, y1: H - SAFE.bottom,
    }
    const probe = new THREE.PerspectiveCamera(camera.fov, W / H, camera.near, camera.far)
    const v = new THREE.Vector3()
    const corners = []
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push([x, y, z])

    /* screen box of the compound at a given distance and target height */
    const measure = (dist, ty) => {
      probe.position.set(
        HERO.tx + dist * Math.cos(HERO.el) * Math.sin(HERO.az),
        ty + dist * Math.sin(HERO.el),
        HERO.tz + dist * Math.cos(HERO.el) * Math.cos(HERO.az),
      )
      probe.lookAt(HERO.tx, ty, HERO.tz)
      probe.updateMatrixWorld(true)
      probe.updateProjectionMatrix()
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9
      for (const [x, y, z] of corners) {
        v.set(x, y, z).project(probe)
        const px = (v.x * 0.5 + 0.5) * W, py = (-v.y * 0.5 + 0.5) * H
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py)
      }
      return { x0, x1, y0, y1 }
    }

    const wantX = (inner.x0 + inner.x1) / 2
    const wantY = (inner.y0 + inner.y1) / 2
    let ty = 0
    let dist = HERO.dist

    /* Centre and scale interact — recentring changes what fits, and rescaling moves the
       centre — so they are solved together, three rounds, which converges well inside a
       pixel on every stage this runs at. Centring works in SCREEN error and pushes the
       target along the camera's own right vector and along the ground, which is the only
       way to move a picture predictably when the camera is on a sphere. */
    const right = new THREE.Vector3()
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 10; i++) {
        const m = measure(dist, ty)
        const ex = ((m.x0 + m.x1) / 2) - wantX
        const ey = ((m.y0 + m.y1) / 2) - wantY
        if (Math.abs(ex) < 0.5 && Math.abs(ey) < 0.5) break
        /* world units per screen pixel at the target plane */
        const perPx = (2 * dist * Math.tan((camera.fov * Math.PI / 180) / 2)) / H
        right.set(Math.cos(HERO.az), 0, -Math.sin(HERO.az))
        HERO.tx += right.x * ex * perPx
        HERO.tz += right.z * ex * perPx
        ty -= ey * perPx
      }
      let lo = RANGE.compound[0], hi = RANGE.compound[1]
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2
        const m = measure(mid, ty)
        if (m.x0 >= inner.x0 && m.x1 <= inner.x1 && m.y0 >= inner.y0 && m.y1 <= inner.y1) hi = mid
        else lo = mid
      }
      dist = Math.min(RANGE.compound[1], hi)
    }
    HERO.dist = dist
    HERO.ty = ty
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
    /* Measure the LAYER, not the stage. The annotation layer is inset from the stage's
       right edge so it can never draw under the record column — but the clamp was still
       solving against the full stage width, so a label was allowed to sit past the
       layer's own edge and got cropped mid-word. The clamp has to use the box the
       labels are actually drawn in. */
    const host = mount.getBoundingClientRect()
    const r = calLayer.getBoundingClientRect()
    if (!r.width || !host.width) return
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
      /* The projection is in stage space; the layer is a sub-box of it, so the point is
         converted before anything is clamped against the layer. */
      const x = (tmpV.x * 0.5 + 0.5) * host.width - (r.left - host.left)
      const y = (-tmpV.y * 0.5 + 0.5) * host.height - (r.top - host.top)

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
      /* The band is ABSOLUTE, not a minimum. Letting a label ride up to its anchor when
         the anchor happened to be high put two callouts on the same line and they
         overprinted; stacking them at fixed heights is the only arrangement that cannot
         collide however the model turns. */
      const ly = BAND
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
    /* The rest pose is a fit, so it belongs to the stage and has to be re-solved when
       the stage changes. If the visitor is resting at compound, the fit is applied
       straight away — otherwise it waits for the next return home. */
    fitHero()
    if (level === 'compound' && !dragging) {
      cam.dist = HERO.dist
      cam.target.set(HERO.tx, HERO.ty, HERO.tz)
    }
  }

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

  /* --- RAYCAST -------------------------------------------------------------------
     Hover is resolved once per frame against the objects that are legal targets AT THE
     CURRENT LEVEL, not against everything in the scene. At compound level the whole
     model answers as buildings; inside a building, its own bays answer as suites. That
     is the same rule the SVG version enforces with pointer-events, expressed the way a
     3D scene has to express it. */
  const ray = new THREE.Raycaster()
  const ptr = new THREE.Vector2()
  let ptrInside = false
  let focusNum = null
  let hoverNum = null
  let hoverSuite = null
  let selectedSuite = null

  const suiteIndexOf = (suite) => (suite ? suite.index : -1)

  const targetsForLevel = () => {
    /* At compound level ONLY the pick proxies answer: one canonical box per measured
       run, so a hover resolves to exactly one building and never to whatever mesh the
       ray reached first. Inside a building, its own bays answer as suites. */
    if (level === 'compound') return pickProxies
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
    if (!g || wantsStill()) { B.group.position.y = to; B.lift = to; return }
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

  /* THE HOVER USED TO GO THE WRONG WAY.  M_focus was 0x59636f against a 0x6a7683 wall —
     the building a visitor was considering got DARKER than it had been, and the only
     thing that made a hover read at all was its neighbours falling further. That is why
     the model never felt clickable: nothing arrives, something leaves. The subject now
     gains, its neighbours give way, and the ratio between them is about 1.6 before the
     emissive and nearer 1.9 with it — which is the separation the brief asks for. */
  const M_focus = M.wall.clone()
  M_focus.color.setHex(0x7c8794)
  M_focus.emissive = lume.clone(); M_focus.emissiveIntensity = 0.10

  const M_hover = M.wall.clone()
  M_hover.color.setHex(0x8b95a1)
  M_hover.emissive = lume.clone(); M_hover.emissiveIntensity = 0.16

  /* THE ONE SUITE. Not a lighter grey — a surface with the compound's light on it, at
     four times the roof's intensity, which at this exposure is the brightest thing in
     the frame without ever clipping to white. */
  const M_lit = M.wall.clone()
  M_lit.color.setHex(0x77828f)
  M_lit.emissive = lume.clone()
  M_lit.emissiveIntensity = 0.10
  M_lit.roughness = 0.5

  const M_sub = M.wall.clone(); M_sub.color.setHex(0x272d35)
  /* HOVER HAS TO BE VISIBLE IN THE MODEL, NOT ONLY IN A TAG.  Considering a building now
     steps every other building back to roughly two thirds of its emphasis — far enough
     that the subject separates instantly, not so far that the compound stops being a
     place.  Distinct from the focus subordinate above, which goes further because a
     selection is a commitment and a hover is a question. */
  const M_hoverSub = M.wall.clone(); M_hoverSub.color.setHex(0x4a545f)
  const M_roofHoverSub = M.roof.clone(); M_roofHoverSub.color.setHex(0x2b323a)
  const M_roofFocus = M.roof.clone()
  M_roofFocus.color.setHex(0x424b57)
  M_roofFocus.emissive = lume.clone(); M_roofFocus.emissiveIntensity = 0.05
  const M_roofSub = M.roof.clone(); M_roofSub.color.setHex(0x1d2228)

  /* THE DOOR, LIT FROM INSIDE. The one detail that says a suite is OCCUPIED rather than
     available: warm light behind the opening of the selected suite. It is the only warm
     interior light in the model and it appears exactly once. */
  /* A LIT DOOR IS STILL A DOOR. As an unlit basic material it was a flat cream card —
     fine as a marker at compound distance, a blank panel once ENTER puts a visitor three
     feet from it. Standard material, so the leaf keeps its segments, its reveal shadow
     and its sheen, with a warm emissive strong enough to stay the brightest thing on the
     run from across the site. */
  const M_doorLit = M.door.clone()
  M_doorLit.color.setHex(0x5a4f41)
  M_doorLit.emissive = new THREE.Color(0xffc27a)
  M_doorLit.emissiveIntensity = 0.62
  M_doorLit.roughness = 0.62
  M_doorLit.metalness = 0.12

  /* --- THE ARCHITECTURAL HOVER LANGUAGE ------------------------------------------
     A hover is not a fill change. What arrives on the subject is the set of things
     that would actually change on a real building when the light comes up on it:

       the door reads as metal instead of as a hole   M_doorHot
       the glazed head over it returns something      M_glassHot
       the wall light above it comes on               M_lampHot

     Applied to every bay of the subject building, and one step further on the single
     suite being considered — which is what ties a control in the dock to a door in the
     world without drawing a line between them. */
  const M_doorHot = M.door.clone(); M_doorHot.color.setHex(0x4a5561); M_doorHot.metalness = 0.3
  /* THE ONE DOOR BEING CONSIDERED. A step above the rest of its own building, because
     "which real door is this control?" has to be answerable in the frame, not by
     elimination. Measured against M_doorHot it is a full value apart. */
  const M_doorPick = M.door.clone(); M_doorPick.color.setHex(0x6d7b89); M_doorPick.metalness = 0.32
  const M_doorSub = M.door.clone(); M_doorSub.color.setHex(0x232a33)
  const M_glassHot = M.glass.clone(); M_glassHot.color.setHex(0x40596f); M_glassHot.envMapIntensity = 3.1
  const M_glassPick = M.glass.clone(); M_glassPick.color.setHex(0x6d8ba6); M_glassPick.envMapIntensity = 3.6
  const M_lampHot = new THREE.MeshBasicMaterial({ color: 0xffe6c2 })
  const M_lampPick = new THREE.MeshBasicMaterial({ color: 0xfff3e2 })

  /* the one light that follows a decision */
  const focusLight = new THREE.PointLight(0xcfe0ee, 0, ft(150), 2)
  focusLight.position.set(0, ft(60), 0)
  site.add(focusLight)

  /* THE APRON POOL. A second, much tighter light that sits low in front of ONE door:
     the suite being considered or the suite chosen. It is what makes the answer to
     "which real door is this?" instant — the ground in front of it lights up, the way
     it would if someone had switched that bay on. */
  const suiteLight = new THREE.PointLight(0xffd9ab, 0, ft(46), 2)
  suiteLight.position.set(0, ft(12), 0)
  site.add(suiteLight)

  const paint3d = () => {
    for (const B of buildingObjs.values()) {
      const isFocus = B.num === focusNum
      const isHover = B.num === hoverNum && !focusNum
      const subordinate = (focusNum && !isFocus)

      const hoverSubordinate = !focusNum && hoverNum && !isHover
      for (const r of B.roofs) {
        r.material = isFocus || isHover ? M_roofFocus
          : subordinate ? M_roofSub
          : hoverSubordinate ? M_roofHoverSub
          : M.roof
      }

      /* The subject's own bays get the light: door, glass and wall lamp together, so
         the building reads as switched on rather than tinted. */
      const lit = isFocus || isHover
      for (const o of B.bays) {
        const picked = selectedSuite && o.suite === selectedSuite
        const considered = hoverSuite && o.suite === hoverSuite && !picked

        /* A SOLD SUITE IS IDENTIFIED, NEVER OFFERED. Pointing at one still says which
           door it is — that is orientation and it is owed — but nothing warms up and
           nothing lights: the apron pool below stays off and the leaf stays shut. */
        const soldConsidered = considered && o.suite.sold
        o.door.material = picked ? M_doorLit
          : (considered && !o.suite.sold) ? M_doorPick
          : lit ? M_doorHot
          : (subordinate || hoverSubordinate) ? M_doorSub : M.door
        if (o.glaze) o.glaze.material = (picked || (considered && !o.suite.sold)) ? M_glassPick : (lit ? M_glassHot : M.glass)
        if (o.lamp) o.lamp.material = picked ? M_lampPick : (lit && !soldConsidered ? M_lampHot : M.wallLight)

        if (o.suite.sold) { o.mesh.material = M.sold; continue }
        if (picked) { o.mesh.material = M_lit; continue }
        if (isFocus) { o.mesh.material = considered ? M_hover : M_focus; continue }
        if (isHover) { o.mesh.material = M_focus; continue }
        o.mesh.material = subordinate ? M_sub : (hoverSubordinate ? M_hoverSub : M.wall)
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
      /* NO TRANSLATION. A suite is part of a building and stays in it; what changes is
         the light on it, the door behind it and the state in the interface. */
      const cur = o.mesh.position.y - o.baseY
      if (Math.abs(cur) > 0.001) tweenSuiteLift(o, 0)
    }

    /* THE FOCUS LIGHT. Placed over whichever mass is the subject, off when none is. */
    {
      const subject = focusNum || hoverNum
      const B = subject ? buildingObjs.get(subject) : null
      if (B && B.roofs[0]) {
        const p = worldOf(B.roofs[0])
        focusLight.position.set(p.x, p.y + ft(46), p.z)
        /* A hover is a question and used to get half the light a selection gets, which
           made considering a building almost indistinguishable from not. It now gets
           most of it — the difference between the two states is carried by the camera
           and by the dock, which is where a difference of KIND belongs. */
        focusLight.intensity = focusNum ? 30 : 24
      } else {
        focusLight.intensity = 0
      }
    }

    /* THE APRON POOL, over one door: the suite chosen, or failing that the one being
       considered from the dock. Nothing else in the model is warm. */
    {
      const o = (selectedSuite && suiteObjs[selectedSuite.index]) || (hoverSuite && !hoverSuite.sold && suiteObjs[hoverSuite.index]) || null
      if (o && o.door) {
        const p = worldOf(o.door)
        const n = o.suite.faceNormal || [0, 0]
        suiteLight.position.set(p.x + n[0] * wft(9), p.y + wft(7), p.z + n[1] * wft(9))
        suiteLight.intensity = selectedSuite ? 15 : 11
      } else {
        suiteLight.intensity = 0
      }
    }

    /* The civic masses are context once a building is the subject. */
    const civicDim = focusNum ? 0.42 : 1
    M.civic.color.setHex(focusNum ? 0x232830 : C.civic)
    void civicDim
  }

  /* --- CAMERA MOVES. GSAP owns az / el / dist / target and nothing else does. ----- */
  /* The pose the current level was composed at. Written by every authored move and
     read only by RESET. */
  let composed = null

  const wantsStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const flyTo = (to, dur = 1.0) => {
    /* REDUCED MOTION IS AN AUTHORED STILL, NOT A SLOWER FLIGHT. A visitor who has asked
       for no motion still gets every level of this act — they are simply PUT there. The
       framing is identical, because the framing is the content; only the travel is
       removed. Read live rather than captured, so a change of setting takes effect
       without a reload. */
    if (wantsStill()) dur = 0
    composed = {
      az: to.az ?? cam.az,
      el: to.el ?? cam.el,
      dist: to.dist ?? cam.dist,
      target: (to.target || cam.target).clone(),
    }
    const g = gsapRef.lib
    if (!g || dur === 0) {
      g?.killTweensOf(cam); g?.killTweensOf(cam.target)
      Object.assign(cam, { az: to.az ?? cam.az, el: to.el ?? cam.el, dist: to.dist ?? cam.dist })
      if (to.target) cam.target.copy(to.target)
      return
    }
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
    /* the site's own units per foot, and the world units a foot is worth — so a host
       page never has to guess which group carries the scale */
    unitsPerFoot: U,
    worldPerFoot: U * S,
    /* the top of a suite parapet, in the site's own local units: what a projected
       overlay needs to sit a label on a roof rather than on a slab */
    roofTopLocal: H_SUITE + H_PARAPET,
    /* one bay, by suite index — what a test needs to ask the model a direct question */
    bayOf: (i) => suiteObjs[i] || null,
    /* Author's handle on the rest pose: set the azimuth, refit, and land there. Used to
       compare candidate rest frames against each other in the browser rather than by
       arguing about numbers in a file. */
    setRestAzimuth(az) {
      HERO.az = az
      fitHero()
      cam.az = HERO.az
      cam.dist = HERO.dist
      cam.target.set(HERO.tx, HERO.ty, HERO.tz)
      site.rotation.y = 0
      applyCamera()
    },
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

    /* ------------------------------------------------------------------------------
       THE ARRIVAL — act 01 becoming act 02, as one camera move.

       Act 01 is a photograph taken standing on the drive, looking down it between two
       facing rows of doors. Act 02 is the same drive from above. The transition between
       them is therefore not a cut and not a crossfade: it is the ONE MOVE that connects
       those two viewpoints, and the model can perform it because it is a real camera in
       a real space.

       At k = 0 the camera is at eye height on the entry road, turned along the drive's
       own axis — as close to act 01's viewpoint as this model can stand. At k = 1 it is
       the composed hero pose. Scrubbed across the boundary, so the visitor lifts off the
       ground at exactly the rate they scroll: you were standing in it, now you are above
       it, and nothing was cut.

       Ignored the moment the visitor selects anything (`owner`), so an arrival can never
       drag the frame off a building someone chose. ------------------------------------ */
    /* WHERE THE SELECTED DOOR IS ON SCREEN, as a percentage of the stage.

       The 02 -> 03 threshold grows its warm field from the actual door the visitor
       chose, so it needs that door's projected position rather than the centre of the
       frame. Returns null when nothing is selected, and the threshold falls back to a
       composed default rather than guessing. */
    doorScreen() {
      const o = suiteObjs[suiteIndexOf(selectedSuite)]
      if (!o) return null
      const v = new THREE.Vector3()
      o.door.getWorldPosition(v)
      v.project(camera)
      const r = mount.getBoundingClientRect()
      const host = document.documentElement
      /* the stage is not the viewport — convert through the element's own box */
      const px = r.left + (v.x * 0.5 + 0.5) * r.width
      const py = r.top + (-v.y * 0.5 + 0.5) * r.height
      return { x: (px / host.clientWidth) * 100, y: (py / host.clientHeight) * 100 }
    },

    /* THE DESCENT. The last of the model's authored moves: from the suite pose down
       toward the door itself, so the camera is looking AT the opening when the light
       takes the frame. It stops short of the door — going through it would be the
       videogame move this transition exists to avoid. */
    descend(k) {
      const o = suiteObjs[suiteIndexOf(selectedSuite)]
      if (!o || k <= 0) return
      const t = Math.max(0, Math.min(1, k))
      cam.el = 0.30 + (0.085 - 0.30) * t
      cam.dist = 8.2 + (3.4 - 8.2) * t
      const v = new THREE.Vector3()
      o.door.getWorldPosition(v)
      cam.target.lerpVectors(cam.target.clone(), v, 0.35 * t)
    },

    arrival(k) {
      /* `owner` lives in main.js's camera facade, not here. The model's own equivalent of
         'the visitor has taken the wheel' is simply that something is selected — and an
         arrival must never drag the frame off a building someone chose. */
      if (level !== 'compound' || focusNum) return
      const t = Math.max(0, Math.min(1, k))
      /* Eased on the door curve rather than linearly: the lift should resist starting
         and settle rather than run at a constant rate, which is the page's character. */
      const e = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2
      cam.az = HERO.az + (ARRIVE.az - HERO.az) * (1 - e)
      cam.el = HERO.el + (ARRIVE.el - HERO.el) * (1 - e)
      cam.dist = HERO.dist + (ARRIVE.dist - HERO.dist) * (1 - e)
      cam.target.set(0, HERO.ty + (ARRIVE.ty - HERO.ty) * (1 - e), 0)
    },

    /* RESET returns to the pose this LEVEL was composed at — not to the homepage view.
       Every authored fly records where it was going, so reset is simply going there
       again rather than a second set of numbers that can drift out of step. */
    resetPose() {
      if (!composed) return
      flyTo(composed, 0.9)
      idleSince = performance.now()
    },

    setLevel(next, num, suiteIndex) {
      entered = false
      level = next
      focusNum = next === 'compound' ? null : num
      selectedSuite = next === 'suite' && suiteIndex != null ? suiteObjs[suiteIndex]?.suite || null : null
      if (next !== 'suite') selectedSuite = null
      hoverSuite = null
      hoverNum = null

      if (next === 'compound') {
        /* HOME HAS TO BE THE SAME PLACE EVERY TIME.
           The camera was being restored and the SITE'S OWN ROTATION was not, so every
           return to the compound landed on a slightly different view: measured, one
           building crept 37px across the frame over six select-and-return cycles, and a
           point that hovered on the first pass was open ground by the fourth. The ambient
           turn is a resting gesture, so coming home resets it along with the camera. */
        site.rotation.y = 0
        ambient = 0
        ambientPhase = 0
        flyTo({ az: HERO.az, el: HERO.el, dist: HERO.dist, target: new THREE.Vector3(HERO.tx, HERO.ty, HERO.tz) }, 1.1)
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

    /* ENTER. The camera drops to the apron in front of one door and comes in close —
       standing where a car would stand, which is the only camera move in this act that
       is at a person's height rather than a model-viewer's. It is a commitment, so it is
       slower than the moves that precede it and it does not change the level: the
       visitor is still in the suite they chose, they are simply at its door. */
    enterSuite(index) {
      const o = suiteObjs[index]
      if (!o) return
      entered = true
      const p = worldOf(o.door)
      /* Stand on the apron, on the door's own outward side, at about a person's height,
         looking at the middle of the leaf. The azimuth is the door's normal turned by
         whatever the site is currently turned by, so it is right at any orientation. */
      const n = o.suite.faceNormal || [0, 1]
      const az = Math.atan2(n[0], n[1]) + site.rotation.y
      flyTo({ az, el: 0.11, dist: 0.98, target: new THREE.Vector3(p.x, p.y - wft(1.5), p.z) }, 1.6)
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
    /* Distance is clamped PER LEVEL, so the model becomes more inspectable as the
       visitor goes deeper: at compound level they may not get inside the buildings, and
       at suite level they may come close enough to read a door. */
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
  /* LEAVING THE MODEL MUST TELL THE RECORD.

     Clearing the model's own hover locally left main.js still holding the building the
     pointer used to be over, so moving from a mass to the index found a row already lit
     for the wrong building and the two views disagreed — the exact defect this pass
     exists to remove. The leave is a state change like any other and it is announced. */
  el.addEventListener('pointerleave', () => {
    ptrInside = false
    if (hoverNum || hoverSuite) {
      hoverNum = null
      hoverSuite = null
      paint3d()
      api.syncCallouts()
      api.onHoverBuilding?.(null)
      api.onHoverSuite?.(null)
    }
  })

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

      /* THE CURSOR SAYS WHAT IS CLICKABLE, and it is the single cheapest piece of
         discoverability in the whole act: a model that shows `grab` everywhere is a
         model you turn, and one that switches to `pointer` the instant you cross a
         building is a model you SELECT things in. Set on the canvas rather than per
         object, because there is only ever one pointer. */
      el.style.cursor = hit ? 'pointer' : 'grab'

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
    /* THE MODEL BREATHES ONLY WHEN NOBODY IS POINTING AT IT.
       Freezing on hover alone was not enough: a visitor moving toward a building spends
       half a second over open ground, and the compound kept turning for all of it, so the
       target had moved by the time the pointer arrived. Any pointer inside the canvas now
       holds the turn. It resumes the moment the pointer leaves. */
    if (!reduced && !dragging && !focusNum && !hoverNum && !ptrInside) {
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

  resize()
  cam.dist = HERO.dist
  cam.target.set(HERO.tx, HERO.ty, HERO.tz)
  paint3d()
  applyCamera()

  return api
}
