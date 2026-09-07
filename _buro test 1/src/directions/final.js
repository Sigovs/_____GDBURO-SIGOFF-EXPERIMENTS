// FINAL — CINEMATIC MACHINE FILM, WITH THE ARGUMENT PUT BACK
//
// ─────────────────────────────────────────────────────────────────────────────
// WHERE THIS CAME FROM
//
// Three directions were built off index1 and reviewed by stopping at eight scroll
// positions each. C carried the only page grammar that survived all eight — one
// callout upper right, one sentence lower left, the same relationship every stop,
// varied by crop and light. B carried the only opening that owned its screen. A
// carried the strongest callout drawing and, on a public page, a figure its own
// ledger had refused. And all three had quietly dropped the device the brief says
// the page exists for.
//
// This direction is C's backbone, B's opening, A's annotation weight, and the
// level line restored as the thing the page is actually about.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE SHOT LIST, AND WHAT EACH ONE IS FOR
//
//   01 open      The designation at 20vw, IN THE ROOM behind the machine, so the
//                arm stands inside its own name. One callout. The level line is
//                introduced as a rule and nothing else — no value, no flag: the
//                page shows you the instrument before it uses it.
//   02 stature   Push in. The height, stated once, as a fact and a consequence.
//                No level line: this shot is about size, and two depth ideas in
//                one view is `DM6`.
//   03 level     THE PEAK (`DNA28`). Lateral dolly, side on, hard raking key.
//                The arm drives C -> D -> E: the flange falls about 1.3 m and
//                every link in the machine rotates. The datum travels with the
//                plate and never tips, and the measured tilt is on screen the
//                whole way. It gets 210vh, the only lateral camera travel, and
//                the only three-decimal number on the page.
//   04 skin      Macro. Material and light only, no line, no number — the
//                silence after the peak rather than an addition to it.
//   05 release   Wide, resolved. The line returns at rest, with its value, and
//                the claim is finally said in words.
//
// Adjacent shots share no distance, no focal length, no pose state and no light.
// The two that move the machine (03, 05) are separated by one that holds it.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT WAS TAKEN OUT, AND WHY
//
//   ±185°           C's ledger records it as considered and REFUSED for want of a
//                   source. It was on direction A's live page. It is not here and
//                   it is not anywhere (`CP1`).
//   the second
//   opening beat    A and C both spent two shots saying the same thing — the
//                   second frame was the first one minus its title. A stage that
//                   delivers no truth the last one did not is a repetition
//                   (`MJ10`), so there is one opening.
//   TOOL PLATE      A callout naming the tool plate and printing 0.000° beside
//   as a callout    the level line is the same fact twice in two devices. The
//                   line owns that number now; the callout is gone.
//   LINKAGE and     Both are in the record. Repeating a measurement in the film
//   OVERALL SPAN    AND the table made the table look like a caption.
//
// Four callouts remain, each naming something no other element names.

const st = (az, r, h, t, fov) => ({ az, r, h, t, fov });

