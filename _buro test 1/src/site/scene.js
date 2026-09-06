// The scene — INDEX1 · The Level Line
//
// Lighting, environment and materials were decided in BRIEF.md before they were
// coded (DNA55). What is here is that decision, executed:
//
//   THE PLACE      A machine hall at night. Not "dark because cinematic" — a
//                  palletiser is read by its highlights, and a highlight needs
//                  somewhere to be bright against (DNA22).
//   THE KEY        One hard source, high and to the left, raking along the arm
//                  so the machined edges separate from the castings.
//   THE FILL       Cool, from the floor, at a quarter of key. It is the room
//                  bouncing, and it is what stops the shadow side reading as a
//                  hole cut in the picture.
//   THE RIM        Warm, low and behind, at 0.55 — it lifts the arm's silhouette
//                  off the ground plane, which is the whole job during the sweep.
//   THE REFLECTION Authored in code, not downloaded (DNA58). A default studio
//                  HDRI under this art direction is a mismatch and it is visible:
//                  the machine would sit in a bright white room reflecting a
//                  softbox it is nowhere near.

import * as THREE from 'three';
import { createStage } from '../engine/stage.js';
import { createCameraRig } from '../engine/camera-rig.js';
import { loadModel } from '../engine/loaders.js';
import { createContactShadow } from '../engine/ground.js';
import { auditMaterials } from '../engine/materials.js';
import { createHall, KEY_ANCHOR, KEY_DISTANCE } from './hall.js';
import { createDrawing } from './drawing.js';
import { createRig } from './rig.js';
import MODEL from '../../assets/models/kr700pa-rig2.glb?url';


