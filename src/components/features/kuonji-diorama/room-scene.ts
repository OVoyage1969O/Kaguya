import * as T from 'three';
import { buildRoom, type RoomName } from './rooms';
import { bindDoorNavigation, leaveThroughDoor } from './door-navigation';

export function mountRoom(host:HTMLElement,name:RoomName) {
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.97;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  host.append(renderer.domElement);const canvas=renderer.domElement;canvas.tabIndex=0;
  canvas.setAttribute('aria-label','室内三维场景：拖拽或方向键环顾，滚轮缩放，点击有铭牌的门进入其他房间。Tab 可选择房间链接。');
  const scene=new T.Scene();scene.background=new T.Color(0x292825);
  const camera=new T.PerspectiveCamera(76,1,.05,60);camera.position.set(.15,2.03,4.25);
  let yaw=0,pitch=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const model=buildRoom(name);scene.add(model.root);
  scene.add(new T.HemisphereLight(0xc5d3e5,0x827263,1.35));
  const light=new T.DirectionalLight(0xdce6f3,1.4);light.position.set(4.8,4.35,.3);light.target.position.set(-2,.3,-1);scene.add(light,light.target);
  light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-9,right:9,top:8,bottom:-8,near:.1,far:24});light.shadow.normalBias=.025;
  const windowLight=new T.PointLight(0xc7dafa,11,15,2);windowLight.position.set(4.65,3,-1.3);scene.add(windowLight);
  const fill=new T.PointLight(0xffd5a4,5,12,2);fill.position.set(-2.5,3.65,.4);scene.add(fill);
  const look=()=>{camera.rotation.set(pitch,yaw,0,'YXZ');};
  let frame=0,disposed=false;
  const render=()=>{frame=0;if(!disposed&&!document.hidden){look();renderer.render(scene,camera);}};
  const request=()=>{if(!frame&&!disposed)frame=requestAnimationFrame(render);};
  let pointer:{id:number;x:number;y:number}|undefined;
  const fingers=new Map<number,{x:number;y:number}>();let pinch=0;
  const down=(e:PointerEvent)=>{fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(e.isPrimary&&e.button===0)pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);if(fingers.size===2){const p=[...fingers.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}};
  const move=(e:PointerEvent)=>{
    if(fingers.has(e.pointerId))fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(fingers.size===2){const p=[...fingers.values()],distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);camera.fov=T.MathUtils.clamp(camera.fov+(pinch-distance)*.08,38,92);camera.updateProjectionMatrix();pinch=distance;pointer=undefined;request();return;}
    if(pointer?.id!==e.pointerId)return;
    yaw-=(e.clientX-pointer.x)*.003;pitch=T.MathUtils.clamp(pitch-(e.clientY-pointer.y)*.003,-.8,.8);
    pointer.x=e.clientX;pointer.y=e.clientY;request();
  };
  const up=(e:PointerEvent)=>{fingers.delete(e.pointerId);if(pointer?.id===e.pointerId)pointer=undefined;};
  const wheel=(e:WheelEvent)=>{e.preventDefault();camera.fov=T.MathUtils.clamp(camera.fov+e.deltaY*.035,38,92);camera.updateProjectionMatrix();request();};
  const key=(e:KeyboardEvent)=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw+=.12;if(e.key==='ArrowRight')yaw-=.12;if(e.key==='ArrowUp')pitch=Math.min(.8,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(-.8,pitch-.1);if(['+','=','-'].includes(e.key)){camera.fov=T.MathUtils.clamp(camera.fov+(e.key==='-'?5:-5),38,92);camera.updateProjectionMatrix();}request();};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);
  const unbind=bindDoorNavigation(canvas,camera,[model.root],href=>leaveThroughDoor(canvas,href,reduced.matches));
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);request();};
  const observer=new ResizeObserver(resize);observer.observe(host);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else request();};document.addEventListener('visibilitychange',visibility);
  resize();look();renderer.render(scene,camera);host.dataset.sceneReady='true';
  if(!reduced.matches)canvas.animate([{opacity:0},{opacity:1}],{duration:950,easing:'ease-out'});
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);unbind();
    canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',key);
    canvas.getAnimations().forEach(a=>a.cancel());model.dispose();renderer.dispose();canvas.remove();delete host.dataset.sceneReady;};
}
