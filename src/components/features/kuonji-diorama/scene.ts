import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildKuonji } from './model';
import { bindDoorNavigation, leaveThroughDoor, roomUrl } from './door-navigation';

export function mountKuonji(host: HTMLElement) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.domElement.setAttribute('aria-label', '久远寺宅微缩三维模型，可拖拽或方向键旋转，滚轮、双指或加减键缩放；点击正门或按回车进入门廊');
  renderer.domElement.tabIndex = 0;
  host.append(renderer.domElement);
  const scene = new T.Scene();
  scene.background = new T.Color(0x202a32);
  scene.fog = new T.Fog(0x202a32, 45, 95);
  const camera = new T.OrthographicCamera(-12,12,12,-12,.1,160);
  camera.position.set(17,13.5,21);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0,3,0);
  controls.enableDamping = true; controls.dampingFactor = .07;
  controls.minZoom = .55; controls.maxZoom = 2.6;
  controls.minPolarAngle = .18; controls.maxPolarAngle = Math.PI*.49;
  controls.enablePan = false; controls.rotateSpeed = .6; controls.zoomSpeed = .7;
  scene.add(new T.HemisphereLight(0xc6dbe2,0x66604f,2.4));
  const moon = new T.DirectionalLight(0xd6e7f2,3.1);moon.position.set(-9,17,9);
  moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);
  Object.assign(moon.shadow.camera,{left:-12,right:12,top:14,bottom:-12,near:.1,far:55});
  moon.shadow.normalBias=.035;moon.shadow.bias=-.0002;scene.add(moon);
  const rim = new T.DirectionalLight(0xbfc8e3,1.4);rim.position.set(6,10,-10);scene.add(rim);
  const model=buildKuonji();scene.add(model.root);
  for(const [x,y,z] of [[4.35,3.35,-1.1],[-.55,3.1,1.48],[.58,2.8,-1.2]]) {
    const glow=new T.PointLight(0xffcc87,2.7,4,2);glow.position.set(x,y,z);scene.add(glow);
  }
  const floorGeo=new T.PlaneGeometry(200,200),floorMat=new T.ShadowMaterial({color:0x0c141a,opacity:.28,depthWrite:false});
  const floor=new T.Mesh(floorGeo,floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.2;floor.receiveShadow=true;scene.add(floor);
  // Tiny drifting motes, not a particle storm. No continuous work in reduced motion.
  const particleGeo=new T.BufferGeometry(), positions=new Float32Array(42*3);
  for(let i=0;i<42;i++){positions[i*3]=Math.sin(i*12.89)*6;positions[i*3+1]=1.5+(i%9)*.58;positions[i*3+2]=Math.cos(i*5.72)*5.8;}
  particleGeo.setAttribute('position',new T.BufferAttribute(positions,3));
  const particleMat=new T.PointsMaterial({color:0xc5d4c2,size:.035,transparent:true,opacity:.42,depthWrite:false});
  const particles=new T.Points(particleGeo,particleMat);scene.add(particles);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const doorGeo=new T.BoxGeometry(1.24,1.88,.055);
  const doorMat=new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
  const entrance=new T.Mesh(doorGeo,doorMat);entrance.position.set(-.56,2.8,1.37);entrance.userData.href=roomUrl('hall');scene.add(entrance);
  const unbindDoor=bindDoorNavigation(renderer.domElement,camera,[model.root,entrance],href=>leaveThroughDoor(renderer.domElement,href,reduced.matches));
  let disposed=false,frame=0,last=0,active=true;
  const render=()=>renderer.render(scene,camera);
  const keyboard=(event: KeyboardEvent)=>{
    if(event.key==='Enter'){event.preventDefault();leaveThroughDoor(renderer.domElement,roomUrl('hall'),reduced.matches);return;}
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key))return;
    event.preventDefault();
    if(['+','=','-'].includes(event.key)) {
      camera.zoom=T.MathUtils.clamp(camera.zoom*(event.key==='-'?.9:1.1),controls.minZoom,controls.maxZoom);camera.updateProjectionMatrix();
    } else {
      const spherical=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if(event.key==='ArrowLeft')spherical.theta-=.1;
      if(event.key==='ArrowRight')spherical.theta+=.1;
      if(event.key==='ArrowUp')spherical.phi-=.08;
      if(event.key==='ArrowDown')spherical.phi+=.08;
      spherical.phi=T.MathUtils.clamp(spherical.phi,controls.minPolarAngle,controls.maxPolarAngle);
      camera.position.copy(new T.Vector3().setFromSpherical(spherical).add(controls.target));
    }
    controls.update();render();
  };
  renderer.domElement.addEventListener('keydown',keyboard);
  const tick=(time:number)=>{
    frame=0;if(disposed||!active||document.hidden)return;
    if(time-last>1000/45){controls.update();if(!reduced.matches)particles.rotation.y=Math.sin(time*.000018)*.04;render();last=time;}
    if(!reduced.matches)frame=requestAnimationFrame(tick);
  };
  const start=()=>{if(!frame&&!disposed&&active&&!document.hidden)frame=requestAnimationFrame(tick);};
  const change=()=>{if(reduced.matches){controls.enableDamping=false;render();}else{controls.enableDamping=true;start();}};
  controls.addEventListener('change',()=>{if(reduced.matches)render();});
  reduced.addEventListener('change',change);
  const resize=()=>{
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    const aspect=w/h,span=aspect<1?11.7/aspect:11.7;
    camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;
    camera.updateProjectionMatrix();renderer.setSize(w,h);render();
  };
  const observer=new ResizeObserver(resize);observer.observe(host);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();};
  document.addEventListener('visibilitychange',visibility);
  const intersection=new IntersectionObserver(([entry])=>{active=entry.isIntersecting;if(active)start();else{cancelAnimationFrame(frame);frame=0;}});intersection.observe(host);
  controls.update();resize();change();start();
  host.dataset.sceneReady='true';
  return ()=>{
    disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();
    document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',change);
    renderer.domElement.removeEventListener('keydown',keyboard);
    unbindDoor();doorGeo.dispose();doorMat.dispose();
    controls.dispose();model.dispose();floorGeo.dispose();floorMat.dispose();particleGeo.dispose();particleMat.dispose();
    renderer.dispose();renderer.domElement.remove();delete host.dataset.sceneReady;
  };
}
