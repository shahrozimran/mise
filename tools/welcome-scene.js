import * as THREE from 'three';
// Compiled into the app, including Three.js. No network or remote assets.
const canvas = document.querySelector('canvas');
let notified=false;
function ready() {
  if(notified) return; notified=true;
  document.body.dataset.ready='true';
  window.ReactNativeWebView?.postMessage('ready');
  if(parent!==window) parent.postMessage({type:'mise-ready'},'*');
}
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
  function resize() {
    if(!innerWidth || !innerHeight) return;
    renderer.setSize(innerWidth,innerHeight);
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);
  observer.observe(document.documentElement);
  addEventListener('resize',resize);
  resize();
  camera.position.set(0, 3, 4.2);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xCCD0CF, 0x06141B, 3));
  const light = new THREE.DirectionalLight(0xCCD0CF, 5);
  light.position.set(3, 5, 4); scene.add(light);
  const meal = new THREE.Group(); scene.add(meal);
  function mesh(geometry, color, x, y, z) {
    const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color, roughness: .28, metalness: .4}));
    object.position.set(x,y,z); meal.add(object); return object;
  }
  // A restrained silver dial, replacing the old cartoon meal illustration.
  const outer=mesh(new THREE.TorusGeometry(1.05,.055,20,96),0xCCD0CF,0,0,0);
  outer.rotation.x=.5;
  const inner=mesh(new THREE.TorusGeometry(.77,.028,16,80),0x9BA8AB,0,0,0);
  inner.rotation.x=-.5;
  const core=mesh(new THREE.SphereGeometry(.18,24,16),0x4A5C6A,0,0,0);
  core.material.metalness=.5;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let start=performance.now(), closing=false, closeAt=0, frame;
  addEventListener('message',event=>{ if(event.data?.type==='close') {closing=true; closeAt=performance.now();} });
  window.miseClose=()=>{closing=true;closeAt=performance.now();};
  function draw(now) {
    const t=(now-start)/1000;
    const scale= reduced ? 1 : closing ? Math.max(0,1-(now-closeAt)/420) : Math.min(1,t/1.1);
    meal.scale.setScalar(reduced ? 1 : 1-Math.pow(1-scale,3));
    meal.rotation.y=reduced ? .2 : t*.2;
    meal.position.y=reduced ? 0 : Math.sin(t*1.8)*.06;
    if(canvas.width>0 && canvas.height>0) {
      renderer.render(scene,camera);
      if(t > 1.1 || reduced) document.body.dataset.settled='true';
      ready();
    }
    if (!document.hidden) frame=requestAnimationFrame(draw);
  }
  frame=requestAnimationFrame(draw);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);if(!document.hidden)frame=requestAnimationFrame(draw);});
  addEventListener('pagehide',()=>{cancelAnimationFrame(frame);observer.disconnect();removeEventListener('resize',resize);scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});renderer.dispose();});
} catch {
  // Static, offline fallback for devices without WebGL support.
  canvas.style.display='none'; document.querySelector('#fallback').style.display='grid';
  ready();
  document.body.dataset.settled='true';
}
