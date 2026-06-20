/* ============================================================
   RADAR DISH — scroll-triggered animation
   Supports optional GLB via data-glb on the canvas element.
   Falls back to procedural model if no GLB supplied / load fails.

   How it works:
   - Dish starts tilted BACK (away from viewer, horizontal)
   - As section scrolls into view, dish rises to operational angle
   - Once open, pivot starts sweeping and beam fades in
   ============================================================ */
(function () {
  if (typeof THREE === 'undefined') return;

  document.querySelectorAll('.radar-canvas').forEach(function (canvas) {
    initRadar(canvas);
  });

  function initRadar(canvas) {
    var glbSrc = canvas.getAttribute('data-glb') || '';
    var wrap = canvas.parentElement;

    function getSize() {
      return { W: wrap.clientWidth || 420, H: wrap.clientHeight || 420 };
    }
    var sz = getSize();

    /* ── RENDERER ── */
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(sz.W, sz.H);
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;

    var scene = new THREE.Scene();

    /* ── CAMERA ── */
    /* Pull camera back and look from slightly above so nothing gets cropped */
    var camera = new THREE.PerspectiveCamera(40, sz.W / sz.H, 0.1, 100);
    camera.position.set(0, 1.0, 6.0);
    camera.lookAt(0, 0.3, 0);

    /* ── LIGHTS ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.28));
    var key = new THREE.DirectionalLight(0xffffff, 0.75);
    key.position.set(3, 4, 4);
    scene.add(key);
    var accent = new THREE.DirectionalLight(0xea821d, 0.55);
    accent.position.set(-3, 1, 1);
    scene.add(accent);

    /* ── SCROLL TRACKING ── */
    var scrollProgress = 0;

    function updateScroll() {
      var rect = canvas.getBoundingClientRect();
      var vh = window.innerHeight;
      /* starts at 0 when bottom of viewport hits element, reaches 1 when centred */
      var raw = 1.0 - (rect.top / vh);
      scrollProgress = Math.max(0, Math.min(1, raw));
    }
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    /* ── RESIZE ── */
    window.addEventListener('resize', function () {
      var s = getSize();
      renderer.setSize(s.W, s.H);
      camera.aspect = s.W / s.H;
      camera.updateProjectionMatrix();
      updateScroll();
    });

    /* ── ANIMATION STATE ── */
    var progress = 0;
    var pivot    = null; /* the sweep group — set by either GLB or procedural */
    var dish     = null; /* the tilt group */
    var beam     = null; /* THREE.Mesh with transparent material */
    var beamMat  = null;
    var clock    = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      var dt = clock.getDelta();
      var t  = clock.getElapsedTime();

      /* Ease progress toward scroll target */
      progress += (scrollProgress - progress) * 0.055;

      /* Dish tilt: starts at -1.1 (laid flat back) → rises to -0.15 (near-upright) */
      if (dish) {
        var targetTilt = -1.1 + progress * 0.95;
        dish.rotation.x += (targetTilt - dish.rotation.x) * 0.07;
      }

      /* Sweep rotation: starts once dish is 50% open */
      if (pivot && progress > 0.5) {
        pivot.rotation.y += dt * 0.5;
      }

      /* Beam fades in after 60% open, pulses */
      if (beamMat) {
        var bAlpha = Math.max(0, (progress - 0.6) * 2.5);
        beamMat.opacity = bAlpha * (0.55 + Math.sin(t * 3.2) * 0.35);
      }

      renderer.render(scene, camera);
    }
    animate();

    /* ── AUTO-FIT helper for GLB ── */
    function fitToView(obj, targetSize) {
      var box = new THREE.Box3().setFromObject(obj);
      var size = new THREE.Vector3();
      box.getSize(size);
      var center = new THREE.Vector3();
      box.getCenter(center);
      var scale = (targetSize || 2.5) / Math.max(size.x, size.y, size.z);
      obj.scale.setScalar(scale);
      obj.position.sub(center.multiplyScalar(scale));
    }

    /* ── TRY GLB FIRST ── */
    if (glbSrc && typeof THREE.GLTFLoader !== 'undefined') {
      var loader = new THREE.GLTFLoader();
      loader.load(glbSrc, function (gltf) {
        var obj = gltf.scene;
        fitToView(obj, 2.5);
        /* For a GLB we wrap in a pivot group and
           try to detect a rotating sub-mesh by name */
        var pivotGroup = new THREE.Group();
        pivotGroup.add(obj);
        scene.add(pivotGroup);
        pivot = pivotGroup;
        /* No dish tilt possible without knowing model hierarchy —
           so just use the sweep */
      }, undefined, function () {
        buildProcedural();
      });
    } else {
      buildProcedural();
    }

    /* ============================================================
       PROCEDURAL RADAR DISH
       Everything sized so camera at z=6 captures full dish
       ============================================================ */
    function buildProcedural() {
      var S = 0.72; /* global scale factor */

      var matMetal  = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, metalness: 0.75, roughness: 0.3 });
      var matDark   = new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0.5,  roughness: 0.5 });
      var matAccent = new THREE.MeshStandardMaterial({ color: 0xea821d, metalness: 0.2, roughness: 0.55, emissive: 0xea821d, emissiveIntensity: 0.18 });
      var matWire   = new THREE.MeshBasicMaterial({ color: 0xea821d, wireframe: true, transparent: true, opacity: 0.1 });
      beamMat = new THREE.MeshStandardMaterial({
        color: 0xea821d, emissive: 0xea821d, emissiveIntensity: 1.0,
        transparent: true, opacity: 0.0, side: THREE.FrontSide
      });

      /* ── BASE & MAST ── */
      var base = new THREE.Group();
      scene.add(base);

      function addTo(parent, geo, mat, x, y, z, rx) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set((x||0)*S, (y||0)*S, (z||0)*S);
        if (rx) m.rotation.x = rx;
        parent.add(m);
        return m;
      }

      /* Platform */
      addTo(base, new THREE.CylinderGeometry(0.55*S, 0.68*S, 0.12*S, 10), matMetal);
      /* Mast */
      addTo(base, new THREE.CylinderGeometry(0.09*S, 0.11*S, 1.55*S, 8), matMetal, 0, 0.84, 0);
      /* Mast ring accents */
      addTo(base, new THREE.CylinderGeometry(0.13*S, 0.13*S, 0.04*S, 10), matAccent, 0, 0.42, 0);
      addTo(base, new THREE.CylinderGeometry(0.13*S, 0.13*S, 0.04*S, 10), matAccent, 0, 1.08, 0);

      /* ── PIVOT (sweep rotation group) ── */
      var pivotGroup = new THREE.Group();
      pivotGroup.position.set(0, 1.62*S, 0);
      base.add(pivotGroup);
      pivot = pivotGroup;

      /* Pivot bracket */
      pivotGroup.add(function() {
        var m = new THREE.Mesh(new THREE.BoxGeometry(0.52*S, 0.11*S, 0.16*S), matMetal);
        return m;
      }());

      /* ── DISH (tilt rotation group) ── */
      var dishGroup = new THREE.Group();
      dishGroup.position.set(0, 0.1*S, 0);
      dishGroup.rotation.x = -1.1; /* start folded back */
      pivotGroup.add(dishGroup);
      dish = dishGroup;

      /* Support arm */
      var armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06*S, 0.5*S, 0.06*S), matDark);
      armMesh.position.set(0, 0.2*S, 0.26*S);
      armMesh.rotation.x = 0.5;
      dishGroup.add(armMesh);

      /* Dish rings (concentric, forming parabola) */
      var rings = 8;
      for (var r = 0; r < rings; r++) {
        var t0 = r / (rings - 1);
        var radius = (0.12 + t0 * 1.08) * S;
        var yOff   = (0.55 - t0 * t0 * 0.52) * S;
        var ring = new THREE.Mesh(
          new THREE.TorusGeometry(radius, 0.016*S, 6, 28),
          matMetal
        );
        ring.position.set(0, yOff, 0);
        ring.rotation.x = Math.PI / 2 - t0 * 0.28;
        dishGroup.add(ring);
      }

      /* Dish spokes (8 radial) */
      for (var sp = 0; sp < 8; sp++) {
        var ang = (sp / 8) * Math.PI * 2;
        var spoke = new THREE.Mesh(
          new THREE.CylinderGeometry(0.011*S, 0.011*S, 1.18*S, 4),
          matMetal
        );
        spoke.rotation.z = ang;
        spoke.position.set(Math.cos(ang)*0.52*S, 0.28*S, Math.sin(ang)*0.1*S);
        dishGroup.add(spoke);
      }

      /* Feed horn */
      var horn = new THREE.Mesh(new THREE.CylinderGeometry(0.07*S, 0.04*S, 0.28*S, 8), matAccent);
      horn.position.set(0, 1.0*S, 0);
      dishGroup.add(horn);
      var hornTip = new THREE.Mesh(new THREE.SphereGeometry(0.05*S, 8, 6), matAccent);
      hornTip.position.set(0, 1.18*S, 0);
      dishGroup.add(hornTip);

      /* Wireframe cap */
      var wfMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.1*S, 8, 5, 0, Math.PI),
        matWire
      );
      wfMesh.position.set(0, 0.32*S, 0);
      wfMesh.rotation.y = Math.PI;
      dishGroup.add(wfMesh);

      /* Radar beam cone — opens from feed horn */
      var beamMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.48*S, 2.0*S, 16, 1, true),
        beamMat
      );
      beamMesh.rotation.x = -Math.PI; /* point outward from horn */
      beamMesh.position.set(0, 2.1*S, 0);
      dishGroup.add(beamMesh);
    }
  }
})();