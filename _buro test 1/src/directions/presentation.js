// PRESENTATION — the company around the machine
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT THIS IS, AND WHAT IT INHERITS
//
// `final` is a five-shot film about one palletiser. It is the strongest thing in
// this project and every camera decision below that concerns the MACHINE is its
// decision, unchanged: the cold open on a joint, the opening station composed
// against the designation rather than against the arm, and — the reason the page
// exists — the metrology shot, where the camera climbs to the flange's own height
// so a world-horizontal datum projects horizontal and the measurement can be
// believed.
//
// What is added here is a COMPANY. Buro Automation is a simulated firm; the
// machine and its figures are not. That split is the whole content rule of this
// direction and it is enforced in two places: the record still prints only what
// was measured off the file, and the callouts still name only features the rig
// can resolve. Everything invented is qualitative and reads as positioning.
//
// ─────────────────────────────────────────────────────────────────────────────
// PACING IS THE POINT — THE STAGE IS NOT ALWAYS THE SUBJECT
//
// A film has five shots and every viewport is the machine. A presentation cannot
// be that, and answering it by scrolling more copy past the same shot is how a
// 3D demo ends up with paragraphs in front of it. So the STAGE ITSELF changes
// register, chapter by chapter, and the camera never restarts:
//
//   01 arrival      FULL      wide, the designation, the position stated once
//   02 proof        FULL      the peak: four axes drive, the plate does not tilt
//   03 systems      VEILED    the machine keeps drifting, dimmed; copy takes over
//   04 family       WINDOW    the stage is clipped into a tall render window and
//                             the class list owns the other half of the screen
//   05 engineering  FULL      macro, and the two strongest callouts on the page
//   06 motion       FILM      the render recedes and real footage takes the frame
//   07 industries   QUIET     the camera pulls to nine metres; the machine becomes
//                             atmosphere behind a large typographic list
//   08 integration  LOW       a held frame under a five-step sequence
//   09 resolution   FULL      wide, resolved, the datum back at rest, one CTA
//
// Adjacent chapters share no distance, no focal length and no light. The three
// that move the arm hard (02, 05, 08) are separated by ones that hold it, so the
// articulation reads as an event rather than as a loop.
//
// The azimuth runs 72° -> -406°: 478 degrees of continuous travel, one take.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE ANNOTATION BUDGET
//
// Five callouts and the level line, across roughly thirteen viewport-heights.
// The brief that produced this direction asked for four to eight MEMORABLE
// moments rather than dozens of labels, which is also what the callout plate is
// now built for — at this weight, a sixth would be noise before it was
// information. Each names something no other element on the page names:
//
//   01 COLUMN AXIS      A1        the axis the whole machine turns on
//   02 OVERALL HEIGHT   2 744 mm  measured, and in the record
//   03 CLOSED LOOPS     2         the mechanism the proof depends on
//   04 ELBOW PIVOT      A3        the joint the macro is looking at
//   05 SHOULDER         A2        the joint the load is first felt in
//
// 0.000° is NOT a callout. The level line owns that number, reads it off the live
// rig every frame, and printing it twice in two devices would make the
// measurement look like a caption.

const st = (az, r, h, t, fov) => ({ az, r, h, t, fov });

