import * as T from 'three';
import {gsap} from 'gsap';
import {mountRoomInteractions} from './room-interactions';
import { buildRoom, type RoomName } from './rooms';
import {buildHall} from './hall';
import {outlineInterior} from './line-interior';
import { bindDoorNavigation, leaveThroughDoor } from './door-navigation';

export function mountRoom(host:HTMLElement,name:RoomName) {
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.NoToneMapping;
  renderer.shadowMap.enabled=false;renderer.shadowMap.type=T.PCFSoftShadowMap;
  host.append(renderer.domElement);const canvas=renderer.domElement;canvas.tabIndex=0;
  canvas.setAttribute('aria-label','室内三维场景：拖拽或方向键环顾，滚轮缩放，点击有铭牌的门进入其他房间。Tab 可选择房间链接。');
  const scene=new T.Scene();scene.background=new T.Color(0x0b0c0e);
  const camera=new T.PerspectiveCamera(76,1,.05,60);camera.position.set(.15,2.03,4.25);
  if(name==='hall')camera.position.set(.15,2.03,4.9);
  if(name==='landing')camera.position.set(-4.1,6.43,3.8);
  let yaw=0,pitch=name==='hall'?.18:0;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const model=name==='hall'||name==='landing'?buildHall(name==='landing'):buildRoom(name);scene.add(model.root);
  const clearOutline=outlineInterior(model.root);
  const look=()=>{camera.rotation.set(pitch,yaw,0,'YXZ');};
  let frame=0,disposed=false;
  let entering=false,inspecting=false;
  let focusTween:gsap.core.Timeline|undefined;
  let savedView:{position:T.Vector3;yaw:number;pitch:number;fov:number}|undefined;
  let travel:gsap.core.Timeline|undefined;
  const render=()=>{frame=0;if(!disposed&&!document.hidden){look();renderer.render(scene,camera);}};
  const request=()=>{if(!frame&&!disposed)frame=requestAnimationFrame(render);};
  const inspect=(kind:string|null)=>{
    focusTween?.kill();
    if(kind){
      savedView??={position:camera.position.clone(),yaw,pitch,fov:camera.fov};inspecting=true;
      if(kind==='tea')return;
      const target=kind==='github'?{x:.2,y:2.05,z:-.6}:{x:1.42,y:2.05,z:-.45};
      const angles={yaw,pitch,fov:camera.fov};
      const update=()=>{yaw=angles.yaw;pitch=angles.pitch;camera.fov=angles.fov;camera.updateProjectionMatrix();request();};
      const duration=reduced.matches?0:1.4;
      focusTween=gsap.timeline({onUpdate:update}).to(camera.position,{...target,duration,ease:'power3.inOut'},0).to(angles,{yaw:innerWidth>=760?-.36:0,pitch:innerWidth>=760?0:-.14,fov:innerWidth>=760?55:76,duration,ease:'power3.inOut'},0);
    }else if(savedView){
      const previous=savedView;savedView=undefined;const angles={yaw,pitch,fov:camera.fov};
      focusTween=gsap.timeline({onUpdate:()=>{yaw=angles.yaw;pitch=angles.pitch;camera.fov=angles.fov;camera.updateProjectionMatrix();request();},onComplete:()=>{inspecting=false;}})
        .to(camera.position,{x:previous.position.x,y:previous.position.y,z:previous.position.z,duration:reduced.matches?0:1.1,ease:'power3.inOut'},0)
        .to(angles,{yaw:previous.yaw,pitch:previous.pitch,fov:previous.fov,duration:reduced.matches?0:1.1,ease:'power3.inOut'},0);
    }
  };
  const interactions=mountRoomInteractions(host,model.root,dark=>{clearOutline.setTheme(dark);scene.background=new T.Color(dark?0x0b0c0e:0xf7f7f5);request();},request,inspect);
  let pointer:{id:number;x:number;y:number}|undefined;
  const fingers=new Map<number,{x:number;y:number}>();let pinch=0;
  const down=(e:PointerEvent)=>{if(entering||inspecting)return;fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(e.isPrimary&&e.button===0)pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);if(fingers.size===2){const p=[...fingers.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}};
  const move=(e:PointerEvent)=>{if(entering||inspecting)return;
    if(fingers.has(e.pointerId))fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(fingers.size===2){const p=[...fingers.values()],distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);camera.fov=T.MathUtils.clamp(camera.fov+(pinch-distance)*.08,38,92);camera.updateProjectionMatrix();pinch=distance;pointer=undefined;request();return;}
    if(pointer?.id!==e.pointerId)return;
    yaw-=(e.clientX-pointer.x)*.003;pitch=T.MathUtils.clamp(pitch-(e.clientY-pointer.y)*.003,-.8,.8);
    pointer.x=e.clientX;pointer.y=e.clientY;request();
  };
  const up=(e:PointerEvent)=>{fingers.delete(e.pointerId);if(pointer?.id===e.pointerId)pointer=undefined;};
  const wheel=(e:WheelEvent)=>{e.preventDefault();if(entering||inspecting)return;camera.fov=T.MathUtils.clamp(camera.fov+e.deltaY*.035,38,92);camera.updateProjectionMatrix();request();};
  const key=(e:KeyboardEvent)=>{if(entering||inspecting)return;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw+=.12;if(e.key==='ArrowRight')yaw-=.12;if(e.key==='ArrowUp')pitch=Math.min(.8,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(-.8,pitch-.1);if(['+','=','-'].includes(e.key)){camera.fov=T.MathUtils.clamp(camera.fov+(e.key==='-'?5:-5),38,92);camera.updateProjectionMatrix();}request();};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);
  const unbind=bindDoorNavigation(canvas,camera,[model.root],href=>{
    if(entering||inspecting)return;
    if(interactions.handle(href))return;
    entering=true;
    const up=name==='hall'&&href.endsWith('/landing/');
    const down=name==='landing'&&href.endsWith('/hall/');
    if(reduced.matches||(!up&&!down)){leaveThroughDoor(canvas,href,reduced.matches);return;}
    yaw=0;pitch=-.08;
    travel=gsap.timeline({onUpdate:request,onComplete:()=>leaveThroughDoor(canvas,href,false)});
    if(up)travel.to(camera.position,{x:3.93,y:2.03,z:3.8,duration:.7,ease:'power2.inOut'})
      .to(camera.position,{x:3.93,y:4.03,z:-1.1,duration:1.2,ease:'power2.inOut'})
      .to(camera.position,{x:-2.5,y:6.43,z:-2.25,duration:1.5,ease:'power2.inOut'});
    else travel.to(camera.position,{x:-2.5,y:6.43,z:-2.25,duration:.8,ease:'power2.inOut'})
      .to(camera.position,{x:3.93,y:4.03,z:-1.1,duration:1.5,ease:'power2.inOut'})
      .to(camera.position,{x:3.93,y:2.03,z:3.8,duration:1.2,ease:'power2.inOut'});
  });
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);request();};
  const observer=new ResizeObserver(resize);observer.observe(host);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else request();};document.addEventListener('visibilitychange',visibility);
  resize();look();renderer.render(scene,camera);host.dataset.sceneReady='true';
  if(!reduced.matches)canvas.animate([{opacity:0},{opacity:1}],{duration:950,easing:'ease-out'});
  return ()=>{disposed=true;travel?.kill();focusTween?.kill();cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);unbind();interactions.dispose();
    canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',key);
    canvas.getAnimations().forEach(a=>a.cancel());clearOutline();model.dispose();renderer.dispose();canvas.remove();delete host.dataset.sceneReady;};
}
