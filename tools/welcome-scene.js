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
  scene.add(new THREE.HemisphereLight(0xffffff, 0x627953, 3));
  const light = new THREE.DirectionalLight(0xffffff, 4);
  light.position.set(3, 5, 4); scene.add(light);
  const meal = new THREE.Group(); scene.add(meal);
  function mesh(geometry, color, x, y, z) {
    const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color, roughness: .6}));
    object.position.set(x,y,z); meal.add(object); return object;
  }
  mesh(new THREE.CylinderGeometry(1.35,1.2,.16,48), 0xfefdf3, 0,0,0);
  mesh(new THREE.TorusGeometry(1.2,.065,12,48),0xe2e8d3,0,.12,0).rotation.x=Math.PI/2;
  for(let i=0;i<7;i++) {
    const leaf=mesh(new THREE.SphereGeometry(.37,16,12), i%2?0x5f985d:0x83b176,
      -.55+Math.cos(i)*.3,.24,Math.sin(i)*.5);
    leaf.scale.set(1,.35,.7); leaf.rotation.y=i;
  }
  for(let i=0;i<5;i++) mesh(new THREE.SphereGeometry(.17,16,12),0xd78565,.15+i*.18,.25,.35+Math.sin(i)*.2);
  for(let i=0;i<3;i++) {
    const cube=mesh(new THREE.BoxGeometry(.42,.22,.4),0xd9ae75,.4,.25,-.55+i*.25);
    cube.rotation.y=i*.5;
  }
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
