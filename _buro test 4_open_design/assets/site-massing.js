/* Luxe Corsa - site massing view -------------------------------------------
   A 3D massing study extruded from the same site plan the 2D view draws.
   Every footprint, rotation and tier below is measured off plan.svg, so the
   arrangement and the Premium/Standard split are real. Building HEIGHT is the
   one indicative value - the plan carries no elevation - which is why this is
   labelled a massing study rather than a rendering.

   Plan space: 1296 x 712 units, centred on the origin, ~0.64 units per foot.
   Box format: [centreX, centreZ, width, depth, rotationDeg, tier]
   tier: 0 = Type B Standard, 1 = Type A Premium, 2 = civic (club + dealership)
--------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var BOXES = [
    [-389.2,37.4,18.6,32.5,-23,1],[-216.7,-35.8,17.8,32.5,-23,1],[-373.8,30.9,14.5,32.5,-23,0],[-359.9,25,15.3,32.5,-23,0],[-345.6,18.9,15.3,32.5,-23,0],[-331.3,12.9,15.3,32.5,-23,0],[-317,6.8,15.3,32.5,-23,0],[-302.7,0.7,15.3,32.5,-23,0],[-288.5,-5.3,15.3,32.5,-23,0],[-274.2,-11.4,15.3,32.5,-23,0],[-259.9,-17.4,15.3,32.5,-23,0],[-245.6,-23.5,15.3,32.5,-23,0],[-232.1,-29.2,15.3,32.5,-23,0],[-155.9,108.7,18.6,32.5,157,1],[-328.4,181.9,17.8,32.5,157,1],[-171.3,115.3,14.5,32.5,157,0],[-185.2,121.2,15.3,32.5,157,0],[-199.5,127.2,15.3,32.5,157,0],[-213.7,133.3,15.3,32.5,157,0],[-228,139.3,15.3,32.5,157,0],[-242.3,145.4,15.3,32.5,157,0],[-256.6,151.4,15.3,32.5,157,0],[-270.9,157.5,15.3,32.5,157,0],[-285.1,163.6,15.3,32.5,157,0],[-299.4,169.6,15.3,32.5,157,0],[-313,175.3,15.3,32.5,157,0],[-7.5,52.9,18.6,32.5,157,1],[-123.6,102.2,17.8,32.5,157,1],[-23.3,59.6,15.3,32.5,157,0],[-37.5,65.7,15.3,32.5,157,0],[-51.8,71.7,15.3,32.5,157,0],[-66.1,77.8,15.3,32.5,157,0],[-80.4,83.8,15.3,32.5,157,0],[-94.7,89.9,15.3,32.5,157,0],[-108.2,95.6,15.3,32.5,157,0],[366.4,129.4,18.6,32.5,157,1],[236,184.7,17.8,32.5,157,1],[336.3,142.2,15.3,32.5,157,0],[350.6,136.1,15.3,32.5,157,0],[322,148.2,15.3,32.5,157,0],[307.8,154.3,15.3,32.5,157,0],[293.5,160.3,15.3,32.5,157,0],[279.2,166.4,15.3,32.5,157,0],[264.9,172.4,15.3,32.5,157,0],[251.4,178.2,15.3,32.5,157,0],[155.8,-110,18.6,32.5,-43,1],[248,-196.1,17.8,32.5,-43,1],[168.3,-121.7,15.3,32.5,-43,0],[179.7,-132.3,15.3,32.5,-43,0],[191,-142.9,15.3,32.5,-43,0],[202.4,-153.5,15.3,32.5,-43,0],[213.7,-164,15.3,32.5,-43,0],[225,-174.6,15.3,32.5,-43,0],[235.8,-184.7,15.3,32.5,-43,0],[296.5,-13.4,18.6,32.5,67,1],[340,89.2,17.8,32.5,67,1],[303.2,2.3,15.3,32.5,67,0],[309.3,16.6,15.3,32.5,67,0],[315.3,30.9,15.3,32.5,67,0],[321.4,45.2,15.3,32.5,67,0],[327.4,59.5,15.3,32.5,67,0],[333.5,73.7,15.3,32.5,67,0],[257.3,-122.7,18.6,32.5,67,1],[264,-107,15.3,32.5,67,0],[270,-92.7,15.3,32.5,67,0],[276.1,-78.4,15.3,32.5,67,0],[282.1,-64.1,15.3,32.5,67,0],[288.7,-48.7,17.8,32.5,67,1],[-365,94.5,18.6,32.5,-23,1],[-192.4,21.4,17.8,32.5,-23,1],[-349.6,88,14.5,32.5,-23,0],[-335.6,82.1,15.3,32.5,-23,0],[-321.4,76,15.3,32.5,-23,0],[-307.1,70,15.3,32.5,-23,0],[-292.8,63.9,15.3,32.5,-23,0],[-278.5,57.9,15.3,32.5,-23,0],[-264.2,51.8,15.3,32.5,-23,0],[-250,45.8,15.3,32.5,-23,0],[-235.7,39.7,15.3,32.5,-23,0],[-221.4,33.6,15.3,32.5,-23,0],[-207.9,27.9,15.3,32.5,-23,0],[243.4,9.1,18.7,33.7,67,1],[286.8,111.6,17.9,33.7,67,1],[249.9,24.7,14.6,33.7,67,0],[255.9,38.6,15.4,33.7,67,0],[262,53,15.4,33.7,67,0],[268.1,67.4,15.4,33.7,67,0],[274.2,81.8,15.4,33.7,67,0],[280.2,96.1,15.4,33.7,67,0],[209.9,23.3,18.7,33.7,67,1],[253.3,125.8,17.9,33.7,67,1],[216.4,38.9,14.6,33.7,67,0],[222.4,52.8,15.4,33.7,67,0],[228.5,67.2,15.4,33.7,67,0],[234.6,81.6,15.4,33.7,67,0],[240.7,96,15.4,33.7,67,0],[246.8,110.3,15.4,33.7,67,0],[-126,-42.3,18.6,32.5,7.5,1],[-47.1,-32,17.8,32.5,7.5,1],[-109.4,-40.1,14.5,32.5,7.5,0],[-94.5,-38.2,15.3,32.5,7.5,0],[-79.1,-36.2,15.3,32.5,7.5,0],[-63.7,-34.1,15.3,32.5,7.5,0],[-351.3,126.8,18.6,32.5,-23,1],[-178.7,53.7,17.8,32.5,-23,1],[-335.8,120.3,14.5,32.5,-23,0],[-321.9,114.4,15.3,32.5,-23,0],[-307.7,108.4,15.3,32.5,-23,0],[-293.4,102.3,15.3,32.5,-23,0],[-279.1,96.2,15.3,32.5,-23,0],[-264.8,90.2,15.3,32.5,-23,0],[-250.5,84.1,15.3,32.5,-23,0],[-236.2,78.1,15.3,32.5,-23,0],[-222,72,15.3,32.5,-23,0],[-207.7,66,15.3,32.5,-23,0],[-194.2,60.2,15.3,32.5,-23,0],[-148.2,14.4,18.6,32.5,7.5,1],[-69.3,24.7,17.8,32.5,7.5,1],[-131.6,16.6,14.5,32.5,7.5,0],[-116.6,18.5,15.3,32.5,7.5,0],[-101.3,20.5,15.3,32.5,7.5,0],[-85.9,22.6,15.3,32.5,7.5,0],[-466.5,123.8,131.3,47.2,-113,2],[-16.6,-113.9,130.5,48,-23,2],[25,-105.2,93.7,49,6.6,2]];
  var MARKERS = [
    ["01",-301,156,"unit"],["02",-385,93,"unit"],["03",-357,6,"unit"],["04",-139,-59,"unit"],["05",-50,16,"unit"],["06",-100,70,"unit"],["07",272,-187,"unit"],["08",254,-68,"unit"],["09",343,39,"unit"],["10",216,90,"unit"],["11",211,173,"unit"],["CD",-517,78,"cd"],["AC",33,-161,"ac"]];

  var PLAN_W = 1296, PLAN_D = 712;
  var BUILD_H = 17;     // ~26 ft at the plan's own scale - indicative
  var INSET = 1.2;      // hairline seam so neighbouring bays stay countable

  var TIER_COLOR = [0xb07f3e, 0x5b93cf, 0x386488];  // standard, premium, civic

  var state = null;

  function supported() {
    if (typeof global.THREE === 'undefined') return false;
    try {
      var c = document.createElement('canvas');
      return !!(global.WebGLRenderingContext &&
                (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function markerTexture(label) {
    var s = 128, c = document.createElement('canvas');
    c.width = c.height = s;
    var g = c.getContext('2d');
    g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 6, 0, Math.PI * 2);
    g.fillStyle = 'rgba(14,14,16,0.92)'; g.fill();
    g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.stroke();
    g.fillStyle = '#e8e8e8';
    g.font = '600 46px Figtree, system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, s / 2, s / 2 + 2);
    var t = new THREE.CanvasTexture(c);
    t.anisotropy = 2;
    return t;
  }

  function mount(host, opts) {
    if (!supported() || state) return false;
    opts = opts || {};

    var scene = new THREE.Scene();
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x0f1420, 1);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    var camera = new THREE.PerspectiveCamera(32, 1.82, 1, 6000);

    scene.add(new THREE.HemisphereLight(0x8fa8c8, 0x0a0d14, 0.95));
    var key = new THREE.DirectionalLight(0xffffff, 0.72);
    key.position.set(-420, 620, 380);
    scene.add(key);

    // ground datum + grid, so the masses read against a measured surface
    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry(PLAN_W * 1.25, PLAN_D * 1.5),
      new THREE.MeshLambertMaterial({ color: 0x0f1420 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2;
    scene.add(ground);

    var grid = new THREE.GridHelper(PLAN_W * 1.25, 26, 0x2a3550, 0x2a3550);
    grid.material.opacity = 0.18;
    grid.material.transparent = true;
    scene.add(grid);

    // one shared material per tier: 3 handles drive the whole filter
    var mats = TIER_COLOR.map(function (col) {
      return new THREE.MeshLambertMaterial({ color: col, transparent: true, opacity: 1 });
    });

    var groups = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
    groups.forEach(function (g) { scene.add(g); });

    var geoCache = {};
    BOXES.forEach(function (b) {
      var w = Math.max(b[2] - INSET, 1), d = Math.max(b[3] - INSET, 1);
      var k = w.toFixed(1) + 'x' + d.toFixed(1);
      if (!geoCache[k]) geoCache[k] = new THREE.BoxGeometry(w, BUILD_H, d);
      var m = new THREE.Mesh(geoCache[k], mats[b[5]]);
      m.position.set(b[0], BUILD_H / 2, b[1]);
      m.rotation.y = -b[4] * Math.PI / 180;
      groups[b[5]].add(m);
    });

    var pins = [];
    MARKERS.forEach(function (mk) {
      var mat = new THREE.SpriteMaterial({
        map: markerTexture(mk[0]), sizeAttenuation: false,
        transparent: true, depthTest: true
      });
      var sp = new THREE.Sprite(mat);
      sp.position.set(mk[1], BUILD_H + 22, mk[2]);
      sp.scale.set(0.042, 0.042, 1);
      sp.userData.cat = mk[3];
      sp.userData.tOpacity = 1;
      scene.add(sp); pins.push(sp);
    });

    // ---- orbit (hand-rolled; no second library) ----------------------------
    var az = -0.62, pol = 0.92, dist = 1250, tAz = az, tPol = pol, tDist = dist;
    var matTarget = [1, 1, 1];   // tier opacities the filter eases toward
    var reduce = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dragging = false, lx = 0, ly = 0, raf = null;

    function applyCamera() {
      var sp = Math.sin(pol), cp = Math.cos(pol);
      camera.position.set(dist * sp * Math.sin(az), dist * cp, dist * sp * Math.cos(az));
      camera.lookAt(0, BUILD_H * 0.6, 0);
    }

    function onDown(e) {
      dragging = true;
      var p = e.touches ? e.touches[0] : e;
      lx = p.clientX; ly = p.clientY;
      renderer.domElement.setPointerCapture && e.pointerId !== undefined &&
        renderer.domElement.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!dragging) return;
      var p = e.touches ? e.touches[0] : e;
      tAz -= (p.clientX - lx) * 0.006;
      tPol = Math.max(0.16, Math.min(1.45, tPol - (p.clientY - ly) * 0.005));
      lx = p.clientX; ly = p.clientY;
      if (e.cancelable) e.preventDefault();
    }
    function onUp() { dragging = false; }
    function onWheel(e) {
      tDist = Math.max(520, Math.min(2400, tDist + e.deltaY * 0.9));
      e.preventDefault();
    }
    function onKey(e) {
      var step = 0.14;
      if (e.key === 'ArrowLeft')  { tAz -= step; e.preventDefault(); }
      if (e.key === 'ArrowRight') { tAz += step; e.preventDefault(); }
      if (e.key === 'ArrowUp')    { tPol = Math.max(0.16, tPol - step * 0.6); e.preventDefault(); }
      if (e.key === 'ArrowDown')  { tPol = Math.min(1.45, tPol + step * 0.6); e.preventDefault(); }
    }

    var el = renderer.domElement;
    el.addEventListener('pointerdown', onDown);
    global.addEventListener('pointermove', onMove, { passive: false });
    global.addEventListener('pointerup', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    host.addEventListener('keydown', onKey);

    function resize() {
      var w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    var ro = global.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(host); else global.addEventListener('resize', resize);
    resize();

    function tick() {
      raf = requestAnimationFrame(tick);
      var k = reduce ? 1 : 0.12;
      az += (tAz - az) * k; pol += (tPol - pol) * k; dist += (tDist - dist) * k;
      // the filter eases here rather than snapping, so the massing view reads the
      // same as the 2D plan - one legend control, one behaviour
      var f = reduce ? 1 : 0.18;
      mats.forEach(function (m, i) { m.opacity += (matTarget[i] - m.opacity) * f; });
      pins.forEach(function (p) {
        p.material.opacity += (p.userData.tOpacity - p.material.opacity) * f;
      });
      applyCamera();
      renderer.render(scene, camera);
    }
    applyCamera();
    tick();

    state = {
      dispose: function () {
        cancelAnimationFrame(raf);
        el.removeEventListener('pointerdown', onDown);
        global.removeEventListener('pointermove', onMove);
        global.removeEventListener('pointerup', onUp);
        el.removeEventListener('wheel', onWheel);
        host.removeEventListener('keydown', onKey);
        if (ro) ro.disconnect(); else global.removeEventListener('resize', resize);
        Object.keys(geoCache).forEach(function (k) { geoCache[k].dispose(); });
        mats.forEach(function (m) { m.dispose(); });
        pins.forEach(function (p) { p.material.map.dispose(); p.material.dispose(); });
        ground.geometry.dispose(); ground.material.dispose();
        renderer.dispose();
        if (el.parentNode) el.parentNode.removeChild(el);
        state = null;
      },
      setFocus: function (cat) {
        // mirrors the 2D legend filter so both views share one mental model
        var on = [true, true, true];
        if (cat === 'ta')        on = [false, true, false];
        else if (cat === 'tb')   on = [true, false, false];
        else if (cat === 'unit') on = [true, true, false];
        else if (cat === 'cd' || cat === 'ac') on = [false, false, true];
        // write targets only; the render loop eases toward them
        matTarget = on.map(function (v) { return v ? 1 : 0.16; });
        pins.forEach(function (p) {
          p.userData.tOpacity = (!cat || cat === 'unit' || p.userData.cat === cat ||
                                ((cat === 'ta' || cat === 'tb') && p.userData.cat === 'unit')) ? 1 : 0.2;
        });
      }
    };
    return true;
  }

  global.LuxeMassing = {
    supported: supported,
    mount: mount,
    dispose: function () { if (state) state.dispose(); },
    setFocus: function (c) { if (state) state.setFocus(c); },
    isMounted: function () { return !!state; }
  };
})(window);
