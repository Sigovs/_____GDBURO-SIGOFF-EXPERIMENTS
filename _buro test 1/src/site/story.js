// The shot list — INDEX1 · KR 700 PA
//
// DNA53: scroll sets a TARGET, damping moves the camera. Nothing here writes
// camera.position, which is what makes a stopped scroll settle onto a composed
// frame instead of freezing mid-jitter.
//
// CAMERA COVERAGE IS THE ORGANISING IDEA, and it is written in polar terms
// rather than as xyz triples so it can actually be audited. Azimuth is measured
// from +Z and rotates toward +X, so for a machine whose arm extends along +X:
//
//     0deg   side profile, arm to the right
//    90deg   head on, looking back down the arm from the tool
//   180deg   the opposite side profile, arm to the left
//   270deg   from behind the column, the balance linkage nearest
//
// The journey runs 66 -> 40 -> 18 -> 196 -> 268 -> 328 -> 372 -> 545 degrees, so
// the visitor sees the machine from a front three-quarter, the near side, the far
// side, the rear, from above, from a joint's distance, and finally from a hero
// angle ~150deg round from where they started. About 530deg of travel.
//
// It is NOT an orbit. Every leg has its own radius, height, focal length, target
// and speed, and two of the six barely rotate at all. A constant-rate circle
// around a subject is a turntable with extra steps (DNA49).

import { gsap, ScrollTrigger } from '../motion/context.js';

const V = (x, y, z) => ({ x, y, z });
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeIn = (t) => t * t * t;
/** Maps a sub-range of a shot's progress to 0..1, for offsetting choreography. */
const span = (p, a, b) => clamp01((p - a) / (b - a));

const RAD = Math.PI / 180;

/** A camera station: where it stands, what it looks at, and how tight the lens is. */
const at = (azimuth, radius, height, target, fov) => ({ azimuth, radius, height, target, fov });

/** Polar station -> the world position the rig damps toward. */
export function place(station) {
  const a = station.azimuth * RAD;
  return {
    position: {
      x: station.target.x + Math.sin(a) * station.radius,
      y: station.height,
      z: station.target.z + Math.cos(a) * station.radius,
    },
    target: station.target,
    fov: station.fov,
  };
}

/** The polar blend, before it is turned into world space. */
export function mixStation(from, to, t) {
  return {
    azimuth: lerp(from.azimuth, to.azimuth, t),
    radius: lerp(from.radius, to.radius, t),
    height: lerp(from.height, to.height, t),
    fov: lerp(from.fov, to.fov, t),
    target: {
      x: lerp(from.target.x, to.target.x, t),
      y: lerp(from.target.y, to.target.y, t),
      z: lerp(from.target.z, to.target.z, t),
    },
  };
}

export function blendStations(from, to, t) {
  return place({
    azimuth: lerp(from.azimuth, to.azimuth, t),
    radius: lerp(from.radius, to.radius, t),
    height: lerp(from.height, to.height, t),
    fov: lerp(from.fov, to.fov, t),
    target: {
      x: lerp(from.target.x, to.target.x, t),
      y: lerp(from.target.y, to.target.y, t),
      z: lerp(from.target.z, to.target.z, t),
    },
  });
}

/* ── the stations ────────────────────────────────────────────────────────── */

// Where the intro begins: front three-quarter, high and far, almost unlit.
export const OPEN = at(66, 7.10, 2.35, V(0.78, 1.42, 0), 34);

