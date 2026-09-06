// DIRECTION A — MONUMENTAL INDUSTRIAL
//
// The machine as architecture. It is never fully in frame after the opening: it
// crops on two or three edges in every shot and reads as a structure you stand
// under rather than an object you look at.
//
// LIGHT is one hard source and almost no fill — deep, sculptural, closer to a
// museum floodlight on a cast than to a product render. The floor is a tight pool
// with darkness beyond, so the room is implied by falloff rather than shown.
//
// INTERFACE is almost absent: no shot statements at all except two words at the
// opening and two at the close. The CALLOUTS carry the language instead, and they
// are large — a 40px numbered marker, a 24px label, and the measured value under
// a rule. In a direction with this little type, they are the type.

const st = (az, r, h, t, fov) => ({ az, r, h, t, fov });

export default {
  id: 'a',
  title: 'KR 700 PA — monumental',

  camera: { fov: 32, lambda: 3.0 },

  env: {
    ambient: 0x04060a,
    intensity: 0.9,
    panels: [
      { colour: 0x080c10, intensity: 1.0, size: [60, 60], at: [0, -8, 0] },
      { colour: 0xfff4e4, intensity: 7.5, size: [2.4, 26], at: [-11, 13, 3] },
      { colour: 0x1a2836, intensity: 0.8, size: [20, 10], at: [12, 2, 7] },
    ],
  },

  material: {
    envMapIntensity: 1.1,
    paint: { r: 0.44, m: 0.06 },
    steel: { r: 0.28, m: 0.96 },
    graphite: { r: 0.60, m: 0.28 },
  },

  hall: {
    colour: 0x262f35, env: 0.16, fog: [9, 27], fogColour: 0x0a0c0d,
    pool: [2.4, 9.5], poolFloor: 0.02, aniso: [0.85, 1.0],
    contactDarkness: 2.2, contactOpacity: 0.9,
  },

  light: {
    first: 'raking',
    keyColour: 0xfff2e0, fillColour: 0x6f8ea8, rimColour: 0xffcf96,
    shadowExtent: 16, shadowFar: 44,
    setups: {
      dark:    { key: [-10, 6.0, 3.0, 0.30], fill: [6, -1, 5, 0.04], rim: [3, 1.6, -7, 0.55], exposure: 0.42 },
      // one hard source, fill kept at the floor of legibility and no higher
      open:    { key: [-10, 6.0, 3.0, 1.5], fill: [6, -1, 5, 0.24], rim: [3, 1.6, -7, 1.6], exposure: 0.98 },
      raking:  { key: [-11, 4.6, 2.4, 3.6], fill: [6, -1, 5, 0.42], rim: [3, 1.4, -7, 1.9], exposure: 1.08 },
      under:   { key: [-9, 3.2, 3.6, 4.0], fill: [5, 0.4, 4, 0.36], rim: [2.6, 1.0, -5, 2.6], exposure: 1.02 },
      broad:   { key: [-9, 6.4, 2.0, 3.2], fill: [7, -1, 5, 0.55], rim: [3.4, 1.6, -7, 1.6], exposure: 1.12 },
      edge:    { key: [-12, 3.4, 1.2, 4.2], fill: [5, -1, 4, 0.34], rim: [4.4, 1.2, -5.5, 2.8], exposure: 1.04 },
      close:   { key: [-5, 3.0, 3.4, 4.6], fill: [4, 0.4, 3, 0.30], rim: [2.2, 1.0, -3.4, 3.0], exposure: 0.96 },
      resolve: { key: [-10, 5.0, 2.2, 3.4], fill: [7, -1.2, 5, 0.60], rim: [3.6, 1.4, -7.4, 2.2], exposure: 1.14 },
    },
  },

  /*
    THE INTRO — inside the machine, in the dark, then the pull back.

    The camera starts a metre and a quarter off the shoulder with almost no key
    on it. The light comes up on that joint first, and only then does the camera
    withdraw to the opening station, so the scale of the thing arrives as a
    CHANGE OF RELATIONSHIP rather than as an establishing wide. It resolves onto
    shots[0].from exactly, which is why the scroll can take over without a cut.
  */
  intro: { from: st(46, 1.25, 1.42, [0.22, 1.66, 0], 36), light: 'dark', pose: 0.04, duration: 2.5 },

  shots: [
    {
      id: 'open', light: 'open', lightAt: [0, 0.4],
      from: st(58, 5.4, 1.80, [0.7, 1.38, 0], 34), to: st(38, 4.4, 1.5, [0.5, 1.45, 0], 34),
      pose: [0.10, 0.20], poseAt: [0.15, 0.95],
      pool: { radius: [2.6, 10], floor: 0.02 },
      callouts: [
        { id: 'a-col', n: '01', label: 'COLUMN AXIS', value: 'A1 · ±185°', anchor: 'column', side: 'l', at: 0 },
      ],
    },
    {
      // UNDER IT. The camera is below the shoulder and the machine crops top and
      // bottom — the first frame that says this is bigger than the viewport.
      id: 'under', light: 'under', lightAt: [0, 0.3],
      from: st(38, 4.4, 1.5, [0.5, 1.45, 0], 34), to: st(14, 2.15, 0.62, [0.42, 1.62, 0], 50),
      pose: [0.20, 0.32], poseAt: [0.1, 0.9],
      pool: { radius: [2.0, 7.5], floor: 0.015 },
      callouts: [
        { id: 'a-dat', n: '02', label: 'FLOOR DATUM', value: '0.000 m', anchor: 'base', side: 'l', at: 0.3 },
        { id: 'a-sh', n: '03', label: 'SHOULDER', value: 'A2', anchor: 'shoulder', side: 'r', at: 0.54 },
      ],
    },
    {
      // THE STRUCTURE. Broadside, still cropped, the arm running out of frame.
      id: 'mass', light: 'broad', lightAt: [0.1, 0.5],
      from: st(14, 2.15, 0.62, [0.42, 1.62, 0], 50), to: st(96, 5.0, 1.35, [0.35, 1.30, 0], 40),
      camEase: 'easeOut',
      pose: [0.32, 0.48], poseAt: [0.18, 0.92],
      pool: { radius: [3.2, 12], floor: 0.03 },
      callouts: [
        { id: 'a-h', n: '04', label: 'OVERALL HEIGHT', value: '2 744 mm', anchor: 'top', side: 'r', at: 0.3 },
      ],
    },
    {
      // THE MECHANISM. Rear three-quarter, the two closed loops nearest.
      id: 'loops', light: 'edge', lightAt: [0.05, 0.42],
      from: st(96, 5.0, 1.35, [0.35, 1.30, 0], 40), to: st(238, 3.5, 1.30, [0.30, 1.78, 0], 42),
      pose: [0.48, 0.66], poseAt: [0.05, 0.88],
      pool: { radius: [2.8, 10], floor: 0.03 },
      callouts: [
        { id: 'a-cl', n: '05', label: 'CLOSED LOOPS', value: '2', anchor: 'loops', side: 'r', at: 0.24 },
        { id: 'a-lk', n: '06', label: 'LINKAGE MEMBERS', value: '3 × 1 300 mm', anchor: 'elbow', side: 'l', at: 0.5 },
      ],
    },
    {
      // OVERHEAD. The floor becomes the field and the machine a mark on it.
      id: 'plan', light: 'broad', lightAt: [0.15, 0.6],
      from: st(238, 3.5, 1.30, [0.30, 1.78, 0], 42), to: st(346, 4.2, 5.0, [0.85, 1.40, 0], 44),
      camEase: 'easeOut',
      pose: [0.66, 0.80], poseAt: [0.1, 0.9],
      pool: { radius: [4.4, 15], floor: 0.04 },
      callouts: [
        { id: 'a-sp', n: '07', label: 'OVERALL SPAN', value: '3 070 mm', anchor: 'reach', side: 'r', at: 0.32 },
        { id: 'a-ax', n: '08', label: 'DRIVEN AXES', value: '4', anchor: 'column', side: 'l', at: 0.58 },
      ],
    },
    {
      // MATERIAL. One joint, filling the frame.
      id: 'grain', light: 'close', lightAt: [0, 0.34],
      from: st(346, 4.2, 5.0, [0.85, 1.40, 0], 44), to: st(372, 1.30, 2.15, [1.72, 2.00, 0], 30),
      camEase: 'hold',
      pose: [0.80, 0.88], poseAt: [0, 0.6],
      pool: { radius: [2.6, 9], floor: 0.03 },
      callouts: [
        { id: 'a-pv', n: '09', label: 'ELBOW PIVOT', value: 'A3', anchor: 'elbow', side: 'r', at: 0.36 },
      ],
    },
    {
      // THE RELEASE. Full extension, wide, low, the shadow running out of frame.
      id: 'stand', light: 'resolve', lightAt: [0.14, 0.6],
      from: st(372, 1.30, 2.15, [1.72, 2.00, 0], 30), to: st(538, 7.6, 0.95, [1.85, 1.22, 0], 38),
      camEase: 'easeOut',
      pose: [0.88, 1.00], poseAt: [0.04, 0.72],
      pool: { radius: [4.0, 15], floor: 0.03 },
      callouts: [
        { id: 'a-pl', n: '10', label: 'TOOL PLATE', value: '0.000° tilt', anchor: 'plate', side: 'r', at: 0.26 },
      ],
    },
  ],

  record: { station: st(538, 7.8, 1.05, [2.0, 1.24, 0], 38), from: 1.14, floor: 0.62, spinHome: 180 },
  still: st(538, 7.6, 0.95, [1.85, 1.22, 0], 38),
  stillLight: 'resolve',
  stillCallouts: [{ id: 'a-pl', n: '10', label: 'TOOL PLATE', value: '0.000° tilt', anchor: 'plate', side: 'r', at: 0 }],
};
