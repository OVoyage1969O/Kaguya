import * as T from 'three';

/** Real scene hit-testing; dragging or a second touch never activates a door. */
export function bindDoorNavigation(canvas: HTMLCanvasElement, camera: T.Camera, objects: T.Object3D[], onEnter: (href: string) => void) {
  const ray = new T.Raycaster(), pointer = new T.Vector2();
  let down: {x:number;y:number;id:number} | undefined, moved = false;
  const touches = new Set<number>();
  const hit = (e: PointerEvent) => {
    const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    ray.setFromCamera(pointer,camera);
    const intersect=ray.intersectObjects(objects,true).find(h=>!h.object.userData.ignoreDoorRay);
    let object=intersect?.object;
    while(object){if(typeof object.userData.href==='string')return object.userData.href as string;object=object.parent??undefined;}
    return undefined;
  };
  const start=(e:PointerEvent)=>{touches.add(e.pointerId);if(touches.size>1)moved=true;if(e.isPrimary&&e.button===0){down={x:e.clientX,y:e.clientY,id:e.pointerId};moved=touches.size>1;}};
  const move=(e:PointerEvent)=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)moved=true;canvas.style.cursor=down?'grabbing':hit(e)?'pointer':'grab';};
  const end=(e:PointerEvent)=>{touches.delete(e.pointerId);if(down?.id!==e.pointerId)return;const activate=!moved&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<=7;down=undefined;if(activate){const href=hit(e);if(href)onEnter(href);}};
  const cancel=(e:PointerEvent)=>{touches.delete(e.pointerId);moved=true;down=undefined;};
  canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',cancel);
  return ()=>{canvas.removeEventListener('pointerdown',start);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',end);canvas.removeEventListener('pointercancel',cancel);};
}

export function roomUrl(room='parlor') {return `${import.meta.env.BASE_URL.replace(/\/$/,'')}/kuonji/rooms/${room}/`;}

export function leaveThroughDoor(canvas:HTMLCanvasElement,href:string,reduced:boolean) {
  if(canvas.dataset.leaving)return;
  canvas.dataset.leaving='true';
  if(reduced){location.assign(href);return;}
  const animation=canvas.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1.035)'}],{duration:650,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
  void animation.finished.then(()=>location.assign(href)).catch(()=>{});
}
