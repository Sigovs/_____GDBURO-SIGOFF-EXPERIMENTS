// DIRECTION B — RADICAL EDITORIAL
//
// The type IS the composition and the machine moves through it. Words and figures
// are set at 18-34vw, cropped by the viewport on purpose, and the arm passes in
// FRONT of some and BEHIND others — the depth is the layout.
//
// The camera stays mid-distance and slightly off-axis so the machine reads as a
// shape in a poster rather than a subject in a photograph. Asymmetry everywhere:
// nothing is centred, and every stopped frame is meant to survive being printed.
//
// CALLOUTS are set into the type grid rather than floating over the picture, and
// they are large enough to be read as part of the layout. Numbered markers give
// the page its index.

const st = (az, r, h, t, fov) => ({ az, r, h, t, fov });

export default {
  id: 'b',
  title: 'KR 700 PA — editorial',

  camera: { fov: 38, lambda: 3.4 },

  env: {
    ambient: 0x06080c,
    intensity: 1.05,
    panels: [
      { colour: 0x0b1016, intensity: 1.0, size: [60, 60], at: [0, -8, 0] },
      { colour: 0xfff6ea, intensity: 6.0, size: [3.4, 24], at: [-9, 12, 4] },
      { colour: 0xfff2e0, intensity: 1.8, size: [2, 18], at: [8, 11, -3] },
      { colour: 0x2b3f56, intensity: 1.2, size: [18, 9], at: [10, 1.5, 6] },
    ],
  },

  material: {
    envMapIntensity: 1.35,
    paint: { r: 0.42, m: 0.05 },
    steel: { r: 0.26, m: 0.96 },
    graphite: { r: 0.58, m: 0.26 },
  },

  hall: {
    colour: 0x333f47, env: 0.30, fog: [12, 38], fogColour: 0x0a0c0d,
    pool: [4.0, 16], poolFloor: 0.06, aniso: [0.62, 1.0],
    contactDarkness: 1.7, contactOpacity: 0.8,
  },

  light: {
    first: 'flat',
    keyColour: 0xfff3e2, fillColour: 0x8fb4d6, rimColour: 0xffd2a0,
    shadowExtent: 15, shadowFar: 40,
    setups: {
      dark:  { key: [-8, 6.0, 2.6, 0.42], fill: [6, -1, 5, 0.06], rim: [3, 1.6, -7, 0.62], exposure: 0.48 },
      open:  { key: [-8, 6.0, 2.6, 1.6], fill: [6, -1, 5, 0.35], rim: [3, 1.6, -7, 1.6], exposure: 0.94 },
      flat:  { key: [-8, 5.4, 2.4, 3.2], fill: [6, -1, 5, 0.95], rim: [3, 1.6, -7, 1.7], exposure: 1.18 },
      side:  { key: [-10, 4.0, 1.8, 3.6], fill: [5, -1, 4, 0.72], rim: [4, 1.2, -6, 2.2], exposure: 1.14 },
      top:   { key: [-3, 8.0, 2.0, 3.4], fill: [5, 0.2, 4, 0.75], rim: [3.2, 2.4, -6, 1.8], exposure: 1.16 },
      close: { key: [-4, 3.4, 3.2, 4.2], fill: [4, 0.4, 3, 0.62], rim: [2.2, 1.0, -3.4, 2.8], exposure: 1.02 },
      final: { key: [-9, 4.8, 2.0, 3.4], fill: [6.5, -1.2, 5, 0.92], rim: [3.6, 1.4, -7.4, 2.4], exposure: 1.20 },
    },
  },

  // The intro opens on the shoulder in near-dark and pulls back onto the opening
  // station, where the cropped designation is already waiting to be struck in.
  intro: { from: st(78, 1.35, 1.30, [0.30, 1.58, 0], 40), light: 'dark', pose: 0.04, duration: 2.5 },

  shots: [
    {
      id: 'open', light: 'open', lightAt: [0, 0.4],
      from: st(62, 5.4, 1.92, [0.7, 1.40, 0], 36), to: st(40, 5.2, 1.9, [0.5, 1.4, 0], 36),
      pose: [0.10, 0.20], poseAt: [0.15, 0.95],
      pool: { radius: [3.4, 13], floor: 0.05 },
      callouts: [
        { id: 'b-col', n: '01', label: 'COLUMN AXIS', value: 'A1', anchor: 'column', side: 'r', at: 0 },
      ],
    },
    {
      // 2 744 set at 26vw, cropped left, the machine standing inside the numeral.
      id: 'height', light: 'flat', lightAt: [0.1, 0.5],
      from: st(40, 5.2, 1.9, [0.5, 1.4, 0], 36), to: st(100, 5.6, 1.75, [0.30, 1.28, 0], 40),
      camEase: 'easeOut',
      pose: [0.20, 0.34], poseAt: [0.18, 0.92],
      pool: { radius: [3.6, 14], floor: 0.06 },
      callouts: [
        { id: 'b-h', n: '02', label: 'OVERALL HEIGHT', value: '2 744 mm', anchor: 'top', side: 'r', band: 0.62, at: 0.3 },
      ],
    },
    {
      // FOUR AXES — the words break around the arm; the arm crosses in front.
      id: 'axes', light: 'side', lightAt: [0.05, 0.42],
      from: st(100, 5.6, 1.75, [0.30, 1.28, 0], 40), to: st(232, 4.0, 1.42, [0.28, 1.72, 0], 42),
      pose: [0.34, 0.60], poseAt: [0.05, 0.88],
      pool: { radius: [3.0, 12], floor: 0.06 },
      callouts: [
        { id: 'b-cl', n: '03', label: 'CLOSED LOOPS', value: '2', anchor: 'loops', side: 'r', at: 0.22 },
        { id: 'b-lk', n: '04', label: 'LINKAGE', value: '3 × 1 300 mm', anchor: 'elbow', side: 'l', band: 0.8, at: 0.5 },
      ],
    },
    {
      // 3 070 across the top, the machine seen from above sitting under it.
      id: 'reach', light: 'top', lightAt: [0.15, 0.6],
      from: st(232, 4.0, 1.42, [0.28, 1.72, 0], 42), to: st(348, 4.4, 4.6, [0.80, 1.42, 0], 44),
      camEase: 'easeOut',
      pose: [0.60, 0.79], poseAt: [0.1, 0.9],
      pool: { radius: [4.6, 17], floor: 0.06 },
      callouts: [
        { id: 'b-sp', n: '05', label: 'OVERALL SPAN', value: '3 070 mm', anchor: 'reach', side: 'l', at: 0.34 },
        { id: 'b-ax', n: '06', label: 'DRIVEN AXES', value: '4', anchor: 'column', side: 'r', at: 0.58 },
      ],
    },
    {
      id: 'grain', light: 'close', lightAt: [0, 0.34],
      from: st(348, 4.4, 4.6, [0.80, 1.42, 0], 44), to: st(372, 1.45, 2.20, [1.74, 2.02, 0], 32),
      camEase: 'hold',
      pose: [0.79, 0.88], poseAt: [0, 0.6],
      pool: { radius: [2.8, 10], floor: 0.05 },
      callouts: [
        { id: 'b-pv', n: '07', label: 'ELBOW PIVOT', value: 'A3', anchor: 'elbow', side: 'r', at: 0.4 },
        { id: 'b-sh', n: '08', label: 'SHOULDER', value: 'A2', anchor: 'shoulder', side: 'l', at: 0.64 },
      ],
    },
    {
      // THE HAND THAT NEVER TILTS — set full-bleed, arm through the middle line.
      id: 'level', light: 'final', lightAt: [0.14, 0.6],
      from: st(372, 1.45, 2.20, [1.74, 2.02, 0], 32), to: st(534, 7.0, 1.30, [1.55, 1.28, 0], 40),
      camEase: 'easeOut',
      pose: [0.88, 1.00], poseAt: [0.04, 0.72],
      pool: { radius: [4.0, 15], floor: 0.05 },
      callouts: [
        { id: 'b-pl', n: '09', label: 'TOOL PLATE', value: '0.000°', anchor: 'plate', side: 'r', at: 0.28 },
      ],
    },
  ],

  record: { station: st(534, 7.4, 1.35, [1.9, 1.26, 0], 40), from: 1.18, floor: 0.66, spinHome: 180 },
  still: st(534, 7.0, 1.30, [1.55, 1.28, 0], 40),
  stillLight: 'final',
  stillCallouts: [{ id: 'b-pl', n: '09', label: 'TOOL PLATE', value: '0.000°', anchor: 'plate', side: 'r', at: 0 }],
};