const SHOTS = {
  // 01 — low, close, cropped. The camera is BELOW the shoulder looking up, which
  // is the angle that makes a 2.7m machine read as something you stand under.
  impact: {
    trigger: '#impact',
    from: at(40, 3.30, 0.95, V(0.30, 1.45, 0), 46),
    to:   at(18, 2.70, 0.72, V(0.42, 1.55, 0), 48),
    // 0.12 is where the OPENING leaves the arm (POSE_END in intro.js). These two
    // must stay equal or the first scroll snaps the arm back out of the position
    // the opening just moved it into.
    pose: { from: 0.12, to: 0.20, at: [0.15, 0.95] },
    light: 'sculpt',
    lightAt: [0.00, 0.30],
    // Tight bay: the crop is close and the floor is mostly foreground.
    pool: { radius: [2.2, 8.0], floor: 0.035 },
  },

  // 02 — all the way round to the far side, and wide.
  //
  // The station was 15.0 at h 3.30, then 24.0 at h 6.40, and 24 was too far: the
  // machine set to about an eighth of the frame width and the shot's own claim —
  // 2 744 mm, standing still — cannot be read off a subject that small. 20.0 at
  // h 5.60 is the width that is clearly wider than it was and still a
  // composition rather than a speck in a field. Measured in the render, twice. The biggest single change
  // of frame on the page: 178deg of travel and 2.7m -> 15m in one shot.
  scale: {
    trigger: '#scale',
    from: at(18, 2.70, 0.72, V(0.42, 1.55, 0), 48),
    /*
      IN, AND DOWN TO NEAR EYE LEVEL.

      It stood at 11 m and 3.8 m high, which put the horizon above the machine and
      the machine at about a quarter of the frame. That was survivable while the
      background was an empty void — there was nothing for it to be small against.
      With a floor under it the same station reads as a plan view of a small
      object, and the shot whose whole claim is 2 744 mm cannot afford that.

      7.6 m at 2.05 m puts the camera near standing height, so the HORIZON PASSES
      BEHIND THE MACHINE rather than above it. That single relationship is what
      turns a floor into a room, and it is the reason this station moved.
    */
    to:   at(103, 6.20, 1.95, V(0.35, 1.24, 0), 42),
    // Opens fast then holds: the negative space is the composition, and it only
    // becomes one once the travel has stopped.
    camEase: easeOut,
    pose: { from: 0.20, to: 0.34, at: [0.18, 0.92] },
    light: 'clean',
    lightAt: [0.12, 0.58],
    // The widest field on the page, so the bay opens with it.
    pool: { radius: [3.4, 13.0], floor: 0.045 },
  },

  // 03 — rear three-quarter. The balance linkage and the rear rod are nearest
  // the camera here, which is the only angle where the mechanism reads as a
  // mechanism rather than as a silhouette.
  rear: {
    trigger: '#rear',
    from: at(103, 6.20, 1.95, V(0.35, 1.24, 0), 42),   // = scale.to; the journey is continuous
    to:   at(250, 4.30, 1.55, V(0.30, 1.80, 0), 38),
    pose: { from: 0.34, to: 0.60, at: [0.05, 0.88] },
    light: 'side',
    lightAt: [0.04, 0.40],
    pool: { radius: [3.0, 11.0], floor: 0.05 },
  },

  // 04 — high. Looking down the top of the boom while the tool comes round.
  above: {
    trigger: '#above',
    from: at(250, 4.30, 1.55, V(0.30, 1.80, 0), 38),
    /*
      SWUNG TOWARD BROADSIDE, AND THAT IS THE SPAN CLAIM'S DOING.

      At pose E the column sits at a1 = 0.42 rad, which puts the arm along scene
      azimuth 114 deg — so the broadside views are 24 and 204. Standing at 315 was
      69 deg off, and the shot that claims 3 070 mm ACROSS was showing the machine
      at close to its narrowest. 350 is 34 deg off broadside and still monotonic
      into the macro's 372, so the journey does not double back to get there.

      Height comes down with it: 7.4 m was a plan view, and a plan view of a span
      is a diagram. 6.6 keeps the aerial read and lets the arm have length.
    */
    to:   at(350, 4.60, 5.20, V(0.85, 1.45, 0), 46),
    // Arrives in the first half and HOLDS. Without this the aerial only exists on
    // the shot's very last frame: stopped at 55% it still read as a raised
    // three-quarter, which is a view the page already has twice.
    camEase: easeOut,
    pose: { from: 0.60, to: 0.79, at: [0.10, 0.90] },
    light: 'top',
    lightAt: [0.20, 0.66],
    // From above the floor IS the frame, so the bay is the composition.
    pool: { radius: [4.6, 16.0], floor: 0.05 },
  },

  // 05 — macro. Close enough that the machine leaves the frame entirely and what
  // is left is one joint. The radius does the work; the azimuth barely moves,
  // because a macro that also travels is a blur.
  macro: {
    trigger: '#macro',
    from: at(350, 4.60, 5.20, V(0.85, 1.45, 0), 46),   // = above.to
    to:   at(372, 1.45, 2.30, V(1.78, 2.05, 0), 30),
    // Arrives in the first half and then HOLDS. easeIn was tried and spends most
    // of the section still travelling, so most stoppable frames in the macro shot
    // were not macro frames — which fails MJ4 for the shot that most depends on it.
    camEase: (t) => easeOut(clamp01(t / 0.52)),
    pose: { from: 0.79, to: 0.87, at: [0.00, 0.62] },
    light: 'specular',
    lightAt: [0.00, 0.34],
    pool: { radius: [3.0, 11.0], floor: 0.05 },
  },

  // 06 — the hero. The azimuth here is CALCULATED, not chosen: at pose E the
  // column sits at a1 = 0.42rad, which puts the arm along scene-azimuth 114deg,
  // so the broadside views are 24deg and 204deg. Standing at 185deg (545 mod 360)
  // is 19deg off broadside — the arm reads across the frame at close to its full
  // length. The first cut stood at 148deg, 34deg from the arm's OWN heading, and
  // the machine foreshortened into a compact blob at the exact moment it was
  // supposed to be at its most extended.
  //
  // It is also ~150deg round from where shot 01 stood, which is the other thing
  // this shot owes: a hero angle from a substantially different side.
  hero: {
    trigger: '#hero',
    from: at(372, 1.45, 2.30, V(1.78, 2.05, 0), 30),
    /*
      The target moves right so the machine does. The closing statement is the
      largest type on the page and the arm is in front of it by design — but with
      the machine centred the arm was crossing the END of both lines and taking the
      full stop with it, which is occlusion eating the sentence rather than
      crossing it. Pushing the target to x 2.05 walks the machine into the right
      third and leaves the statement its own column.
    */
    to:   at(545, 8.40, 1.05, V(2.05, 1.24, 0), 40),
    camEase: easeOut,
    pose: { from: 0.87, to: 1.00, at: [0.04, 0.72] },
    light: 'hero',
    lightAt: [0.16, 0.62],
    pool: { radius: [4.0, 15.0], floor: 0.04 },
  },
};

