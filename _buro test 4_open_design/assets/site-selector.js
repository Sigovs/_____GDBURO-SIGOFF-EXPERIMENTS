/* Luxe Corsa - suite selector -----------------------------------------------
   A massing study used as an instrument, not as an image. It answers one
   question - where in the campus does this tier actually sit - and it is
   deliberately kept out of the hero, because a grey volume study sells nothing.

   Every footprint comes from LUXE_SITE, measured off plan.svg, so the
   arrangement, the bay widths and the Premium/Standard split are the real ones.
   Building HEIGHT is the single indicative value; the plan carries no
   elevation, which is why the label beside it says massing study.

   API:  mount(host) · setTier('a' | 'b' | null) · setActive(bool) · dispose()
--------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var S = global.LUXE_SITE;

  var GROUND = 0x0b0d12;
  var TIER   = [0xb07f3e, 0x5b93cf, 0x4f7ea8];  // standard, premium, civic

  // the one composed view: close enough to fill a 2.35:1 frame, and flat enough
  // that the campus spreads across the width instead of stacking into it
  var HOME = { d: 1165, pol: 0.74, az: -0.52 };

  var PAD_OUT   = 66;      // how far the ground reaches past the outermost bay
  var PAD_H     = 7;       // plinth thickness - this is a model, so it has a base
  var PAD_TOP   = 0x141b18;
  var PAD_SIDE  = 0x090d11;
  var CROWN_COL = 0x33553f;
  var TRUNK_COL = 0x2a2b2c;

  /* ---- site pad ---------------------------------------------------------
     The ground is not a backdrop rectangle: it is the convex hull of all 125
     measured footprints, pushed out and rounded off, extruded into a plinth.
     So its silhouette is the site's own, and outside it the page shows through.
  --------------------------------------------------------------------- */
  function footprintCorners() {
    var pts = [];
    S.BOXES.forEach(function (b) {
      var a = -b[4] * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      var hw = b[2] / 2, hd = b[3] / 2;
      [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].forEach(function (c) {
        pts.push([b[0] + c[0] * ca + c[1] * sa, b[1] - c[0] * sa + c[1] * ca]);
      });
    });
    return pts;
  }

  function convexHull(pts) {                       // Andrew monotone chain
    pts = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cross(o, a, b) {
      return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    }
    var lo = [], up = [], i;
    for (i = 0; i < pts.length; i++) {
      while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], pts[i]) <= 0) lo.pop();
      lo.push(pts[i]);
    }
    for (i = pts.length - 1; i >= 0; i--) {
      while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], pts[i]) <= 0) up.pop();
      up.push(pts[i]);
    }
    lo.pop(); up.pop();
    return lo.concat(up);
  }

  function expand(poly, d) {
    var cx = 0, cz = 0;
    poly.forEach(function (p) { cx += p[0]; cz += p[1]; });
    cx /= poly.length; cz /= poly.length;
    return poly.map(function (p) {
      var vx = p[0] - cx, vz = p[1] - cz, L = Math.sqrt(vx * vx + vz * vz) || 1;
      return [p[0] + vx / L * d, p[1] + vz / L * d];
    });
  }

  function chaikin(poly, passes) {                 // rounds the hull's corners
    for (var k = 0; k < passes; k++) {
      var out = [];
      for (var i = 0; i < poly.length; i++) {
        var a = poly[i], b = poly[(i + 1) % poly.length];
        out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
        out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
      }
      poly = out;
    }
    return poly;
  }

  // stable pseudo-random: planting must not reshuffle between renders
  function rnd(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }
  var DIM  = 0.12;                               // filtered-out tiers

  var state = null;

  function supported() {
    if (typeof global.THREE === 'undefined' || !S) return false;
    try {
      var c = document.createElement('canvas');
      return !!(global.WebGLRenderingContext &&
                (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function pinTexture(label) {
    var s = 128, c = document.createElement('canvas');
    c.width = c.height = s;
    var g = c.getContext('2d');
    g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 7, 0, Math.PI * 2);
    g.fillStyle = 'rgba(7,8,11,0.86)'; g.fill();
    g.lineWidth = 4; g.strokeStyle = 'rgba(49,195,154,0.8)'; g.stroke();
    g.fillStyle = '#e9ecf1';
    g.font = '600 44px Archivo, system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, s / 2, s / 2 + 2);
    var t = new THREE.CanvasTexture(c);
    t.anisotropy = 2;
    return t;
  }

  function mount(host) {
    if (!supported() || state) return false;

    var lean = global.innerWidth < 820;

    var scene = new THREE.Scene();
    // fog is kept, but it fades toward the page ground rather than toward a
    // plate colour, so distance reads without ever drawing a box
    scene.fog = new THREE.FogExp2(GROUND, 0.00024);

    // transparent: the model sits ON the page instead of inside a viewport.
    // No clear colour, no ground plane, no grid - the campus is the object.
    var renderer = new THREE.WebGLRenderer({
      antialias: !lean, alpha: true, premultipliedAlpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, lean ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    // Shadows are what stop 125 boxes reading as a diagram: they tie the masses
    // to the ground. Nothing in the scene moves, so the map is drawn once and
    // then frozen - the orbit costs nothing extra.
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    var camera = new THREE.PerspectiveCamera(34, 1.6, 1, 9000);

    scene.add(new THREE.HemisphereLight(0x9fb6d6, 0x090b10, 0.58));
    var key = new THREE.DirectionalLight(0xffffff, 1.22);
    key.position.set(-520, 720, 400);
    key.castShadow = true;
    key.shadow.mapSize.set(lean ? 1024 : 2048, lean ? 1024 : 2048);
    key.shadow.bias = -0.0012;
    var sc = key.shadow.camera;
    sc.left = -900; sc.right = 900; sc.top = 700; sc.bottom = -700;
    sc.near = 150; sc.far = 2400;
    sc.updateProjectionMatrix();
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x6ea6dc, 0.42);
    rim.position.set(640, 260, -520);
    scene.add(rim);

    /* ---- the pad the model stands on ---------------------------------- */
    var padPoly = chaikin(expand(convexHull(footprintCorners()), PAD_OUT), 2);
    var padShape = new THREE.Shape();
    padShape.moveTo(padPoly[0][0], padPoly[0][1]);
    for (var pi = 1; pi < padPoly.length; pi++) padShape.lineTo(padPoly[pi][0], padPoly[pi][1]);
    padShape.closePath();
    var padGeo = new THREE.ExtrudeGeometry(padShape, { depth: PAD_H, bevelEnabled: false });
    padGeo.rotateX(Math.PI / 2);          // the shape is drawn in plan, so lay it flat
    var padMats = [
      new THREE.MeshStandardMaterial({ color: PAD_TOP,  roughness: 0.97, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: PAD_SIDE, roughness: 1,    metalness: 0 })
    ];
    var pad = new THREE.Mesh(padGeo, padMats);
    pad.position.y = -0.25;               // a hair below the bays, so no z-fighting
    pad.receiveShadow = true;
    scene.add(pad);

    /* one material per tier - three handles drive the whole filter */
    var mats = TIER.map(function (col) {
      return new THREE.MeshStandardMaterial({
        color: col, roughness: 0.82, metalness: 0.06, transparent: true, opacity: 1
      });
    });
    var edgeMats = TIER.map(function () {
      return new THREE.LineBasicMaterial({ color: 0x93a9c4, transparent: true, opacity: 0.3 });
    });

    var boxCache = {}, edgeCache = {};
    S.BOXES.forEach(function (b) {
      var w = Math.max(b[2] - S.INSET, 1), d = Math.max(b[3] - S.INSET, 1);
      var k = w.toFixed(1) + 'x' + d.toFixed(1);
      if (!boxCache[k]) boxCache[k] = new THREE.BoxGeometry(w, S.BUILD_H, d);
      var m = new THREE.Mesh(boxCache[k], mats[b[5]]);
      m.position.set(b[0], S.BUILD_H / 2, b[1]);
      m.rotation.y = -b[4] * Math.PI / 180;
      m.castShadow = true;
      scene.add(m);

      if (lean) return;
      if (!edgeCache[k]) edgeCache[k] = new THREE.EdgesGeometry(boxCache[k]);
      var e = new THREE.LineSegments(edgeCache[k], edgeMats[b[5]]);
      e.position.copy(m.position);
      e.rotation.y = m.rotation.y;
      scene.add(e);
    });


    /* ---- planting -------------------------------------------------------
       A screen belt on the pad edge, built from the studio's own chestnuts
       reduced to silhouettes. It is here for scale, not for decoration: a tree
       is a size everyone knows, so the bays stop reading as abstract boxes.
       The belt is schematic - it is not a landscape plan, and the note beside
       the model says which parts of this drawing are measured and which are
       indicative. */
    var planting = [];
    if (global.LUXE_TREES && global.LUXE_TREES.crowns && !lean) {
      var T = global.LUXE_TREES;
      var belt = chaikin(expand(convexHull(footprintCorners()), PAD_OUT - 22), 2);
      var spots = [], carry = 0, STEP = 46;
      for (var bi2 = 0; bi2 < belt.length; bi2++) {
        var p0 = belt[bi2], p1 = belt[(bi2 + 1) % belt.length];
        var dx = p1[0] - p0[0], dz = p1[1] - p0[1];
        var seg = Math.sqrt(dx * dx + dz * dz), t = carry;
        while (t < seg) { spots.push([p0[0] + dx * (t / seg), p0[1] + dz * (t / seg)]); t += STEP; }
        carry = t - seg;
      }

      var crownMat = new THREE.MeshStandardMaterial({
        color: CROWN_COL, roughness: 0.92, metalness: 0, flatShading: true });
      var trunkMat = new THREE.MeshStandardMaterial({ color: TRUNK_COL, roughness: 1, metalness: 0 });
      var trunkGeo = new THREE.CylinderGeometry(0.02, 0.032, T.CROWN_BASE, 5);
      trunkGeo.translate(0, T.CROWN_BASE / 2, 0);   // base at y=0 in unit-height space

      var buckets = T.crowns.map(function (c) {
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(c.v, 3));
        g.setIndex(c.i);
        g.computeVertexNormals();
        return { geo: g, list: [] };
      });
      spots.forEach(function (sp, i) { buckets[i % buckets.length].list.push(sp); });

      var dummy = new THREE.Object3D();
      var trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);
      trunks.castShadow = true;
      var tn = 0;
      buckets.forEach(function (bk, bidx) {
        if (!bk.list.length) return;
        var im = new THREE.InstancedMesh(bk.geo, crownMat, bk.list.length);
        im.castShadow = true;
        bk.list.forEach(function (sp, j) {
          var seed = bidx * 97 + j;
          dummy.position.set(sp[0], 0, sp[1]);
          dummy.rotation.set(0, rnd(seed + 1) * Math.PI * 2, 0);
          dummy.scale.setScalar(15 + rnd(seed) * 9);   // ~23 to 37 ft at plan scale
          dummy.updateMatrix();
          im.setMatrixAt(j, dummy.matrix);
          trunks.setMatrixAt(tn++, dummy.matrix);
        });
        im.instanceMatrix.needsUpdate = true;
        scene.add(im); planting.push(im);
      });
      trunks.count = tn;
      trunks.instanceMatrix.needsUpdate = true;
      scene.add(trunks); planting.push(trunks);
    }

    var pins = [];
    S.MARKERS.forEach(function (mk) {
      var mat = new THREE.SpriteMaterial({
        map: pinTexture(mk[0]), sizeAttenuation: false,
        transparent: true, opacity: 0.92, depthTest: false
      });
      var sp = new THREE.Sprite(mat);
      sp.position.set(mk[1], S.BUILD_H + 26, mk[2]);
      sp.scale.set(0.034, 0.034, 1);
      sp.renderOrder = 2;
      scene.add(sp); pins.push(sp);
    });

    /* ---- orbit ---------------------------------------------------------- */
    var reduce = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var az = HOME.az, pol = HOME.pol, dist = HOME.d;
    var tAz = az, tPol = pol, tDist = dist;
    var dragging = false, lx = 0, ly = 0, raf = null, active = true, touched = reduce;
    var shadowDrawn = false;

    // opacity targets, chased in the loop so a filter change reads as a settle
    var want = [1, 1, 1];

    function applyCamera() {
      var sp = Math.sin(pol), cp = Math.cos(pol);
      camera.position.set(dist * sp * Math.sin(az), 6 + dist * cp, dist * sp * Math.cos(az));
      camera.lookAt(0, 6, 0);
    }

    function onDown(e) {
      dragging = true; touched = true;
      var p = e.touches ? e.touches[0] : e;
      lx = p.clientX; ly = p.clientY;
      if (e.pointerId !== undefined && renderer.domElement.setPointerCapture) {
        renderer.domElement.setPointerCapture(e.pointerId);
      }
    }
    function onMove(e) {
      if (!dragging) return;
      var p = e.touches ? e.touches[0] : e;
      tAz -= (p.clientX - lx) * 0.006;
      tPol = Math.max(0.18, Math.min(1.24, tPol - (p.clientY - ly) * 0.005));
      lx = p.clientX; ly = p.clientY;
      if (e.cancelable) e.preventDefault();
    }
    function onUp() { dragging = false; }
    function onWheel(e) {
      touched = true;
      tDist = Math.max(620, Math.min(2200, tDist + e.deltaY * 0.9));
      e.preventDefault();
    }
    function onKey(e) {
      var step = 0.14, hit = true;
      if (e.key === 'ArrowLeft')       tAz -= step;
      else if (e.key === 'ArrowRight') tAz += step;
      else if (e.key === 'ArrowUp')    tPol = Math.max(0.18, tPol - step * 0.6);
      else if (e.key === 'ArrowDown')  tPol = Math.min(1.24, tPol + step * 0.6);
      else hit = false;
      if (hit) { touched = true; e.preventDefault(); }
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
      if (!active) return;
      // a very slow drift until the visitor takes hold, so the instrument reads
      // as live without ever competing with the copy beside it
      if (!touched) tAz += 0.0009;
      az   += (tAz - az) * 0.12;
      pol  += (tPol - pol) * 0.12;
      dist += (tDist - dist) * 0.12;
      mats.forEach(function (m, i) {
        m.opacity += (want[i] - m.opacity) * 0.16;
        edgeMats[i].opacity = 0.3 * m.opacity;
      });
      applyCamera();
      if (!shadowDrawn) { renderer.shadowMap.needsUpdate = true; shadowDrawn = true; }
      renderer.render(scene, camera);
    }
    applyCamera();
    tick();

    state = {
      setTier: function (t) {
        // 1 = Premium in the data, 0 = Standard; civic always recedes on a filter
        if (t === 'a')      want = [DIM, 1, DIM];
        else if (t === 'b') want = [1, DIM, DIM];
        else                want = [1, 1, 1];
        pins.forEach(function (p) { p.material.opacity = t ? 0.4 : 0.92; });
      },
      setActive: function (v) { active = !!v; },
      resize: resize,
      dispose: function () {
        cancelAnimationFrame(raf);
        el.removeEventListener('pointerdown', onDown);
        global.removeEventListener('pointermove', onMove);
        global.removeEventListener('pointerup', onUp);
        el.removeEventListener('wheel', onWheel);
        host.removeEventListener('keydown', onKey);
        if (ro) ro.disconnect(); else global.removeEventListener('resize', resize);
        Object.keys(boxCache).forEach(function (k) { boxCache[k].dispose(); });
        Object.keys(edgeCache).forEach(function (k) { edgeCache[k].dispose(); });
        mats.forEach(function (m) { m.dispose(); });
        edgeMats.forEach(function (m) { m.dispose(); });
        pins.forEach(function (p) { p.material.map.dispose(); p.material.dispose(); });
        planting.forEach(function (m) { m.geometry.dispose(); m.material.dispose(); });
        padGeo.dispose(); padMats.forEach(function (m) { m.dispose(); });
        renderer.dispose();
        if (el.parentNode) el.parentNode.removeChild(el);
        state = null;
      }
    };
    return true;
  }

  global.LuxeSelector = {
    supported: supported,
    mount: mount,
    isMounted: function () { return !!state; },
    setTier: function (t) { if (state) state.setTier(t); },
    setActive: function (v) { if (state) state.setActive(v); },
    dispose: function () { if (state) state.dispose(); }
  };
})(window);
