// The stage: one canvas, one renderer, one scene, one camera, one loop (DNA54).
//
// Colour management is on and is not optional (DNA56): sRGB output, ACES Filmic
// tone mapping, and an exposure that is a design value rather than a leftover 1.
// Everything here is an engineering contract. What the scene *looks* like is
// decided in BRIEF.md and lives in the scene modules, not in this file.

import * as THREE from 'three';
import { createLoop } from './loop.js';
import { createBudgetHUD, BUDGET } from './budget.js';

export function createStage(canvas, {
  fov = 35,              // DNA51 — 28-40 compresses and reads heroic
  near = 0.1,
  far = 100,
  exposure = 1.0,        // tuned per project, in the scene, not left at default silently
  background = 0x0b0b0d,
  antialias = true,
  hud = import.meta.env?.DEV ?? false,
  ticker = null,   // pass gsap.ticker when GSAP is on the page — see engine/loop.js
} = {}) {
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  const cap = mobile ? BUDGET.mobile.dpr : BUDGET.desktop.dpr;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, cap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);

  const camera = new THREE.PerspectiveCamera(fov, 1, near, far);
  camera.position.set(0, 1.4, 6);

  const loop = createLoop({ element: canvas, ticker });
  const budget = hud ? createBudgetHUD(renderer, { mobile }) : null;

  // ── resize ──────────────────────────────────────────────────────────────
  // Observed on the canvas rather than on window, so a canvas inside a pinned
  // or transformed container still reports its real box.
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // ── render ──────────────────────────────────────────────────────────────
  const before = new Set();
  const stopLoop = loop.add((dt, elapsed) => {
    for (const fn of before) fn(dt, elapsed);
    renderer.render(scene, camera);
    budget?.update(dt);
  });

  return {
    renderer,
    scene,
    camera,
    loop,
    mobile,
    /** Runs each frame before the render. Returns an unsubscribe. */
    onFrame(fn) {
      before.add(fn);
      return () => before.delete(fn);
    },
    setExposure(v) {
      renderer.toneMappingExposure = v;
    },
    resize,
    dispose() {
      stopLoop();
      before.clear();
      ro.disconnect();
      budget?.dispose();
      loop.dispose();
      disposeScene(scene);
      renderer.dispose();
    },
  };
}

/** DNA75 — dispose geometries, materials and textures on unmount. */
export function disposeScene(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose();
    const materials = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const m of materials) {
      for (const key of Object.keys(m)) {
        const value = m[key];
        if (value && value.isTexture) value.dispose();
      }
      m.dispose();
    }
  });
}