/* ── mobile ──────────────────────────────────────────────────────────────── */
//
// Authored, not derived (DM10, MJ8). A portrait frame has roughly half the
// horizontal field, so every station stands further out and wider. The AZIMUTHS
// are kept — the journey is the point and it survives the aspect change. What
// does not survive is the framing, so that is what changes.
const MOBILE = {
  impact: [at(40, 4.60, 1.05, V(0.35, 1.50, 0), 52), at(18, 4.10, 0.85, V(0.45, 1.60, 0), 54)],
  scale:  [at(18, 4.10, 0.85, V(0.45, 1.60, 0), 54), at(110, 15.0, 4.60, V(0.35, 1.45, 0), 40)],
  rear:   [at(110, 15.0, 4.60, V(0.35, 1.45, 0), 40), at(250, 5.60, 1.70, V(0.35, 1.75, 0), 44)],
  above:  [at(250, 5.60, 1.70, V(0.35, 1.75, 0), 44), at(315, 6.60, 7.80, V(0.95, 1.55, 0), 56)],
  /*
    The portrait macro was framing mostly empty air: at 2.05 m out with the target
    high on the boom, the joint the shot is about sat low-left and the top half of
    the frame was floor. Closer, and aimed at the elbow itself.
  */
  macro:  [at(315, 6.60, 7.80, V(0.95, 1.55, 0), 56), at(372, 1.70, 2.05, V(1.62, 1.92, 0), 34)],
  hero:   [at(372, 2.05, 2.28, V(1.76, 2.05, 0), 36), at(545, 11.0, 1.25, V(1.05, 1.24, 0), 46)],
};

