/* ============================================================
   VTOL — interactive drone  (vtol-scroll.js)
   Canvas: #vtolScroll
   - Loads assets/models/vtol.glb via GLTFLoader
   - Falls back to procedural VTOL if file missing
   - Drone placed RIGHT of centre in world space (x = +1.2)
   - Mouse over section tilts the drone
   - Slow Y auto-spin
   ============================================================ */
(function () {

  function init() {
    var canvas = document.getElementById('vtolScroll');
    if (!canvas || typeof THREE === 'undefined') return;

    /* Give canvas its pixel dimensions from CSS */
    var W = canvas.clientWidth  || 800;
    var H = canvas.clientHeight || 500;
    if (W < 2 || H < 2) {
      /* CSS not applied yet — retry after layout */
      setTimeout(init, 100);
      return;
    }

    /* ── RENDERER ── */
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;

    var scene  = new THREE.Scene();

    /* Camera — narrow FOV, looking at OFFSET RIGHT point */
    var OFFSET_X = 2.0; /* drone world X — pushes it further right */
    var camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
    camera.position.set(OFFSET_X, 0.3, 6.2);
    camera.lookAt(OFFSET_X, 0, 0);

    /* Lights */
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    var sun = new THREE.DirectionalLight(0xffffff, 0.92);
    sun.position.set(4, 7, 6); scene.add(sun);
    var rim = new THREE.DirectionalLight(0xea821d, 0.72);
    rim.position.set(-5, -1, 3); scene.add(rim);

    /* Mouse tilt — relative to the section element */
    var mNX = 0, mNY = 0, mIX = 0, mIY = 0;
    var section = document.getElementById('vtolSection') || canvas.closest('section') || document.body;
    section.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      mNX = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      mNY = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    });
    section.addEventListener('mouseleave', function () { mNX = 0; mNY = 0; });

    window.addEventListener('resize', function () {
      var nW = canvas.clientWidth, nH = canvas.clientHeight;
      if (nW < 2 || nH < 2) return;
      renderer.setSize(nW, nH);
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
    });

    var droneGroup = null;
    var propGroups = [];
    var clock = new THREE.Clock();

    /* Auto-fit GLB bounding box to targetSize world units */
    function fitToView(obj, targetSize) {
      var box = new THREE.Box3().setFromObject(obj);
      var sz  = new THREE.Vector3(); box.getSize(sz);
      var cen = new THREE.Vector3(); box.getCenter(cen);
      var sc  = targetSize / Math.max(sz.x, sz.y, sz.z);
      obj.scale.setScalar(sc);
      obj.position.sub(cen.multiplyScalar(sc));
    }

    /* ── ANIMATE ── */
    function animate() {
      requestAnimationFrame(animate);
      var dt = clock.getDelta();
      var t  = clock.getElapsedTime();

      mIX += (mNX - mIX) * 0.07;
      mIY += (mNY - mIY) * 0.07;

      if (droneGroup) {
        /* Place drone at OFFSET_X so it's right-aligned in the canvas */
        droneGroup.position.x = OFFSET_X;
        droneGroup.position.y = Math.sin(t * 0.85) * 0.06;
        /* Slow Y spin */
        droneGroup.rotation.y += dt * 0.26;
        /* Tilt toward mouse */
        droneGroup.rotation.x += (-mIY * 0.28 - droneGroup.rotation.x) * 0.06;
        droneGroup.rotation.z += (-mIX * 0.18 - droneGroup.rotation.z) * 0.06;
      }

      propGroups.forEach(function (pg, i) {
        pg.rotation.y += (i % 2 === 0 ? 0.26 : -0.26);
      });

      rim.intensity = 0.55 + Math.sin(t * 1.1) * 0.15;
      renderer.render(scene, camera);
    }
    animate();

    /* ── LOAD GLB or FALL BACK ── */
    if (typeof THREE.GLTFLoader !== 'undefined') {
      new THREE.GLTFLoader().load(
        'assets/models/vtol.glb',
        function (gltf) {
          var obj = gltf.scene;
          fitToView(obj, 3.0);
          var g = new THREE.Group();
          g.add(obj);
          scene.add(g);
          droneGroup = g;
        },
        undefined,
        buildProcedural   /* error callback = use procedural */
      );
    } else {
      buildProcedural();
    }

    /* ── PROCEDURAL VTOL ── */
    function buildProcedural() {
      var g = new THREE.Group();
      scene.add(g);
      droneGroup = g;

      var mBody = new THREE.MeshStandardMaterial({ color:0x1a1a1a, metalness:0.72, roughness:0.28 });
      var mDark = new THREE.MeshStandardMaterial({ color:0x0e0e0e, metalness:0.5,  roughness:0.5  });
      var mAcc  = new THREE.MeshStandardMaterial({ color:0xea821d, metalness:0.2,  roughness:0.5, emissive:0xea821d, emissiveIntensity:0.14 });
      var mProp = new THREE.MeshStandardMaterial({ color:0x181818, metalness:0.4,  roughness:0.5, transparent:true, opacity:0.80, side:THREE.DoubleSide });
      var mGls  = new THREE.MeshStandardMaterial({ color:0x3377bb, transparent:true, opacity:0.42, emissive:0x1133aa, emissiveIntensity:0.35, roughness:0 });
      var mNavG = new THREE.MeshStandardMaterial({ color:0x00ff44, emissive:0x00ff44, emissiveIntensity:1.4 });
      var mNavR = new THREE.MeshStandardMaterial({ color:0xff2200, emissive:0xff2200, emissiveIntensity:1.4 });
      var mNavW = new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0xffffff, emissiveIntensity:1.6 });

      function bx(w,h,d,m,x,y,z) {
        var o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
        o.position.set(x||0,y||0,z||0); g.add(o); return o;
      }
      function cy(rt,rb,h,s,m,x,y,z,rx) {
        var o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,s),m);
        o.position.set(x||0,y||0,z||0); if(rx)o.rotation.x=rx; g.add(o); return o;
      }
      function sp(r,s,m,x,y,z) {
        var o=new THREE.Mesh(new THREE.SphereGeometry(r,s,s),m);
        o.position.set(x||0,y||0,z||0); g.add(o); return o;
      }

      /* Fuselage */
      bx(0.50,0.24,1.65,mBody);
      var ng=new THREE.Mesh(new THREE.CylinderGeometry(0,0.22,0.50,7),mBody);
      ng.rotation.x=-Math.PI/2; ng.position.set(0,0,-1.08); g.add(ng);
      var tg=new THREE.Mesh(new THREE.CylinderGeometry(0,0.19,0.44,7),mBody);
      tg.rotation.x=Math.PI/2; tg.position.set(0,0,1.05); g.add(tg);
      bx(0.52,0.034,1.66,mAcc,0,0.12,0);
      var cg=new THREE.Mesh(new THREE.SphereGeometry(0.15,12,8,0,Math.PI*2,0,Math.PI*0.52),mGls);
      cg.rotation.x=Math.PI/2; cg.position.set(0,0.07,-0.82); g.add(cg);
      /* Wing */
      bx(2.85,0.036,0.44,mBody,0,0.05,0.10);
      bx(2.87,0.014,0.020,mAcc,0,0.05,-0.10);
      bx(0.036,0.18,0.24,mBody, 1.45,0.12,0.10);
      bx(0.036,0.18,0.24,mBody,-1.45,0.12,0.10);
      bx(0.020,0.38,0.28,mBody,0,0.23,0.86);
      bx(0.76,0.020,0.19,mBody,0,0.07,0.90);
      /* Arms + props */
      [[-0.88,0.04,0.50],[0.88,0.04,0.50],[-0.88,0.04,-0.50],[0.88,0.04,-0.50]].forEach(function(p,i){
        var am=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.028,0.80,8),mDark);
        am.rotation.z=Math.PI/2; am.position.set(p[0]*0.5,p[1],p[2]); g.add(am);
        cy(0.090,0.072,0.15,12,mBody,  p[0],p[1]+0.04,p[2]);
        cy(0.100,0.100,0.020,12,mAcc,  p[0],p[1]+0.08,p[2]);
        var pg=new THREE.Group(); pg.position.set(p[0],p[1]+0.12,p[2]);
        for(var b2=0;b2<2;b2++){
          var bl=new THREE.Mesh(new THREE.BoxGeometry(0.50,0.009,0.054),mProp);
          bl.rotation.y=b2*Math.PI; bl.rotation.z=0.07; pg.add(bl);
        }
        pg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.016,8),mAcc));
        g.add(pg); propGroups.push(pg);
      });
      /* Skids */
      [[-0.19,-0.18,0.07],[0.19,-0.18,0.07]].forEach(function(p){
        bx(0.020,0.052,0.76,mDark,p[0],p[1],p[2]);
      });
      [[-0.19,-0.158,-0.26],[-0.19,-0.158,0.34],[0.19,-0.158,-0.26],[0.19,-0.158,0.34]].forEach(function(p){
        bx(0.16,0.020,0.020,mDark,p[0],p[1],p[2]);
      });
      /* Sensor */
      sp(0.088,10,mDark,0,-0.165,-0.11);
      sp(0.035, 8,mGls, 0,-0.252,-0.11);
      /* Nav lights */
      sp(0.020,6,mNavR,-1.45,0.12,0.10);
      sp(0.020,6,mNavG, 1.45,0.12,0.10);
      sp(0.016,6,mNavW, 0,   0.25,0.86);
    }

  } /* end init() */

  /* Run after DOM + CSS are settled */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 50); });
  } else {
    setTimeout(init, 50);
  }

})();