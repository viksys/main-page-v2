/* ============================================================
   EARTH GLOBE — reach.html
   Loads assets/models/earth.glb  (real model)
   Wireframe fallback if GLB not present.
   No arc animations — just the clean rotating globe.
   Drag to rotate.
   ============================================================ */
(function () {

  function init() {
    var canvas = document.getElementById('earthCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    var W = canvas.clientWidth  || 500;
    var H = canvas.clientHeight || 500;
    if (W < 2 || H < 2) { setTimeout(init, 100); return; }

    /* ── RENDERER ── */
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 0, 3.4);
    camera.lookAt(0, 0, 0);

    /* Lights */
    scene.add(new THREE.AmbientLight(0xffffff, 0.30));
    var sun = new THREE.DirectionalLight(0xffffff, 0.90);
    sun.position.set(5, 3, 4); scene.add(sun);
    var orange = new THREE.DirectionalLight(0xea821d, 0.50);
    orange.position.set(-4, 1, 2); scene.add(orange);

    var earthGroup = new THREE.Group();
    scene.add(earthGroup);

    var R = 1.0;

    /* Start with a slight tilt — looks natural */

    /* Drag rotation */
    var dragging = false, lastX = 0, velY = 0;

    canvas.addEventListener('mousedown', function(e){ dragging=true; lastX=e.clientX; velY=0; });
    window.addEventListener('mouseup',   function(){ dragging=false; });
    window.addEventListener('mousemove', function(e){
      if (!dragging) return;
      velY = (e.clientX - lastX) * 0.010;
      earthGroup.rotation.y += velY;
      lastX = e.clientX;
    });
    canvas.addEventListener('touchstart', function(e){ dragging=true; lastX=e.touches[0].clientX; }, {passive:true});
    window.addEventListener('touchend',   function(){ dragging=false; });
    window.addEventListener('touchmove',  function(e){
      if (!dragging) return;
      velY = (e.touches[0].clientX - lastX) * 0.010;
      earthGroup.rotation.y += velY;
      lastX = e.touches[0].clientX;
    }, {passive:true});

    window.addEventListener('resize', function(){
      var nW = canvas.clientWidth, nH = canvas.clientHeight;
      if (nW < 2 || nH < 2) return;
      renderer.setSize(nW, nH);
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
    });

    /* ── BUILD WIREFRAME FALLBACK ── */
    function buildWireframe() {
      /* Grid lines */
      earthGroup.add(new THREE.Mesh(
        new THREE.SphereGeometry(R, 40, 20),
        new THREE.MeshBasicMaterial({ color:0xea821d, wireframe:true, transparent:true, opacity:0.16 })
      ));
      /* Dark inner */
      earthGroup.add(new THREE.Mesh(
        new THREE.SphereGeometry(R * 0.99, 24, 12),
        new THREE.MeshStandardMaterial({ color:0x060606, roughness:1 })
      ));
      /* Atmospheric glow */
      earthGroup.add(new THREE.Mesh(
        new THREE.SphereGeometry(R * 1.08, 20, 10),
        new THREE.MeshBasicMaterial({ color:0xea821d, transparent:true, opacity:0.04, side:THREE.BackSide })
      ));
    }

    /* ── LOAD GLB ── */
    if (typeof THREE.GLTFLoader !== 'undefined') {
      new THREE.GLTFLoader().load(
        'assets/models/earth.glb',
        function (gltf) {
          var obj = gltf.scene;
          var box = new THREE.Box3().setFromObject(obj);
          var sz  = new THREE.Vector3(); box.getSize(sz);
          var cen = new THREE.Vector3(); box.getCenter(cen);
          var sc  = (R * 2) / Math.max(sz.x, sz.y, sz.z);
          obj.scale.setScalar(sc);
          obj.position.sub(cen.multiplyScalar(sc));
          earthGroup.add(obj);
        },
        undefined,
        buildWireframe
      );
    } else {
      buildWireframe();
    }

    /* ── ANIMATE ── */
    var clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      var dt = clock.getDelta();
      var t  = clock.getElapsedTime();

      /* Auto-spin with inertia */
      if (!dragging) {
        velY *= 0.92;
        earthGroup.rotation.y += 0.08 * dt + velY;
      }



      renderer.render(scene, camera);
    }
    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 50); });
  } else {
    setTimeout(init, 50);
  }

})();