export default {
  id: 'presentation',
  title: 'Buro Automation — engineering motion at industrial scale',

  /*
    THE LEVEL LINE IS THE PROOF, AND IT IS NOT A CALLOUT.

    It was switched off during the legacy-annotation cleanup, which was wrong:
    the drafting CALLOUTS were the second language, the datum never was. This is
    the device the page is built to show — the arm articulates, the camera
    travels, and a world-horizontal line stays horizontal against the tool
    plate's own axis. A card cannot do that. The card EXPLAINS the proof; the
    line IS the proof, and only the shot that needs it turns it on.

    What does not come back is the floating value plate it used to hang off
    itself. See dir-presentation.css: hairline, no panel, the figure set small
    and cool beside the plate it measures.
  */
  level: true,
  camera: { fov: 38, lambda: 2.6 },

  /*
    THE ANNOTATION LANGUAGE, AND ITS ART DIRECTION.

    Every callout below carries `place: { dx, dy }` — an authored offset from its
    own anchor to the card's anchor-side edge. These are composition decisions
    made per shot, not runtime ones: site/vcards.js honours them and does not
    search. Each sits in the 246–340px band — opened up about a seventh from the first
    cut, which was correct but a little compressed. No leader crosses the frame.
  */
  callout: { card: true },

  /*
    ENVIRONMENT. `final`'s panels, cooled.

    The blue panel at [11, 2, 8] is lifted from 1.7 to 2.3 and the warm bounce
    from the right is pulled back, because this direction gives the UI layer the
    steel blue and the machine keeps the orange. If the room itself stays as warm
    as the casting, the two never separate and the page reads monochrome — which
    is the thing this direction was made to stop.
  */
  env: {
    ambient: 0x04070b,
    intensity: 1.0,
    panels: [
      { colour: 0x06090e, intensity: 1.0, size: [70, 70], at: [0, -9, 0] },
      { colour: 0xffeed6, intensity: 5.4, size: [3.0, 28], at: [-10, 12, 5] },
      { colour: 0xffd8ae, intensity: 1.7, size: [2.4, 16], at: [9, 6, -8] },
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
    colour: 0x28323b, env: 0.26, fog: [7, 28], fogColour: 0x07090b,
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
      /*
        THE PEAK'S LIGHT — `final`'s, unchanged. Hard, raking, almost across the
        machine, fill pulled down so the rods cast onto the castings behind them.
        You have to be able to watch each link turn, which is a lighting problem
        before it is a camera problem.
      */
      metrol:  { key: [-13, 3.2, 1.0, 4.2], fill: [7, -0.6, 6, 0.30], rim: [5.0, 1.2, -6.5, 3.0], exposure: 1.02 },
      // 03 — the machine is behind the copy: cool, even, and one stop down.
      hall:    { key: [-11, 5.2, 3.0, 2.0], fill: [7, -1, 6, 0.34], rim: [4.0, 1.6, -7, 2.2], exposure: 0.84 },
      // 04 — the window wants a SILHOUETTE, so the rim does the work and the key
      //      only just separates the castings from the ground.
      edge:    { key: [-14, 2.6, 0.8, 3.6], fill: [6, -0.8, 5, 0.22], rim: [6.0, 1.4, -5.0, 4.6], exposure: 1.04 },
      intimate:{ key: [-4, 3.0, 3.0, 4.4], fill: [4, 0.4, 3, 0.46], rim: [2.2, 1.0, -3.4, 3.2], exposure: 1.00 },
      // 06 — nine metres out and dim. The machine is scenery in this chapter and
      //      the light says so before the veil does.
      far:     { key: [-9, 6.4, 3.4, 1.6], fill: [7, -1, 6, 0.24], rim: [3.6, 1.8, -8, 1.9], exposure: 0.72 },
      dawn:    { key: [-10, 4.2, 2.0, 2.7], fill: [6, -1, 5, 0.42], rim: [3.6, 1.4, -7, 2.8], exposure: 0.96 },
      release: { key: [-9, 5.6, 2.4, 3.4], fill: [7, -1.2, 5, 0.42], rim: [3.6, 1.4, -7.4, 2.6], exposure: 1.16 },
    },
  },

  // The cold open: one joint, barely lit, then the hall arrives around it and the
  // designation lands behind the machine.
  intro: { from: st(58, 1.15, 1.30, [0.10, 1.66, 0], 44), light: 'dark', pose: 0.06, duration: 2.6 },

  shots: [
    {
      /*
        01 — ARRIVAL.

        `final`'s opening station and its push-in, joined into one chapter. The
        wide frame is composed against the TYPE, not the machine: the target sits
        left and low so the arm stands right of centre and well above the word's
        cap-line, and the two overlap only across the base and its shadow — dark
        ground, where 288px of near-white measures clean.

        Then it pushes to three metres as the designation leaves, and the height
        callout lands on the closed frame. Two things happen in one chapter and
        neither waits for the other.
      */
      id: 'arrival', light: 'cold', lightAt: [0, 0.5],
      from: st(72, 7.5, 2.38, [0.10, 1.14, 0], 38), to: st(30, 3.2, 0.80, [0.38, 1.55, 0], 46),
      pose: [0.10, 0.30], poseAt: [0.15, 0.95],
      pool: { radius: [2.8, 11], floor: 0.02 },
      level: { mode: 'quiet', in: [0.18, 0.30], max: 0.45 },
      callouts: [
        /* OPPOSITE MARGINS. Both of these sat on the right and both leaders then
           swept the full width of the frame to reach features that are nowhere
           near that edge — two stacked plates and two lines across the machine.
           The column is the lower, nearer feature and takes the left; the top of
           the machine takes the right, above the designation's own band. The
           solver enforces the split (SPREAD_COST) and charges for leader length,
           so these are the authored intent rather than a hard assignment. */
        { id: 'p-col', n: '01', label: 'Column axis', value: 'A1', anchor: 'column', side: 'l', at: 0.02, span: 0.09,
          /* upper-left of the column: the designation owns the lower half of this
           frame and the machine stands right of centre, so the card takes the
           quiet air ABOVE the word — at dy -120 the card landed on the designation
           itself. 314px, which is the one placement on the page that needs the
           upper end of the band. */
          place: { dx: -248, dy: -232 }, width: 244,
          note: 'The axis the whole machine turns on.' },
        { id: 'p-h', n: '02', label: 'Overall height', value: '2 744 mm', anchor: 'top', side: 'r', at: 0.14, span: 0.09,
          /* right and slightly BELOW the highest point — above it is the masthead
           band, and a card that has to be nudged down is a card drawn twice. 215px. */
          place: { dx: 228, dy: 92 }, width: 252,
          note: 'Measured off the source file, not quoted.' },
      ],
    },
    {
      /*
        02 — THE PROOF. The peak, and `final`'s shot verbatim.

        A world-horizontal line projects to a horizontal SCREEN line only when the
        camera stands at its height; off the horizon it converges and picks up a
        slope, and a datum that visibly slopes while the readout says 0.000° is a
        page arguing with itself. So the camera RIDES THE FLANGE: over pose
        0.30 -> 0.55 the plate climbs to 2.334 m and the camera goes 0.80 -> 2.28,
        arriving level with it as the sweep develops. That window is also where
        every joint turns hard, so the machine visibly works and the line has
        something to stay parallel to.

        The camera starts first and the arm finishes first, so the two read as one
        mechanism rather than as a machine being filmed.
      */
      id: 'proof', light: 'metrol', lightAt: [0.02, 0.34],
      from: st(30, 3.2, 0.80, [0.38, 1.55, 0], 46), to: st(-24, 6.0, 2.28, [1.16, 1.94, 0], 33),
      pose: [0.30, 0.55], poseAt: [0.30, 0.86],
      pool: { radius: [3.4, 13], floor: 0.03 },
      /* the figure arrives early in the beat, not two thirds through it: the
         proof is the whole point of this chapter and it should be readable for
         most of the travel, not only at the end of it */
      level: { mode: 'proof', in: [0.08, 0.22] },
      callouts: [
        /* BANDED AWAY FROM THE TOP EDGE. At its own feature's height the plate
           landed at the solver's ceiling — cut box top 108px, hard against the
           masthead band, which reads as a label that ran out of room rather
           than one that was placed. */
        /* 06 — the figure the level line used to draw. Lower-right of the plate,
           into the open floor under the arm. 232px. */
        { id: 'p-tilt', n: '06', label: 'Plate tilt', live: 'tilt', anchor: 'plate', at: 0.24, span: 0.12,
          note: 'Worst elevation of the tool plate across the full range of the arm.',
          place: { dx: 228, dy: 135 }, width: 246 },
        { id: 'p-cl', n: '03', label: 'Closed loops', value: '2', anchor: 'loops', side: 'r', at: 0.03, span: 0.11,
          /* upper-left of the wrist. The proof shot puts the arm across the lower
           right, so the open quarter is up and left of the linkage. 239px. */
          place: { dx: -245, dy: -120 }, width: 250,
          note: 'The linkage that holds the plate’s attitude.' },
      ],
    },
    {
      /*
        03 — SYSTEMS. The first chapter the machine does not own.

        The camera keeps travelling — a slow lateral drift, no push, no pull —
        and the arm holds almost still. That is deliberate: this chapter's job is
        to be a BACKGROUND, and a background that keeps changing distance pulls
        the eye off the copy in front of it. The page veils the stage from the
        sheet; the light and the pose make the veil believable rather than a grey
        sheet dropped over a picture.
      */
      id: 'systems', light: 'hall', lightAt: [0, 0.42],
      /* Carried LEFT and brought in from 8.6m to 6.9m: the machine now stands in
         the right third the panel leaves free, at a size that reads, instead of
         sitting small and centred under the register's own copy. */
      from: st(-24, 5.6, 2.20, [-0.46, 1.90, 0], 33), to: st(-70, 6.9, 1.86, [-0.86, 1.50, 0], 32),
      camEase: 'easeOut',
      pose: [0.55, 0.60], poseAt: [0.1, 0.9],
      pool: { radius: [3.6, 14], floor: 0.03 },
      callouts: [],
    },
    {
      /*
        04 — FAMILY. The stage becomes a render window.

        The sheet clips the canvas to a tall panel on the right; the camera closes
        to five metres and the rim light comes up so what stands inside that panel
        is a SILHOUETTE with an edge on it. A cropped render in a frame is a
        product-family device that costs no second model — and the one class the
        page can actually evidence, HEAVY, is the one the machine in the window
        belongs to.
      */
      id: 'family', light: 'edge', lightAt: [0.05, 0.45],
      from: st(-70, 6.9, 1.86, [-0.86, 1.50, 0], 32), to: st(-128, 5.8, 1.34, [0.55, 1.46, 0], 30),
      pose: [0.60, 0.72], poseAt: [0.08, 0.88],
      pool: { radius: [3.0, 11], floor: 0.03 },
      callouts: [],
    },
    {
      /*
        05 — ENGINEERING. Macro, and the heaviest annotation on the page.

        Pulled back far enough that the elbow, the tie rod and the flange are all
        in frame and the light can rake across them — at a metre with a long lens
        the casting fills the frame as a flat orange field with no silhouette and
        nothing to read, which is a lens against a wall rather than a macro.

        Two callouts, on opposite sides, naming the two joints the shot is of.
      */
      id: 'engineering', light: 'intimate', lightAt: [0, 0.34],
      from: st(-128, 5.8, 1.34, [0.55, 1.46, 0], 30), to: st(-186, 2.9, 2.02, [1.18, 1.78, 0], 36),
      camEase: 'hold',
      pose: [0.72, 0.80], poseAt: [0, 0.62],
      pool: { radius: [2.5, 9], floor: 0.03 },
      /*
        THE CUES ARE INSIDE THE COMPOSED WINDOW, WHICH IS NOT THE SHOT.

        A shot's progress runs the whole section; the part a visitor can actually
        SEE is the pinned window, `(h - 100vh) / h`. This chapter is 170vh, so
        that window is the first 0.41 of the shot — and these two were authored at
        0.30 and 0.34, which land at 73% and 83% of the visible travel. Measured:
        the elbow callout only began drawing in the last quarter of the frame and
        the tool plate never appeared at all, on the one chapter the page builds
        up to as its heaviest annotation.
      */
      callouts: [
        { id: 'p-pv', n: '04', label: 'Elbow pivot', value: 'A3', anchor: 'elbow', side: 'r', at: 0.03, span: 0.10,
          /* upper-right of the elbow, into the dark above the casting. 224px. */
          place: { dx: 222, dy: -126 }, width: 258,
          note: 'Hinge centre derived from the geometry, not approximated.' },
        /* THE SECOND CALLOUT NAMES SOMETHING THIS FRAME CONTAINS. The tool plate
           projects between x = -150 and x = -23 for the WHOLE of this chapter —
           off the left edge, every frame — so the annotation was correctly
           suppressed and the chapter simply had one callout. The shoulder is in
           frame throughout (x 641 -> 1136) and low, so the pair opens on a
           diagonal: A3 top-right, A2 bottom-left. The tool plate is not lost —
           the level line draws its datum and the record names it on the dot. */
        { id: 'p-tp', n: '05', label: 'Shoulder', value: 'A2', anchor: 'shoulder', side: 'l', at: 0.15, span: 0.10,
          /* upper-right of the shoulder. Below-left put it on the chapter's own
           sub-line; the open air in this frame is up and out. 225px. */
          place: { dx: 217, dy: -137 }, width: 236,
          note: 'The first joint the load is felt in.' },
      ],
    },
    {
      /*
        06 — MOTION. The one chapter the stage does not appear in.

        Everything before this frame is a single machine, reconstructed and
        measured, that never actually does any work. So the page stops showing
        its own render for one beat and shows FOOTAGE instead — real arms,
        moving, under real light — and then goes quiet again. It is the only
        evidence on the page that the class of machine being described exists
        outside this file.

        THE CAMERA ALL BUT STOPS, BECAUSE IT IS THE THING BEING OVERLAID.

        The plate is inset, so the macro shot is visible as a live border on all
        four sides for the whole beat. That border is the PREVIOUS chapter, and a
        border that travels while a film plays inside it gives two moving
        subjects at once. So the station barely leaves where 05 finished — six
        degrees and twenty centimetres across two viewport-heights, enough that
        the frame is alive and not enough to compete — and 07 opens from exactly
        where this ends.
      */
      id: 'motion', light: 'intimate', lightAt: [0, 0.4],
      from: st(-186, 2.9, 2.02, [1.18, 1.78, 0], 36), to: st(-192, 3.1, 2.04, [1.14, 1.76, 0], 36),
      camEase: 'hold',
      pose: [0.80, 0.80], poseAt: [0, 1],
      pool: { radius: [3.0, 11], floor: 0.03 },
      callouts: [],
    },
    {
      /*
        07 — INDUSTRIES. The quiet one.

        Nine metres, dim, and the machine sits small and low in a large dark
        frame. This is the only chapter where the subject is deliberately too far
        away to read detail on, and it is placed after the film for that reason —
        footage, then silence, is the widest tonal jump on the page.
      */
      id: 'industries', light: 'far', lightAt: [0.05, 0.5],
      /* ends at 6.8m rather than 8.3m: the chapter after this one inherits the
         station, and at 8.3 the machine arrived there with no presence at all */
      from: st(-192, 3.1, 2.04, [1.14, 1.76, 0], 36), to: st(-250, 6.8, 1.92, [0.28, 1.62, 0], 34),
      camEase: 'easeOut',
      pose: [0.80, 0.86], poseAt: [0.1, 0.9],
      pool: { radius: [4.6, 17], floor: 0.04 },
      callouts: [],
    },
    {
      /* 07 — INTEGRATION. A held frame under a five-step sequence: the camera
         moves least here of anywhere on the page, because the content is a list
         and a list wants a stable ground. */
      id: 'integration', light: 'dawn', lightAt: [0, 0.5],
      /* THE MACHINE HAS TO BE BIG ENOUGH TO BE BEHIND SOMETHING. At 7.6 metres it
         was a small figure in the middle of the frame with a headline above it and
         a step row below — present, but not the subject of anything. Closer and
         carried right, it fills the space the copy leaves and the chapter becomes
         a held frame with a list over it rather than a list with scenery. */
      from: st(-250, 6.8, 1.92, [0.28, 1.62, 0], 34), to: st(-292, 5.9, 1.44, [0.42, 1.56, 0], 36),
      pose: [0.86, 0.92], poseAt: [0.1, 0.9],
      pool: { radius: [4.0, 15], floor: 0.03 },
      callouts: [],
    },
    {
      /*
        09 — RESOLUTION. The last composed frame, and it has to close the page.

        It was ending at 8.2 metres with the target pushed right, which put the
        machine small and CENTRED — at the same height as the claim, competing
        with it, in a frame with a third of its area dead black above the type.
        That reads as a footer after the interesting part, not as a conclusion.

        It now closes at 5.6 metres with the target carried left and up: the
        machine comes forward, stands to the RIGHT of the claim and above it, and
        the type takes the bottom-left corner it was already reaching for. Same
        azimuth, so the 478-degree take still ends where the record picks it up.
      */
      id: 'resolution', light: 'release', lightAt: [0.12, 0.58],
      /*
        THE TARGET IS CARRIED LEFT ALL THE WAY OUT.

        The azimuth sweeps 114 degrees across this chapter, which swung the arm
        back into the claim: composed at the top of the window it was clean, and
        three quarters through, the headline was running across the lower arm with
        "BEGINNING." sitting on the base. Ending with the target at -0.35 holds the
        machine on the right for the whole travel, so the bottom-left belongs to
        the type on every frame of it and not only the first ones.
      */
      from: st(-292, 5.9, 1.44, [0.42, 1.56, 0], 36), to: st(-406, 5.6, 1.06, [-0.35, 1.66, 0], 38),
      camEase: 'easeOut',
      pose: [0.92, 1.00], poseAt: [0.04, 0.70],
      pool: { radius: [4.2, 16], floor: 0.03 },
      /*
        NO DATUM ON THE CLOSING FRAME.

        The level line was drawing edge to edge at the claim's own cap height and
        cutting the headline in half. It is the measurement chapter's instrument;
        on the last screen it measures nothing and is simply a rule through the
        page's final sentence.
      */
      callouts: [],
    },
  ],

  /* The record keeps the machine, on the side the table is not: the camera looks
     left of the column so the machine stands in the right half, which is also the
     half the orbit surface occupies. */
  /*
    THE RECORD'S FRAME, MOVED OFF THE TABLE.

    Measured on the render at this station: the wrist projected to x 568 while the
    reading column runs to 672, so the machine's own flange was lying across the
    middle rows of the measurements. Shifting the target along the view's
    screen-right axis moves the whole machine about 170px clear — the table gets
    its column back, and the tool plate comes out from behind it, which is also
    the one anchor the last screen's navigation could not reach.
  */
  /*
    THE MACHINE IS CENTRED IN THE ROOM THE PANEL LEAVES IT.

    Measured on the render at three widths, the arm's box reached across the
    record's own column at 16:10 and sat left of centre everywhere else. The
    correction is one shift along the view's screen-right axis, and it turns out
    to be the SAME 0.56 m at every aspect — the panel keeps a near-constant width
    in pixels while the metres-per-pixel scales with height, and the two cancel.
    So it is a constant here rather than a runtime fit:

      1512x945   centre 937 -> 1038, free area 609..1468, centred
      1974x1003  centre 1176 -> 1281, free area 633..1930, centred
      2560x1400  centre 1408 -> 1575, free area 634..2516, centred
  */
  /*
    THE LAST SCREEN OPENS IN PROFILE.

    At the inherited 180° home the machine faced the camera three-quarters from
    behind: the parallelogram collapsed into itself, the tie-rods crossed, and the
    arm read as a mass rather than as a linkage. The record screen is the one
    place a visitor can study the machine, so what it opens on has to be the view
    that EXPLAINS it — the plane of motion parallel to the screen, the arm out to
    the left, the closed loops legible as two loops.

    THE ANGLE IS SOLVED, NOT EYEBALLED. A side view is a geometric condition:
    the arm's plane of motion has to be exactly perpendicular to the view axis.
    So it is measured rather than judged — the horizontal reach vector (column to
    flange) against the camera's own horizontal forward, read off the live rig:

      spin 135°   reach at 96.6° to the view axis   ->  6.6° of residual angle
      spin 128.4° reach at 90.0° to the view axis   ->  true elevation

    The camera is already level with the machine's middle (h 1.32 against a target
    at 1.30), so there is no vertical angle left to remove either.

    The drag still owns the machine from there; this is only where it starts.
  */
  /*
    AND IT COMES FORWARD, BECAUSE AT SEVEN METRES IT WAS A PRODUCT SHOT.

    Measured on the render at the old station: the machine's projected box ran
    x 684..1468, y 148..784 in a 1512x945 frame — inside the frame on all four
    sides, 44px clear of the right edge, 161px clear of the floor. Nothing
    touched, nothing left, nothing cropped. That is a catalogue photograph of a
    robot placed next to a table of figures, and on the page's LAST screen it
    read as the 3D subject withdrawing so the UI could have the frame.

    At 5.5m with the eye line carried up to 1.68 the same box runs x 717..1710,
    y 157..1030:

      · the machine crops 198px off the right edge and 85px off the floor, so it
        is standing IN the room rather than photographed against it
      · 105px of air still separates it from the reading column, which is more
        clearance than it had before
      · 157px of headroom, so the arm's top is composed and not decapitated
      · the FLANGE lands at 856,600 — in the open half, low and left of the
        machine's mass, which makes the wrist the focal point of the frame
        instead of the base

    THE VIEW IS STILL LEVEL. The eye rises from 1.32 to 1.68 and the target
    rises with it by exactly the same amount, so there is no vertical tilt
    introduced — this is a higher station, not a raised angle. The azimuth is
    untouched, so the solved side view (the arm's plane of motion perpendicular
    to the view axis, measured, not judged) survives the recomposition intact.

    All five anchors stay inside the dot layer's own visibility window
    (x 44..1468, y 96..901): flange 856,600 · elbow 1157,399 · shoulder
    1297,644 · column 1389,739 · base 1389,816.
  */
  /*
    AND IT IS CENTRED IN THE SCREEN, NOT COMPOSED AGAINST THE COLUMN.

    The previous station carried the machine to the right of the reading panel
    and cropped it off the right edge — measured, its projected box ran
    x 717..1719 in a 1512-wide frame, so its centre sat at 1218 against a
    viewport centre of 756 and a fifth of it was outside the picture. That is a
    subject pushed aside to leave room for a table, and on the one screen where
    the machine can be TURNED it should be the thing the screen is about.

    The target is carried 2.063m along the view's own screen-right axis, which
    is the offset that puts the projected centre on 756 exactly. The machine now
    runs x 281..1229 — whole, horizontally centred, still cropping 85px off the
    floor so it stands in the room rather than floating in it.

    THE SIDE VIEW IS NOW EXACT, AND IT IS SOLVED RATHER THAN JUDGED.

    A side view is a geometric condition: the arm's plane of motion perpendicular
    to the view axis. Measured on the live rig — the horizontal reach vector,
    column to flange, against the camera's own horizontal forward — the inherited
    128.4 was reading 90.464°, half a degree off true and enough to open the
    parallelogram slightly. Bisected on the live geometry:

      spin 128.400   reach at 90.464° to the view axis   0.464° of residual
      spin 127.936   reach at 90.000° to the view axis   true profile

    The camera is level (eye 1.68 against a target at 1.68), so there is no
    vertical angle left to remove either. The drag still owns the machine from
    there; this is only where it starts.

    WHAT CENTRING COSTS, MEASURED RATHER THAN GUESSED.

    The reading column occupies x 43..612 — the left 40% of the frame — and a
    machine 947px wide centred on 756 necessarily runs from 282, so about a third
    of it stands behind that column. Three arrangements were rendered and
    measured before this one was kept:

      centred, arm left (this)   anchors visible 4/5 — the flange goes behind
      centred, arm right (+180)  anchors visible 2/5 — column and base go behind
      off-centre right (before)  anchors visible 5/5 — but centre at 1218 and
                                 207px of the machine cropped off the right edge

    The +180 variant holds the side view exactly — perpendicularity survives a
    half turn — and puts the wrist in the clear, but it hides the pedestal AND
    the shoulder, which is a worse trade than hiding one flange.

    To get 5/5 back with the machine still centred, the reading column has to
    give up width; nothing about the camera can buy it.
  */
  record: { station: st(-388, 5.5, 1.68, [-0.909, 1.68, -0.026], 40), from: 1.16, floor: 0.9, spinHome: 127.936 },

  /* Reduced motion is given the peak's own frame, not the last one: the
     measurement is what the page is for, so the visitor who cannot have the
     choreography is given the moment the choreography was built for. */
  still: st(-14, 5.7, 2.14, [1.08, 1.86, 0], 34),
  stillPose: 0.48,
  stillLight: 'metrol',
  stillCallouts: [{ id: 'p-cl', n: '03', label: 'Closed loops', value: '2', anchor: 'loops', side: 'r', at: 0,
    note: 'The linkage that holds the plate’s attitude.' }],
  stillLevel: { mode: 'proof', at: 1 },
};
