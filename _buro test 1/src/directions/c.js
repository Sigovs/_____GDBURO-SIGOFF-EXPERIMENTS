// DIRECTION C — CINEMATIC MACHINE FILM
//
// Shot like a film about a machine rather than a page about one. The camera is
// the narrator: it comes in low, holds on a silhouette, pushes into a joint, then
// releases wide. The LIGHT changes as the story does — the film opens almost
// unlit, warms through the middle, and resolves cool and clean.
//
// Atmosphere carries the depth: denser fog, a wider pool, and a rim that lifts
// the arm off the haze. Almost no graphic overlay — two callouts in the whole
// film, placed where a title card would go, so when they do appear they land.
//
// The type is a single line per beat, small, low, and it never competes.

const st = (az, r, h, t, fov) => ({ az, r, h, t, fov });

export default {
  id: 'c',
  title: 'KR 700 PA — machine film',

  camera: { fov: 40, lambda: 2.6 },   // slower rig: the camera has weight

  env: {
    ambient: 0x04060a,
    intensity: 1.0,
    panels: [
      { colour: 0x070b10, intensity: 1.0, size: [70, 70], at: [0, -9, 0] },
      { colour: 0xffeed6, intensity: 5.4, size: [3.0, 28], at: [-10, 12, 5] },
      { colour: 0xffd8ae, intensity: 2.2, size: [2.4, 16], at: [9, 6, -8] },
      { colour: 0x27435e, intensity: 1.6, size: [22, 12], at: [11, 2, 8] },
    ],
  },

  material: {
    envMapIntensity: 1.4,
    paint: { r: 0.40, m: 0.08 },
    steel: { r: 0.24, m: 0.97 },
    graphite: { r: 0.56, m: 0.30 },
  },

  hall: {
    colour: 0x2b353d, env: 0.26, fog: [7, 26], fogColour: 0x0a0c0d,
    pool: [3.2, 12], poolFloor: 0.03, aniso: [0.7, 1.0],
    contactDarkness: 2.0, contactOpacity: 0.86,
  },

  light: {
    first: 'cold',
    keyColour: 0xffeeda, fillColour: 0x5f86ab, rimColour: 0xffb877,
    shadowExtent: 17, shadowFar: 46,
    setups: {
      dark:    { key: [-9, 5.0, 2.4, 0.22], fill: [6, -1, 5, 0.03], rim: [3.4, 1.6, -7, 0.70], exposure: 0.38 },
      // the film's own arc: cold and almost dark, warming, then resolving
      cold:    { key: [-9, 5.0, 2.4, 1.2], fill: [6, -1, 5, 0.20], rim: [3.4, 1.6, -7, 2.6], exposure: 0.90 },
      dawn:    { key: [-10, 4.2, 2.0, 2.6], fill: [6, -1, 5, 0.40], rim: [3.6, 1.4, -7, 2.8], exposure: 1.02 },
      warm:    { key: [-11, 3.4, 1.6, 3.8], fill: [5, -1, 4, 0.50], rim: [4.2, 1.2, -6, 3.2], exposure: 1.10 },
      silhou:  { key: [-3, 2.4, -7.0, 3.0], fill: [5, -0.5, 4, 0.22], rim: [-2, 1.6, -8, 4.2], exposure: 0.94 },
      intimate:{ key: [-4, 3.0, 3.0, 4.4], fill: [4, 0.4, 3, 0.44], rim: [2.2, 1.0, -3.4, 3.2], exposure: 1.00 },
      release: { key: [-9, 5.6, 2.4, 3.4], fill: [7, -1.2, 5, 0.80], rim: [3.6, 1.4, -7.4, 2.6], exposure: 1.16 },
    },
  },

  // The film's cold open: one joint, barely lit, then the hall arrives around it.
  intro: { from: st(52, 1.10, 1.20, [0.26, 1.62, 0], 42), light: 'dark', pose: 0.04, duration: 2.6 },

  shots: [
    {
      // OPENING — almost unlit, the machine an edge in the haze.
      id: 'open', light: 'cold', lightAt: [0, 0.5],
      from: st(64, 6.4, 2.10, [0.7, 1.40, 0], 38), to: st(44, 5.6, 1.35, [0.5, 1.42, 0], 40),
      pose: [0.10, 0.20], poseAt: [0.15, 0.95],
      pool: { radius: [2.6, 10], floor: 0.02 },
      callouts: [
        { id: 'c-col', n: '01', label: 'COLUMN AXIS', value: 'A1', anchor: 'column', side: 'l', at: 0 },
      ],
    },
    {
      // LOW AND CLOSE — the camera comes up under the shoulder as light arrives.
      id: 'push', light: 'dawn', lightAt: [0, 0.42],
      from: st(44, 5.6, 1.35, [0.5, 1.42, 0], 40), to: st(20, 2.6, 0.55, [0.44, 1.58, 0], 52),
      pose: [0.20, 0.34], poseAt: [0.1, 0.9],
      pool: { radius: [2.2, 8.5], floor: 0.02 },
      callouts: [
        { id: 'c-h', n: '02', label: 'OVERALL HEIGHT', value: '2 744 mm', anchor: 'top', side: 'r', at: 0.52 },
      ],
    },
    {
      // THE MECHANISM, warm and raking. The one place the film names a part.
      id: 'work', light: 'warm', lightAt: [0.05, 0.45],
      from: st(20, 2.6, 0.55, [0.44, 1.58, 0], 52), to: st(228, 3.9, 1.28, [0.28, 1.74, 0], 44),
      pose: [0.34, 0.60], poseAt: [0.05, 0.88],
      pool: { radius: [3.0, 11], floor: 0.03 },
      callouts: [
        { id: 'c-cl', n: '03', label: 'CLOSED LOOPS', value: '2', anchor: 'loops', side: 'r', at: 0.28 },
        { id: 'c-lk', n: '04', label: 'LINKAGE MEMBERS', value: '3 × 1 300 mm', anchor: 'elbow', side: 'l', at: 0.58 },
      ],
    },
    {
      // SILHOUETTE — backlit, the machine a black shape against the haze.
      id: 'shape', light: 'silhou', lightAt: [0.1, 0.5],
      from: st(228, 3.9, 1.28, [0.28, 1.74, 0], 44), to: st(300, 6.4, 1.05, [0.60, 1.45, 0], 36),
      camEase: 'easeOut',
      pose: [0.60, 0.75], poseAt: [0.1, 0.9],
      pool: { radius: [3.6, 14], floor: 0.02 },
      callouts: [],
    },
    {
      // MACRO — inside the joint, material and light only.
      id: 'skin', light: 'intimate', lightAt: [0, 0.34],
      from: st(300, 6.4, 1.05, [0.60, 1.45, 0], 36), to: st(372, 1.20, 2.10, [1.70, 1.98, 0], 30),
      camEase: 'hold',
      pose: [0.75, 0.88], poseAt: [0, 0.6],
      pool: { radius: [2.6, 9], floor: 0.03 },
      callouts: [
        { id: 'c-pv', n: '05', label: 'ELBOW PIVOT', value: 'A3', anchor: 'elbow', side: 'r', at: 0.44 },
      ],
    },
    {
      // RELEASE — wide, low, full extension, the film's last breath.
      id: 'release', light: 'release', lightAt: [0.14, 0.62],
      from: st(372, 1.20, 2.10, [1.70, 1.98, 0], 30), to: st(536, 8.4, 1.10, [1.75, 1.24, 0], 40),
      camEase: 'easeOut',
      pose: [0.88, 1.00], poseAt: [0.04, 0.72],
      pool: { radius: [4.2, 16], floor: 0.03 },
      callouts: [
        { id: 'c-pl', n: '06', label: 'TOOL PLATE', value: '0.000°', anchor: 'plate', side: 'r', at: 0.32 },
      ],
    },
  ],

  record: { station: st(536, 8.6, 1.25, [1.95, 1.26, 0], 40), from: 1.14, floor: 0.60, spinHome: 180 },
  still: st(536, 8.4, 1.10, [1.75, 1.24, 0], 40),
  stillLight: 'release',
  stillCallouts: [{ id: 'c-pl', n: '06', label: 'TOOL PLATE', value: '0.000°', anchor: 'plate', side: 'r', at: 0 }],
};