const ORDER = ['impact', 'scale', 'rear', 'above', 'macro', 'hero'];

/** The station shot 01 opens on. The intro has to land exactly here. */
export function openingStation(mobile) {
  return mobile && MOBILE.impact ? MOBILE.impact[0] : SHOTS.impact.from;
}

/* ── the story ───────────────────────────────────────────────────────────── */

export function createStory(scope, world) {
  const { rigCam, rig, drawing } = world;
  const mob = world.mobile;

  const track = (name) =>
    (mob && MOBILE[name] ? { from: MOBILE[name][0], to: MOBILE[name][1] } : { from: SHOTS[name].from, to: SHOTS[name].to });

  const put = (station) => { rigCam.set(station); world.touch(); };
  const setShot = (name) => drawing?.setShot(name);

  const ctx = gsap.context(() => {
    ORDER.forEach((name, i) => {
      const shot = SHOTS[name];
      const prev = i > 0 ? SHOTS[ORDER[i - 1]] : null;
      const t = track(name);

      /*
        THE COPY IS NOT THIS MODULE'S ANY MORE.

        This used to hold a presence curve — opacity in over the first 7% of the
        section, out over the last 16% — written onto `.type` and `.frame` every
        frame. It was the second owner of those elements' opacity, and it was the
        louder one: reveal.js plays each block's arrival on its own clock, and
        every one of those arrivals was happening inside a parent this curve was
        holding at zero. The gestures ran, correctly, and nobody ever saw one.

        One owner per property (G6). reveal.js has the copy — it brings it in when
        the section arrives and takes it out when the section leaves, which is the
        same job this curve was doing, done once.
      */

      ScrollTrigger.create({
        trigger: shot.trigger,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;

          put(blendStations(t.from, t.to, (shot.camEase ?? ease)(p)));

          // The arm runs on its own window inside the shot, so the camera and
          // the machine never start or stop together. That is the difference
          // between choreography and two things happening at once.
          rig.setPose(lerp(shot.pose.from, shot.pose.to, ease(span(p, shot.pose.at[0], shot.pose.at[1]))));

          // The light has its own window too, and a different one per shot. It
        // used to crossfade over 0..0.45 everywhere, which put every lighting
        // change on the same clock as every other lighting change — four
        // channels moving in step is one channel wearing four names.
        const [la, lb] = shot.lightAt ?? [0.0, 0.45];
        world.setLight(shot.light, ease(span(p, la, lb)), prev?.light ?? shot.light);
          // The bay of light follows the shot: a close crop gets a tight pool, the
          // aerial gets a wide one. See hall.js for what the pool is doing.
          if (shot.pool) world.setPool(shot.pool);
          setShot(name);
        },
        onEnterBack: () => { setShot(name); if (shot.pool) world.setPool(shot.pool); },
      });
    });

    /*
      The record's own station. The hero's closing frame walked to it rather than
      cutting: same azimuth, so nothing swings — the camera only steps in and
      re-centres, which reads as attention rather than as a new shot.
    */
    const recordFrom = mob && MOBILE.hero ? MOBILE.hero[1] : SHOTS.hero.to;
    /*
      THE LAST FRAME IS THE ONE THE VISITOR CAN TURN.

      Everything before it is authored: the camera goes where the shot says. Here
      the argument is finished and the machine is simply present, so this is the
      one place where handing over the axis costs nothing and gives the page its
      only piece of real interaction — 360 degrees of it, around the same vertical
      axis the whole story orbited.

      IT TURNS THE MACHINE, NOT THE CAMERA. An orbit would swing the whole world
      past the frame — ground, cast shadow, key direction and all — and read as
      the room moving rather than the object turning. The spin group in scene.js
      rotates the rig about the world vertical, through the machine's own base.

      HORIZONTAL ONLY, and touch-action keeps the vertical gesture with the page:
      a drag surface that swallowed vertical scroll would trap a phone visitor on
      the last screen, which is the worst place on the page to be trapped.

      The camera keeps doing its own job underneath: the record's approach still
      runs on scroll while the machine holds whatever heading the visitor gave it.
    */
    /*
      THE LAST SCREEN'S DEFAULT HEADING.

      The frame that was asked for has the arm reaching up and to the RIGHT, clear
      of the measurements column. The camera alone does not produce it: the
      reference was captured after the machine had been turned, and a turn does not
      move the camera, so the readout matched (AZ 178) while the heading did not.
      Rebuilding only the camera reproduced the numbers and mirrored the machine —
      the arm swung left and the gripper crossed the figures column.

      180 degrees is that heading, measured against the reference rather than
      guessed, and it is TURNED INTO rather than set: the machine comes round over
      the back half of the record's approach, after the closing statement has
      cleared, so nothing pops. The visitor's drag is a separate offset added on
      top, so turning it by hand never fights the authored arrival.
    */
    const SPIN_HOME = 180;
    const SPIN_AT = [0.5, 1.0];

    let spinDrag = 0;
    let recordP = 0;
    let dragging = false;
    let lastX = 0;

    /*
      THE LAST SCREEN HOLDS THE HERO'S CLOSING FRAME. It does not travel to a
      station of its own.

      It used to: the camera stepped in and walked the machine right, ending at
      radius 9.00 with the target pushed to x 3.05 — printed as AZ 166 / 9.2 M.
      That was built from "the arm moves a little right and gets a little bigger",
      and it was then replaced by a specific frame: AZ 178 / 8.3 M, which is
      exactly this station at record progress zero. So the request that produced
      the move has been superseded by one that names its destination, and the
      honest way to honour the second is to stop moving.

      Identical to `recordFrom`, deliberately and not by accident — the blend below
      still runs, resolves to the same station at every progress, and the frame is
      held. What moves on this screen is the machine, and only when the visitor
      turns it.
    */
    const RECORD_VIEW = recordFrom;

    const putRecord = () => {
      put(blendStations(recordFrom, RECORD_VIEW, ease(recordP)));
      const home = SPIN_HOME * ease(span(recordP, SPIN_AT[0], SPIN_AT[1]));
      world.setSpin(home + spinDrag);
    };

    const surface = document.querySelector('[data-orbit]');
    if (surface) {
      const down = (e) => {
        dragging = true;
        lastX = e.clientX;
        surface.setPointerCapture?.(e.pointerId);
        surface.dataset.grabbing = '';
      };
      const move = (e) => {
        if (!dragging) return;
        // 0.32 deg per pixel: a full turn is about a thousand pixels of travel,
        // which is one comfortable sweep of a trackpad rather than a flick.
        spinDrag += (e.clientX - lastX) * 0.32;
        lastX = e.clientX;
        putRecord();
      };
      const up = (e) => {
        dragging = false;
        surface.releasePointerCapture?.(e.pointerId);
        delete surface.dataset.grabbing;
      };
      surface.addEventListener('pointerdown', down);
      surface.addEventListener('pointermove', move);
      surface.addEventListener('pointerup', up);
      surface.addEventListener('pointercancel', up);
    }

    // The record: the scene falls away rather than being covered. An opaque
    // surface travelling across live content cuts a hard edge through it (U13).
    /*
      THE APPROACH USED TO BEGIN UNDER THE CLOSING STATEMENT.

      `top bottom` fires the moment the record's column clears the bottom of the
      screen, which on a 945px viewport is hero progress ~0.39 — so the exposure
      started falling, the machine started turning and the datum started fading
      while "The hand that never tilts." was still arriving. Measured: the level
      line was at opacity 0.30 by hero 0.53 and at ZERO by 0.69. For the last
      third of the frame that states the page's thesis, the instrument proving it
      was gone.

      `top center` → `top 15%` moves the whole approach behind the statement. The
      datum now holds at full strength to hero ~0.74 and is still readable while
      the statement exits at 0.80, which is the one pairing this page exists to
      show.

      The end is `top 15%` and not `top top` because `top top` is unreachable:
      #record is exactly one viewport and sits last, so the document's maximum
      scroll leaves the column's top around 120px below the viewport top. A
      trigger that can never complete would leave the machine part-turned and the
      exposure part-way down on the final frame.
    */
    ScrollTrigger.create({
      trigger: '#record .record',
      start: 'top center',
      end: 'top 15%',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // The machine clears the column. The text block sits on the LEFT through
        // the record, so the camera walks the arm to the right of the frame and
        // closes in slightly while it does — the measurements and the thing they
        // measure end up side by side instead of stacked on each other. The
        // target moves +x, which on this camera's heading is screen-left, so the
        // machine travels screen-right.
        recordP = self.progress;
        putRecord();

        /*
          0.58, NOT 0.14.

          0.14 was not a dim, it was a kill: it rendered the subject as a flat
          maroon cut-out with no highlight, no material and no form, so the last
          thing the page showed of the machine was the worst picture of it on the
          page. The justification was that the frame going down is the legibility
          mechanism now the record's scrim is gone — true, but the column sits on
          the opposite half of the screen from the machine on desktop, so the
          exposure was buying contrast it did not need and paying for it with the
          subject.

          The floor is now the darkest the machine can be while its castings still
          read as castings. Measured against the render, not chosen for mood, and
          it is a contrast control rather than a mood one exactly as before — only
          set where the two requirements actually meet instead of well past it.
        */
        // On a phone the record has no cast shadow to give the machine a reason to
        // be there, and the column crosses it rather than sitting beside it — so it
        // goes further down there than it does on desktop.
        world.setExposure(lerp(1.18, world.mobile ? 0.34 : 0.58, self.progress));
        /*
          The drawing leaves with the light. The record is the place the marks
          are READ rather than drawn — every figure on the last screen is the
          same figure a dimension carried on the way down — so holding the
          annotation over the table would be saying it twice.
        */
        drawing?.setFade(1 - clamp01(self.progress));
        /*
          The marks switch off only once the fade has taken them, not on the first
          frame of the approach. Clearing the shot immediately dropped datum A to
          zero at hero progress 0.80 — the exact frame the closing statement begins
          to leave, and the one pairing this page exists to show. Measured: datum 0
          against statement 1.
        */
        drawing?.setShot(self.progress > 0.9 ? 'record' : 'hero');
      },
      onLeaveBack: () => {
        spinDrag = 0;
        recordP = 0;
        world.setSpin(0);   // leaving the last screen returns the machine to the heading the shots were composed around
        put(recordFrom);
        world.setExposure(1.18);
        drawing?.setFade(1);
        drawing?.setShot('hero');
      },
    });
  }, scope);

  return () => ctx.revert();
}

/**
 * The authored reduced-motion state (DNA43, MJ9, DM4).
 *
 * Not the sequence stopped — the frame the hero shot was built around: the
 * machine at full extension, the hero light resolved, the level line already
 * proving. What the visitor loses is the travel; what they must not lose is
 * what the travel demonstrated.
 */
export function createStill(world) {
  const { rigCam, rig, drawing } = world;
  const station = world.mobile && MOBILE.hero ? MOBILE.hero[1] : SHOTS.hero.to;
  const s = place(station);

  rig.setPose(1);
  rigCam.cut({ position: s.position, target: s.target, fov: s.fov });
  world.setLight('hero', 1);

  drawing?.setShot('hero');
  drawing?.update();
  world.touch();
  return () => {};
}

export { SHOTS, ORDER };