export default {
  id: 'final',
  title: 'KR 700 PA — the level line',

  /* The device this direction exists for. vboot builds it only when this is set,
     so A, B and C are untouched by its existence. */
  level: true,

  camera: { fov: 38, lambda: 2.6 },   // C's slow rig: the camera has weight

  env: {
    ambient: 0x04060a,
    intensity: 1.0,
    panels: [
      { colour: 0x070b10, intensity: 1.0, size: [70, 70], at: [0, -9, 0] },
      { colour: 0xffeed6, intensity: 5.6, size: [3.0, 28], at: [-10, 12, 5] },
      { colour: 0xffd8ae, intensity: 2.2, size: [2.4, 16], at: [9, 6, -8] },
      { colour: 0x27435e, intensity: 1.7, size: [22, 12], at: [11, 2, 8] },
    ],
  },

  material: {
    envMapIntensity: 1.4,
    paint: { r: 0.40, m: 0.08 },
    steel: { r: 0.24, m: 0.97 },
    graphite: { r: 0.56, m: 0.30 },
  },

  hall: {
    colour: 0x2b353d, env: 0.26, fog: [7, 27], fogColour: 0x0a0c0d,
    pool: [3.2, 12], poolFloor: 0.03, aniso: [0.7, 1.0],
    contactDarkness: 2.0, contactOpacity: 0.86,
  },

  light: {
    first: 'cold',
    keyColour: 0xffeeda, fillColour: 0x5f86ab, rimColour: 0xffb877,
    shadowExtent: 17, shadowFar: 46,
    setups: {
      dark:    { key: [-9, 5.0, 2.4, 0.22], fill: [6, -1, 5, 0.03], rim: [3.4, 1.6, -7, 0.70], exposure: 0.38 },
      cold:    { key: [-9, 5.0, 2.4, 1.3], fill: [6, -1, 5, 0.22], rim: [3.4, 1.6, -7, 2.6], exposure: 0.92 },
      dawn:    { key: [-10, 4.2, 2.0, 2.7], fill: [6, -1, 5, 0.42], rim: [3.6, 1.4, -7, 2.8], exposure: 1.04 },
      /*
        THE PEAK'S LIGHT. Hard, raking, almost across the machine, with the fill
        pulled down so the rods cast onto the castings behind them. You are meant
        to be able to see each link turn, which is a lighting problem before it is
        a camera problem (`DNA55`).
      */
      metrol:  { key: [-13, 3.2, 1.0, 4.2], fill: [7, -0.6, 6, 0.30], rim: [5.0, 1.2, -6.5, 3.0], exposure: 1.02 },
      intimate:{ key: [-4, 3.0, 3.0, 4.4], fill: [4, 0.4, 3, 0.46], rim: [2.2, 1.0, -3.4, 3.2], exposure: 1.00 },
      release: { key: [-9, 5.6, 2.4, 3.4], fill: [7, -1.2, 5, 0.82], rim: [3.6, 1.4, -7.4, 2.6], exposure: 1.16 },
    },
  },

  // The cold open: one joint, barely lit, then the hall arrives around it and the
  // designation lands behind the machine.
  intro: { from: st(58, 1.15, 1.30, [0.10, 1.66, 0], 44), light: 'dark', pose: 0.06, duration: 2.6 },

  shots: [
    {
      /*
        01 — THE OPENING.

        The station is chosen against the TYPE, not against the machine: the
        target sits left and low so the arm stands right of centre and well above
        the word's cap-line, and the only thing the two share is the base and its
        shadow. That is what lets 288px of near-white sit on the same screen as a
        lit casting and still measure clean (`color I6`).
      */
      id: 'open', light: 'cold', lightAt: [0, 0.5],
      from: st(72, 8.4, 2.62, [0.10, 1.10, 0], 38), to: st(44, 6.2, 1.74, [-0.10, 1.26, 0], 38),
      pose: [0.10, 0.22], poseAt: [0.15, 0.95],
      pool: { radius: [2.8, 11], floor: 0.02 },
      level: { mode: 'quiet', in: [0.42, 0.72], max: 0.55 },
      callouts: [
        /*
          RIGHT, NOT LEFT. On the left the leader ran from the column up across
          the designation — a 1.8px white rule drawn through 259px of white
          letterform. It costs nothing in contrast and it is still a line through
          the page's own title. The word owns the left two thirds of this screen,
          so the annotation takes the third it does not.
        */
        { id: 'f-col', n: '01', label: 'COLUMN AXIS', value: 'A1', anchor: 'column', side: 'r', at: 0.1 },
      ],
    },
    {
      /* 02 — STATURE. Push in along the view axis; the machine gets bigger and
         the frame does not change what it is looking at. */
      id: 'stature', light: 'dawn', lightAt: [0, 0.42],
      from: st(44, 6.2, 1.74, [-0.10, 1.26, 0], 38), to: st(30, 3.2, 0.80, [0.38, 1.55, 0], 46),
      pose: [0.22, 0.30], poseAt: [0.1, 0.9],
      pool: { radius: [2.3, 9], floor: 0.02 },
      callouts: [
        { id: 'f-h', n: '02', label: 'OVERALL HEIGHT', value: '2 744 mm', anchor: 'top', side: 'r', at: 0.40 },
      ],
    },
    {
      /*
        03 — THE LEVEL LINE. The peak.

        THE FRAMING IS THE PROOF, AND IT IS A HEIGHT PROBLEM RATHER THAN AN ANGLE
        ONE. A world-horizontal line projects to a horizontal screen line when it
        lies on the horizon — that is, when the camera stands at its height. Off
        the horizon it converges toward a vanishing point and picks up a slope, and
        a datum that visibly slopes while the readout says 0.000° is a page arguing
        with itself. Measured on the render, the first cut of this shot drew the
        plate's own axis at 14.7 degrees on screen.

        So the camera RIDES THE FLANGE. Over pose 0.30 -> 0.55 the plate climbs
        1.628 m to 2.334 m (measured from the rig, not from the pose table), and
        the camera goes 0.80 m to 2.28 m, arriving level with it as the sweep
        develops. That window is also the one where every joint turns hard — a2
        through 27 degrees, a3 through 31, a4 through 34 — while the plate's own
        axis barely yaws, so the machine visibly works and the line has something
        to stay parallel to.

        The camera starts first and the arm finishes first (poseAt 0.30..0.86), so
        the two read as one mechanism rather than as a machine being filmed. And
        the instrument itself only arrives at 0.30, once the camera has reached the
        height where it can tell the truth.
      */
      id: 'level', light: 'metrol', lightAt: [0.02, 0.34],
      from: st(30, 3.2, 0.80, [0.38, 1.55, 0], 46), to: st(-24, 6.0, 2.28, [1.16, 1.94, 0], 33),
      pose: [0.30, 0.55], poseAt: [0.30, 0.86],
      pool: { radius: [3.4, 13], floor: 0.03 },
      level: { mode: 'proof', in: [0.30, 0.46] },
      callouts: [
        { id: 'f-cl', n: '03', label: 'CLOSED LOOPS', value: '2', anchor: 'loops', side: 'r', at: 0.06 },
      ],
    },
    {
      /*
        04 — SKIN. The silence after the peak.

        A macro shows one detail at a scale the eye cannot get in person. At 1.22 m
        with a 30-degree lens this shot showed no detail at all — the casting filled
        the frame edge to edge as a flat orange field with no silhouette, no edge and
        nothing to read, which is a lens against a wall rather than a macro
        (`DNA50`). Pulled back to where the elbow, the tie rod and the flange are all
        in frame and the light can rake across them.
      */
      id: 'skin', light: 'intimate', lightAt: [0, 0.34],
      from: st(-24, 6.0, 2.28, [1.16, 1.94, 0], 33), to: st(-84, 3.15, 2.06, [1.22, 1.74, 0], 36),
      camEase: 'hold',
      pose: [0.55, 0.62], poseAt: [0, 0.62],
      pool: { radius: [2.5, 9], floor: 0.03 },
      callouts: [
        { id: 'f-pv', n: '04', label: 'ELBOW PIVOT', value: 'A3', anchor: 'elbow', side: 'r', at: 0.42 },
      ],
    },
    {
      /* 05 — RELEASE. Wide, low, resolved, the line back at rest under the claim. */
      id: 'release', light: 'release', lightAt: [0.12, 0.60],
      from: st(-84, 3.15, 2.06, [1.22, 1.74, 0], 36), to: st(34, 8.2, 1.10, [1.66, 1.24, 0], 40),
      camEase: 'easeOut',
      pose: [0.62, 1.00], poseAt: [0.04, 0.70],
      pool: { radius: [4.2, 16], floor: 0.03 },
      level: { mode: 'proof', in: [0.46, 0.72], max: 0.9 },
      callouts: [],
    },
  ],

  /*
    THE RECORD KEEPS THE MACHINE, ON THE SIDE THE TABLE IS NOT.

    Floored at 0.60 the subject went to a shadow and `Drag to rotate` pointed at
    nothing (`DM7`); centred, it sat behind the figures. The camera looks left of
    the column so the machine stands in the right half, which is also the half the
    orbit surface occupies.
  */
  record: { station: st(52, 7.0, 1.32, [-0.85, 1.30, 0], 40), from: 1.16, floor: 0.9, spinHome: 180 },

  /* The reduced-motion still is the peak's own frame, not the last one: the
     measurement is the page, so the visitor who cannot have the choreography is
     given the moment the choreography was for (`DM4`). */
  still: st(-14, 5.7, 2.14, [1.08, 1.86, 0], 34),
  stillPose: 0.48,
  stillLight: 'metrol',
  stillCallouts: [{ id: 'f-cl', n: '03', label: 'CLOSED LOOPS', value: '2', anchor: 'loops', side: 'r', at: 0 }],
  stillLevel: { mode: 'proof', at: 1 },
};