/* ── the environment, authored ───────────────────────────────────────────── */
//
// A PMREM built from a scene of emissive planes rather than from an .hdr. It
// costs nothing over the wire, it has no provenance question, and — the actual
// reason — every value in it is a decision someone can read and argue with.
function workshopEnvironment(renderer, scene) {
  const room = new THREE.Scene();
  const plane = new THREE.PlaneGeometry(1, 1);

  const panel = (colour, intensity, [w, h], position, rotation) => {
    const mesh = new THREE.Mesh(
      plane,
      new THREE.MeshBasicMaterial({ color: new THREE.Color(colour).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    mesh.scale.set(w, h, 1);
    mesh.position.set(...position);
    if (rotation) mesh.rotation.set(...rotation);
    room.add(mesh);
    return mesh;
  };

  // The hall: cool and very dark, so the machine is the brightest thing in it.
  room.background = new THREE.Color(0x05070a);
  panel(0x0a0f14, 1.0, [40, 40], [0, -6, 0], [-Math.PI / 2, 0, 0]);   // floor
  panel(0x070a0d, 1.0, [40, 20], [0, 6, -14], [0, 0, 0]);             // far wall

  // The overhead strip the key belongs to. Long and narrow: a machine hall is
  // lit by lines, not by a softbox, and the reflection has to say that.
  //
  // IT IS NOW WHERE THE KEY IS. The strip was authored at (-5, 11, 1) and the key
  // at (-5.5, 8.5, 3.2) — near enough to pass a glance, far enough apart that the
  // highlight running down a casting traced a source the room did not contain.
  // Both are derived from KEY_ANCHOR now, so the reflection is a photograph of
  // the lamp that made it. See hall.js for why that vector is the one.
  const keyAt = KEY_ANCHOR.clone().multiplyScalar(KEY_DISTANCE);
  panel(0xfff2e0, 5.2, [3, 22], [keyAt.x, keyAt.y, keyAt.z]).lookAt(0, 0, 0);
  // The opposite line, dimmer. It is what the shadow side of the machine sees,
  // and it is the reflected half of the fill.
  panel(0xfff2e0, 1.6, [2, 18], [7, 11, -2], [Math.PI / 2, 0, 0]);

  // A cold bounce off the floor on the shadow side — the fill, in reflection form.
  panel(0x2a3d52, 1.1, [16, 8], [9, 1, 6], [0, -Math.PI / 2.4, 0]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(room, 0.02).texture;
  pmrem.dispose();
  plane.dispose();
  room.traverse((o) => o.material?.dispose());

  scene.environment = env;
  scene.environmentIntensity = 1.0;
  return env;
}

/* ── the scene ───────────────────────────────────────────────────────────── */

export async function createScene(canvas, { ticker, reduced = false, onProgress } = {}) {
  const stage = createStage(canvas, {
    fov: 34,            // DNA51 — 28-40 compresses and reads heroic; a machine deserves the long lens
    near: 0.2,
    far: 60,
    exposure: 1.15,     // tuned against the render, not left at 1 (DNA56)
    background: null,   // transparent — the backdrop and the receding type are behind this canvas

    ticker,
  });

  const { scene, renderer, camera, mobile } = stage;

  workshopEnvironment(renderer, scene);

  // Fog is the one atmospheric device, and it is doing a compositional job: it
  // sinks the far end of the hall so the machine's silhouette has somewhere to
  // separate against. One depth idea per view (DM6) — there is no parallax layer
  // and no second spatial system anywhere on this page.
  //
  // The range was 9..30, then 14..52 when the wide station moved out.
  //
  // IT NOW HAS SOMETHING TO ACT ON. Until the floor existed the fog was an
  // instruction with no receiver: nothing in the scene was further away than the
  // machine, so nothing ever faded and the "hall" was a word in a comment. The
  // floor is what turns the far value into a HORIZON — the distance at which the
  // ground stops being ground and becomes the page's own colour.
  //
  // Pulled in from 52 to 44 because that horizon now has to land inside the
  // frame rather than past it. The fog colour is --ground exactly, so a fully
  // fogged floor resolves to the same value as the document behind the canvas
  // and the join is not findable.
  scene.fog = new THREE.Fog(0x0a0c0d, 11, 34);

  const key = new THREE.DirectionalLight(0xfff0dc, 3.4);
  // Seeded on the anchor the environment's strip is built from — the per-shot
  // table below still walks it around, but it now starts where the room says
  // the light is.
  key.position.copy(KEY_ANCHOR).multiplyScalar(10);
  key.castShadow = !mobile;
  if (key.castShadow) {
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    const c = key.shadow.camera;
    // Widened with the key’s elevation drop. At 52 degrees the cast shadow was
    // a blot under the base; at 30 it runs several metres, and a +/-6 frustum
    // sheared it off mid-arm. The shadow is a compositional element now, so the
    // frustum has to contain the whole of it.
    c.near = 1; c.far = 38;
    c.left = c.bottom = -15; c.right = c.top = 15;
    c.updateProjectionMatrix();
  }

  const fill = new THREE.DirectionalLight(0x8fb4d6, 0.85);   // cool, from the floor
  fill.position.set(6, -2, 5);

  const rim = new THREE.DirectionalLight(0xffd2a0, 1.9);     // warm, low, behind
  rim.position.set(3.5, 1.2, -7);

  scene.add(key, fill, rim);

  // onProgress is passed straight through rather than synthesised here: the only
  // honest source for how much of the machine has arrived is the transfer itself.
  const gltf = await loadModel(renderer, MODEL, { onProgress });
  const model = gltf.scene;

  const findings = auditMaterials(model);
  if (findings.length) console.warn('[scene] material audit', findings);

  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = !mobile;
    o.receiveShadow = !mobile;
    // The export's factors are the floor, not the look (DNA57). Tuned here,
    // against this environment, which is the only place the answer exists.
    const m = o.material;
    if (!m) return;
    m.envMapIntensity = 1.25;
    if (m.name === 'paint') { m.roughness = 0.46; m.metalness = 0.05; }
    if (m.name === 'steel') { m.roughness = 0.31; m.metalness = 0.95; }
    if (m.name === 'graphite') { m.roughness = 0.62; m.metalness = 0.25; }
  });

  const rig = createRig(model);

  /*
    THE SPIN AXIS.

    The machine turns on its own vertical axis; the camera does not orbit it.
    Those are different things and they look different: an orbit swings the whole
    world past the frame — ground, shadow, light direction and all — while a spin
    leaves the room where it is and turns the object standing in it.

    It is a WRAPPER group rather than rig.root's own rotation.y, because the rig
    root carries rotation.x = -90deg to convert the survey's Z-up frame to the
    scene's Y-up one. Rotating it about its own Y would turn the machine about a
    horizontal axis — it would tip over rather than turn round.

    The group sits at the origin, which is where the machine's base column stands,
    so the axis of the spin is the axis of the machine.
  */
  const spin = new THREE.Group();
  spin.name = 'spin';
  spin.add(rig.root);
  scene.add(spin);

  /*
    THE HALL.

    One floor, and the horizon the fog makes with it. It replaces
    createShadowCatcher, which was a ShadowMaterial — a surface that is invisible
    except where a shadow lands, and therefore a surface that draws black onto a
    near-black page. The key's cast shadow was in every frame and visible in none
    of them.

    Net cost is nothing: one plane out, one plane in.
  */
  const hall = createHall(scene, { receiveShadow: !mobile });
  /*
    THE FLOOR TAKES LESS OF THE ROOM THAN THE MACHINE DOES.

    A rough dielectric still has a specular lobe, and at the grazing angles a
    floor is mostly seen at, Fresnel drives it hard. The first cut of this put the
    far slab at luma 72 against a page ground of 12 — a bright horizon band
    reflecting the overhead strips straight back down the lens. Physically
    correct, and the end of the darkness the whole palette was derived for.

    The environment is held back here and ONLY here: the castings keep the full
    1.25 that makes them read as painted steel, because the machine is what the
    room is for.
  */
  hall.material.envMapIntensity = 0.35;

  /*
    Contact shadow, always (DNA59). Sized to the machine's actual footprint
    rather than to a round number — a shadow plane wider than the subject is a
    grey square you can see the edge of.

    IT NOW RUNS ON MOBILE TOO. It was skipped there with the rest of the shadow
    work, which was defensible while the machine floated in a void — nothing was
    grounded, so nothing looked ungrounded. With a lit floor under it, a phone
    would have shown the machine hovering over a surface it never touches, which
    is the most conspicuous of the 3D tells. The map is a quarter of the desktop
    one and the pass already stops the moment the scene settles.

    Lifted a hair off the slab: both planes live at y 0 and the contact plane
    writes no depth, so at exactly equal depth it is a coin toss which one the
    driver keeps.
  */
  const contact = createContactShadow(scene, {
    size: 7,
    height: 0.9,
    resolution: mobile ? 256 : 512,
    blur: 3.2,
    darkness: 1.8,
    opacity: 0.8,
    y: 0.004,
    ignore: [hall.floor],
  });

  const rigCam = createCameraRig(camera, { lambda: 3.2, fovLambda: 2.4 });

  /* ── lighting, directed per shot ───────────────────────────────────────
     One world, five setups. The room, the ground, the environment and the
     material response never change — only where the light comes from and how
     hard it is, which is what a gaffer changes between setups on one stand.

     Keeping the environment fixed is what stops this becoming five scenes
     (U11 arriving through the lighting): the reflections stay continuous, so
     the machine is recognisably in the same hall the whole way down. */
  const LIGHT = {
    // 00 — where the opening starts. One rim and almost nothing else, so the
    // machine exists as an edge before it exists as an object.
    dark:     { key: [-7.6, 5.4, 2.6, 0.22], fill: [5, -1.5, 4, 0.12], rim: [2.6, 1.4, -6.2, 1.10], exposure: 0.76 },
    /*
      01 — sculptural rim. The form is read from one bright edge running down the
      casting.

      THE FILL FLOOR. It said "almost no fill: … and the rest can go", and the
      rest did go: at 0.30 the shadow side of the casting fell below the value of
      the ground behind it, so it stopped being a dark side of a solid and became
      a hole cut in the picture. That was survivable while the ground was an
      empty void with nothing to compare against. It is not survivable now the
      floor has a value — an object whose dark side is darker than the floor it
      stands on does not read as an object.

      The rule this and `specular` are now set by: THE DARKEST LIT SURFACE OF THE
      MACHINE STAYS ABOVE THE FLOOR'S VALUE AT THE SAME DEPTH. Measured on the
      render, and it costs the drama nothing — the bright edge is doing the
      sculpting either way.
    */
    sculpt:   { key: [-8.4, 4.6, 2.4, 2.4], fill: [5, -1.5, 4, 0.60], rim: [2.6, 1.4, -6.2, 3.2], exposure: 1.10 },
    // 02 — clean and even. The machine is small here and has to read whole.
    clean:    { key: [-8.0, 5.0, 2.2, 3.3], fill: [6, -1.0, 5, 0.88], rim: [3.0, 1.6, -6.5, 1.8], exposure: 1.16 },
    // 03 — harder side light. The pose is the event, so the light rakes across
    // the linkage and lets the rods throw their own shadows on the castings.
    side:     { key: [-9.2, 3.8, 1.6, 3.8], fill: [5, -1.0, 4, 0.62], rim: [4.0, 1.2, -5.5, 2.3], exposure: 1.10 },
    // 04 — specular. Close enough that the subject IS the highlight, so the key
    // is tight and hot and the fill barely exists.
    specular: { key: [-4.0, 3.4, 3.2, 4.4], fill: [4, 0.4, 3, 0.55], rim: [2.2, 1.0, -3.4, 2.9], exposure: 0.98 },
    // 04 — from above. The key comes over the top so the boom's upper surfaces
    // carry the frame and the floor falls away into nothing.
    top:      { key: [-3.0, 8.4, 2.0, 3.5], fill: [5, 0.2, 4, 0.60], rim: [3.2, 2.4, -6.0, 1.7], exposure: 1.12 },
    // 06 — resolved. Broad key, real fill, rim back to separating the arm from
    // the hall. The frame is wide again and everything has to hold together.
    hero:     { key: [-8.6, 4.4, 2.0, 3.4], fill: [6.5, -1.2, 5, 0.85], rim: [3.4, 1.4, -7.0, 2.5], exposure: 1.18 },
  };

  const _c = { key: [...LIGHT.sculpt.key], fill: [...LIGHT.sculpt.fill], rim: [...LIGHT.sculpt.rim] };

  const applyLight = (name, t, fromName) => {
    const to = LIGHT[name] ?? LIGHT.hero;
    const from = LIGHT[fromName] ?? to;
    const k = Math.max(0, Math.min(1, t));
    for (const which of ['key', 'fill', 'rim']) {
      for (let i = 0; i < 4; i++) _c[which][i] = from[which][i] + (to[which][i] - from[which][i]) * k;
    }
    key.position.set(_c.key[0], _c.key[1], _c.key[2]);
    key.intensity = _c.key[3];
    fill.position.set(_c.fill[0], _c.fill[1], _c.fill[2]);
    fill.intensity = _c.fill[3];
    rim.position.set(_c.rim[0], _c.rim[1], _c.rim[2]);
    rim.intensity = _c.rim[3];
    stage.setExposure(from.exposure + (to.exposure - from.exposure) * k);
  };

  // The subject box, published so the composition audit measures what the page
  // actually claims rather than guessing at it (PROCESS.md §5).
  const publishSubject = () => {
    // Measured on the rig root: the loaded scene is empty once its meshes have
    // been re-parented, and an empty Box3 publishes nulls that read as "no subject".
    const box = new THREE.Box3().setFromObject(rig.root);
    const min = box.min.clone().project(camera);
    const max = box.max.clone().project(camera);
    window.__subject = {
      x: (Math.min(min.x, max.x) + 1) / 2,
      y: 1 - (Math.max(min.y, max.y) + 1) / 2,
      w: Math.abs(max.x - min.x) / 2,
      h: Math.abs(max.y - min.y) / 2,
    };
  };

  // The readout. Real camera state, printed — azimuth around the machine and the
  // distance the camera is standing at. Both are read off the camera every frame
  // rather than mirrored from the station table, so if the two ever disagree the
  // readout tells the truth about what is on screen.
  /*
    THE DRAWING LAYER.

    It replaces the level line and the three written leaders with marks that
    terminate on projected model points — see drawing.js. Built after the rig,
    because every mark reads the rig.
  */
  const drawing = createDrawing({ camera, rig });

  const readoutEl = document.querySelector('[data-readout]');
  let lastAz = -999;
  let lastDist = -999;

  const updateReadout = () => {
    if (!readoutEl) return;
    const az = (Math.atan2(camera.position.x, camera.position.z) * 180 / Math.PI + 360) % 360;
    const dist = Math.hypot(camera.position.x, camera.position.z);
    // BOTH values gate it. Gating on azimuth alone froze the metres through
    // every dolly on the page — measured at 10.4 M printed against 7.6 M actual.
    if (Math.abs(az - lastAz) < 0.5 && Math.abs(dist - lastDist) < 0.05) return;
    lastAz = az; lastDist = dist;
    readoutEl.textContent = `AZ ${az.toFixed(0).padStart(3, '0')}\u00b0 \u00b7 ${dist.toFixed(1)} M`;
  };

  /*
    THE RECORD MAKES TWO CLAIMS ABOUT THIS SCENE, SO THIS SCENE PUBLISHES THEM.

    "Draw-call floor · 9" and "Triangles · 137 613" are figures in the table, and
    the table's whole argument is that its figures were measured. The hall added
    geometry, so both had to be re-measured rather than assumed — publishing them
    from the renderer is how they stay checkable instead of becoming two numbers
    that were true once.
  */
  const publishBudget = () => {
    const r = renderer.info.render;
    window.__render = { calls: r.calls, triangles: r.triangles, programs: renderer.info.programs?.length ?? 0 };
  };

  let moving = true;

  stage.onFrame((dt) => {
    // FIRST in the callback, deliberately. onFrame runs before the main render,
    // and the contact pass further down this same function ends by rendering a
    // two-triangle blur plane — so reading the renderer's counters after it
    // reports the blur, not the frame. Read here and they are the previous main
    // render's totals, which is the number the record's claim is about.
    publishBudget();
    const settled = rigCam.update(dt);
    drawing.update();
    updateReadout();
    // The contact shadow is a full extra scene pass, so it runs while anything
    // is actually moving and stops when nothing is (DNA75). A still frame does
    // not need its shadow re-rendered sixty times a second.
    if (contact && (!settled || moving)) {
      contact.update(renderer);
      moving = false;
    }
    publishSubject();
  });

  return {
    stage,
    scene,
    camera,
    model,
    rig,
    rigCam,
    drawing,
    mobile,
    /** Marks the scene dirty so the contact shadow re-renders this frame. */
    touch() { moving = true; },

    /**
     * Turns the machine on its own vertical axis, in degrees. The level line
     * follows it without being told: it reads the flange's WORLD position, and
     * the spin group is one of that node's ancestors.
     */
    setSpin(deg) {
      spin.rotation.y = deg * Math.PI / 180;
      moving = true;
    },
    /** Crossfade the lighting setup. See LIGHT above — one world, five setups. */
    setLight: applyLight,
    /** Shapes the bay of light per shot. See hall.js. */
    setPool: (v) => hall.setPool(v),
    setExposure: (v) => stage.setExposure(v),
    dispose() {
      contact?.dispose();
      drawing.dispose();
      hall.dispose();
      stage.dispose();
      delete window.__subject;
    },
  };
}
