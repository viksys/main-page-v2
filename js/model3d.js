/* ============================================================
   TABLET MODEL — products.html + any page with #tabletCanvas
   Loads assets/models/tablet.glb via GLTFLoader
   Falls back to procedural rugged GCS tablet
   Mouse-follow tilt, permanent 50° forward tilt, slow Y spin
   ============================================================ */
(function () {

  function init() {
    var canvas = document.getElementById('tabletCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    var W = canvas.clientWidth  || 500;
    var H = canvas.clientHeight || 400;
    if (W < 2 || H < 2) { setTimeout(init, 100); return; }

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100);
    camera.position.set(0, 0.5, 4.0);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.38));
    var key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(2, 5, 5); scene.add(key);
    var fill = new THREE.DirectionalLight(0xea821d, 0.5);
    fill.position.set(-4, 0, 2); scene.add(fill);
    var rim = new THREE.DirectionalLight(0xffffff, 0.22);
    rim.position.set(0, -3, -4); scene.add(rim);

    /* 50° permanent forward tilt so screen faces viewer */
    var TILT_X  = Math.PI * 0.285;
    var rotTargX = TILT_X, rotCurX = TILT_X;
    var rotTargY = 0.2,    rotCurY = 0.2;
    var autoRot  = 0;
    var isDrag   = false, prevX = 0, prevY = 0;
    var modelGroup = null;
    var matLine, matBar;

    var section = canvas.closest('section') || document.body;
    section.addEventListener('mousemove', function (e) {
      if (!modelGroup) return;
      var r = canvas.getBoundingClientRect();
      rotTargY += ((e.clientX - r.left) / r.width  - 0.5) * 0.012;
      rotTargX  = Math.max(TILT_X - 0.25, Math.min(TILT_X + 0.25,
        rotTargX - ((e.clientY - r.top)  / r.height - 0.5) * 0.008));
    });
    section.addEventListener('mouseleave', function () {
      rotTargX += (TILT_X - rotTargX) * 0.05;
    });

    window.addEventListener('resize', function () {
      var nW = canvas.clientWidth, nH = canvas.clientHeight;
      if (nW < 2 || nH < 2) return;
      renderer.setSize(nW, nH);
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
    });

    var clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      var dt = clock.getDelta();
      var t  = clock.getElapsedTime();

      autoRot  += dt * 0.22;
      rotTargX += (TILT_X - rotTargX) * 0.025;
      rotCurX  += (rotTargX - rotCurX) * 0.08;
      rotCurY  += (rotTargY - rotCurY) * 0.08;

      if (modelGroup) {
        modelGroup.rotation.x = rotCurX;
        modelGroup.rotation.y = rotCurY + autoRot;
        modelGroup.position.y = Math.sin(t * 0.75) * 0.04;
      }
      if (matLine) matLine.emissiveIntensity = 0.7 + Math.sin(t * 1.9) * 0.3;
      if (matBar)  matBar.emissiveIntensity  = 0.6 + Math.sin(t * 0.65) * 0.2;

      renderer.render(scene, camera);
    }
    animate();

    function fitToView(obj, size) {
      var box = new THREE.Box3().setFromObject(obj);
      var sz  = new THREE.Vector3(); box.getSize(sz);
      var cen = new THREE.Vector3(); box.getCenter(cen);
      var sc  = size / Math.max(sz.x, sz.y, sz.z);
      obj.scale.setScalar(sc);
      obj.position.sub(cen.multiplyScalar(sc));
    }

    if (typeof THREE.GLTFLoader !== 'undefined') {
      new THREE.GLTFLoader().load('assets/models/tablet.glb', function (gltf) {
        var obj = gltf.scene;
        /* Stand upright — screen faces viewer */
        obj.rotation.set(0, Math.PI / 2, Math.PI / 2);
        fitToView(obj, 2.0);
        var g = new THREE.Group();
        g.add(obj);
        scene.add(g);
        modelGroup = g;
        /* Then apply the viewer-facing tilt */
        g.rotation.x = TILT_X;
        rotCurX = TILT_X;
      }, undefined, buildProcedural);
    } else {
      buildProcedural();
    }

    function buildProcedural() {
      var g = new THREE.Group();
      scene.add(g);
      modelGroup = g;
      var S = 0.65;

      var mBody   = new THREE.MeshStandardMaterial({ color:0x1c1c1c, metalness:0.5,  roughness:0.55 });
      var mRubber = new THREE.MeshStandardMaterial({ color:0x0e0e0e, metalness:0.0,  roughness:0.95 });
      var mScreen = new THREE.MeshStandardMaterial({ color:0x060e1a, metalness:0.0,  roughness:0.05, emissive:0x0a1a30, emissiveIntensity:0.4 });
      var mOrange = new THREE.MeshStandardMaterial({ color:0xea821d, metalness:0.2,  roughness:0.5,  emissive:0xea821d, emissiveIntensity:0.12 });
      var mMetal  = new THREE.MeshStandardMaterial({ color:0x2a2a2a, metalness:0.8,  roughness:0.25 });
      var mGlass  = new THREE.MeshStandardMaterial({ color:0x88ccff, transparent:true, opacity:0.10, emissive:0x1133ff, emissiveIntensity:0.05 });
      var mGreen  = new THREE.MeshStandardMaterial({ color:0x1a6b3a, emissive:0x00ff44, emissiveIntensity:0.9 });
      var mRed    = new THREE.MeshStandardMaterial({ color:0x6b1a1a, emissive:0xff2200, emissiveIntensity:0.9 });
      var mMap    = new THREE.MeshStandardMaterial({ color:0x0d1a10, emissive:0xea821d, emissiveIntensity:0.07, roughness:1 });
      var mBBar   = new THREE.MeshStandardMaterial({ color:0x0d2040, emissive:0x1a3a70, emissiveIntensity:0.9, roughness:1 });
      var mPanel  = new THREE.MeshStandardMaterial({ color:0x050d18, emissive:0x0a2040, emissiveIntensity:0.5, roughness:1 });
      var mStatus = new THREE.MeshStandardMaterial({ color:0x0a1020, emissive:0x1040a0, emissiveIntensity:0.6, roughness:1 });
      var mDLine  = new THREE.MeshStandardMaterial({ color:0xea821d, emissive:0xea821d, emissiveIntensity:1.0, roughness:1 });
      matLine = mDLine; matBar = mBBar;

      function b(w,h,d,m,x,y,z) {
        var o=new THREE.Mesh(new THREE.BoxGeometry(w*S,h*S,d*S),m);
        o.position.set((x||0)*S,(y||0)*S,(z||0)*S); g.add(o); return o;
      }
      function sph(r,m,x,y,z) {
        var o=new THREE.Mesh(new THREE.SphereGeometry(r*S,10,8),m);
        o.position.set((x||0)*S,(y||0)*S,(z||0)*S); g.add(o); return o;
      }
      function cyl(rt,rb,h,m,x,y,z) {
        var o=new THREE.Mesh(new THREE.CylinderGeometry(rt*S,rb*S,h*S,8),m);
        o.position.set((x||0)*S,(y||0)*S,(z||0)*S); g.add(o); return o;
      }

      /* Body + bumpers */
      b(3.4,2.1,0.22,mBody);
      b(3.5,0.08,0.34,mRubber,0,1.09,0);   b(3.5,0.08,0.34,mRubber,0,-1.09,0);
      b(0.08,2.27,0.34,mRubber,1.79,0,0);  b(0.08,2.27,0.34,mRubber,-1.79,0,0);
      [[1.73,1.03],[-1.73,1.03],[1.73,-1.03],[-1.73,-1.03]].forEach(function(c){ sph(0.14,mRubber,c[0],c[1],0.05); });
      /* Screen */
      b(2.88,1.70,0.01,mScreen,0,0.06,0.115);
      b(2.88,1.70,0.005,mGlass,0,0.06,0.120);
      /* UI zones */
      b(2.88,0.16,0.002,mBBar,0,0.88,0.122);
      b(1.50,1.30,0.001,mMap,-0.60,0.02,0.122);
      b(0.92,1.30,0.001,mPanel,0.95,0.02,0.122);
      b(2.88,0.10,0.001,mStatus,0,-0.82,0.122);
      [0.45,0.25,0.05,-0.15,-0.35,-0.55].forEach(function(ly){ b(0.65,0.018,0.001,mDLine,0.95,ly,0.123); });
      b(0.35,0.010,0.001,mDLine,-0.42,0.10,0.123);
      b(0.010,0.35,0.001,mDLine,-0.42,0.10,0.123);
      sph(0.04,mDLine,-0.42,0.10,0.124);
      /* Buttons */
      [0.6,0.3,0.0,-0.3].forEach(function(by,i){
        var m=i===0?mGreen:(i===1?mRed:mMetal);
        var o=new THREE.Mesh(new THREE.CylinderGeometry(0.06*S,0.06*S,0.05*S,8),m);
        o.rotation.x=Math.PI/2; o.position.set(1.66*S,by*S,0.06*S); g.add(o);
      });
      for(var k=0;k<4;k++) b(0.18,0.09,0.04,mMetal,-0.9+k*0.44,0.98,0.13);
      b(0.45,0.12,0.04,mRubber,-1.25,-0.82,0.13);
      b(0.12,0.45,0.04,mRubber,-1.25,-0.82,0.13);
      sph(0.065,mMetal,-1.25,-0.82,0.155);
      /* LEDs */
      sph(0.025,new THREE.MeshStandardMaterial({color:0x00ff44,emissive:0x00ff44,emissiveIntensity:1.2}),-1.55,0.88,0.13);
      sph(0.025,new THREE.MeshStandardMaterial({color:0xea821d,emissive:0xea821d,emissiveIntensity:1.2}),-1.40,0.88,0.13);
      /* Antenna */
      cyl(0.04,0.05,0.12,mMetal,1.55,1.14,0);
      cyl(0.015,0.015,0.35,mMetal,1.55,1.38,0);
      /* Ports + accent */
      b(0.18,0.06,0.04,mMetal,0.5,-1.08,0);
      b(0.10,0.06,0.04,mMetal,-0.5,-1.08,0);
      b(3.42,0.025,0.24,mOrange,0,0,-0.01);

      g.rotation.x = TILT_X;
      rotCurX = TILT_X; rotTargX = TILT_X;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 50); });
  } else {
    setTimeout(init, 50);
  }

})();