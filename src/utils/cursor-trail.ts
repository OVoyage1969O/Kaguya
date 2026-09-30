type Point = { x: number; y: number };
let initialized = false;

/** A tapered ribbon follows ten damped points, settling fully when input stops. */
export function initCursorTrail() {
  if (initialized) return;
  const canvas = document.querySelector<HTMLCanvasElement>('[data-cursor-trail]');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;
  initialized = true;
  const surface = canvas;
  const ctx = context;
  const allowed = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const points: Point[] = Array.from({length:10},()=>({x:0,y:0}));
  const target: Point = {x:0,y:0};
  let frame = 0;
  let previous = 0;
  let movedAt = 0;
  let visible = false;
  let width = innerWidth;
  let height = innerHeight;
  let targetElement: Element | null = null;
  let pointerInside = false;
  let pressed = false;
  let mode = 'default';
  const interactive = 'a[href],button,summary,select,label,input[type="checkbox"],input[type="radio"],input[type="range"],input[type="button"],input[type="submit"],[role="button"],[role="tab"],[role="checkbox"]';
  const selected = '[aria-selected="true"],[aria-pressed="true"],[aria-checked="true"],[aria-current]:not([aria-current="false"]),input:checked,.nav-item-active,.tools-tab-btn-active';
  // The native hotspot is the arrow tip; the ribbon follows the attached mark.
  const center = () => {
    const offset = mode==='hover' ? 22 : mode==='pressed' ? 18 : 20;
    return { x: target.x+offset, y: target.y+offset+2 };
  };

  function syncState() {
    const root = document.documentElement;
    const element = targetElement?.isConnected ? targetElement : null;
    const disabled = element?.closest(':disabled,[aria-disabled="true"]');
    const busy = root.matches('.is-leaving,.is-rendering,[aria-busy="true"]') || element?.closest('[aria-busy="true"],[data-loading="true"],.is-loading');
    const label = element?.closest('label') as HTMLLabelElement | null;
    const checked = element?.closest(selected) || label?.control?.matches(':checked');
    const next = disabled ? 'disabled' : busy ? 'busy' : pressed && element?.closest(interactive) ? 'pressed' : checked ? 'selected' : element?.closest(interactive) ? 'hover' : 'default';
    if (next !== mode) {
      mode = next;
      root.dataset.cursorState = mode;
      if (pointerInside && allowed.matches && !reduced.matches) {
        if (!visible) {
          points.forEach(point=>Object.assign(point,center()));
          previous = performance.now();
          visible = true;
          surface.style.visibility = 'visible';
        }
        if (!frame) frame = requestAnimationFrame(draw);
      }
    }
  }

  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    visible = false;
    ctx.clearRect(0,0,width,height);
    surface.style.visibility = 'hidden';
  }
  function resize() {
    clear();
    width = innerWidth;
    height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1,2);
    surface.width = Math.round(width * ratio);
    surface.height = Math.round(height * ratio);
    surface.style.width = `${width}px`;
    surface.style.height = `${height}px`;
    ctx.setTransform(ratio,0,0,ratio,0,0);
  }
  function draw(now: number) {
    frame = 0;
    if (!allowed.matches || reduced.matches || document.hidden) {clear();return;}
    const elapsed = Math.min(3,Math.max(.25,(now-previous)/16.667));
    previous = now;
    points[0].x = center().x;
    points[0].y = center().y;
    for (let i=1;i<points.length;i++) {
      const point = points[i];
      const ahead = points[i-1];
      const distance = Math.hypot(ahead.x-point.x,ahead.y-point.y);
      const follow = 1-Math.pow(1-Math.min(.9,.41-i*.012+Math.max(0,distance-32)/160),elapsed);
      point.x += (ahead.x-point.x)*follow;
      point.y += (ahead.y-point.y)*follow;
      const gap = Math.hypot(ahead.x-point.x,ahead.y-point.y);
      if (gap>14) {
        point.x = ahead.x-(ahead.x-point.x)*14/gap;
        point.y = ahead.y-(ahead.y-point.y)*14/gap;
      }
    }
    ctx.clearRect(0,0,width,height);
    const idle = now-movedAt;
    const fade = Math.max(0,1-Math.max(0,idle-90)/260);
    const distances = [0];
    for (let i=1;i<points.length;i++) distances.push(distances[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
    const length = distances[distances.length-1];
    if (length>3 && fade>0 && mode!=='disabled' && mode!=='busy') {
      const left: Point[] = [];
      const right: Point[] = [];
      for (let i=0;i<points.length;i++) {
        const a = points[Math.max(0,i-1)];
        const b = points[Math.min(points.length-1,i+1)];
        const dx=b.x-a.x, dy=b.y-a.y;
        const span=Math.hypot(dx,dy)||1;
        const radius=(.35+7*Math.pow(1-distances[i]/length,.75))*fade;
        left.push({x:points[i].x-dy/span*radius,y:points[i].y+dx/span*radius});
        right.push({x:points[i].x+dy/span*radius,y:points[i].y-dx/span*radius});
      }
      const curve=(side:Point[])=>{
        for(let i=1;i<side.length-1;i++) ctx.quadraticCurveTo(side[i].x,side[i].y,(side[i].x+side[i+1].x)/2,(side[i].y+side[i+1].y)/2);
        ctx.lineTo(side[side.length-1].x,side[side.length-1].y);
      };
      ctx.globalAlpha=.85*fade;
      ctx.fillStyle='#d97757';
      ctx.beginPath();
      ctx.moveTo(left[0].x,left[0].y);
      curve(left);
      right.reverse();
      ctx.lineTo(right[0].x,right[0].y);
      curve(right);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha=1;
    }
    if (mode==='busy' && pointerInside) {
      ctx.strokeStyle='#d97757';
      ctx.lineWidth=2;
      ctx.lineCap='round';
      ctx.beginPath();
      const angle=(now%1000)/1000*Math.PI*2;
      ctx.arc(center().x,center().y,21,angle,angle+Math.PI*1.4);
      ctx.stroke();
      frame=requestAnimationFrame(draw);
      return;
    }
    if (idle>=350) {clear();return;}
    frame=requestAnimationFrame(draw);
  }
  function move(event:PointerEvent) {
    if (event.pointerType!=='mouse' || !allowed.matches) {clear();return;}
    const element = event.target instanceof Element ? event.target : null;
    targetElement=element;
    pointerInside=true;
    target.x=event.clientX;
    target.y=event.clientY;
    syncState();
    if (reduced.matches || mode==='disabled' || element?.closest('input,textarea,select,[contenteditable="true"],canvas:not([data-cursor-trail])')) {clear();return;}
    movedAt=performance.now();
    if (!visible) {
      points.forEach(point=>Object.assign(point,center()));
      previous=movedAt;
      visible=true;
      surface.style.visibility='visible';
    }
    if (!frame) frame=requestAnimationFrame(draw);
  }
  function leave() {
    pointerInside=false;
    targetElement=null;
    pressed=false;
    clear();
    syncState();
  }
  const mutations=new MutationObserver(syncState);
  // State can change under a stationary pointer (loading completion, checked, disabled).
  mutations.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['aria-busy','data-loading','aria-disabled','disabled','aria-selected','aria-pressed','aria-checked','aria-current','checked','class']});
  document.addEventListener('change',syncState);
  window.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'){pressed=true;syncState();}},{passive:true});
  window.addEventListener('pointerup',()=>{pressed=false;syncState();},{passive:true});
  window.addEventListener('pointercancel',()=>{pressed=false;syncState();});
  window.addEventListener('pointermove',move,{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('blur',leave);
  window.addEventListener('pagehide',leave);
  document.documentElement.addEventListener('pointerleave',leave);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)leave();});
  document.addEventListener('astro:page-load',()=>{clear();targetElement=pointerInside?document.elementFromPoint(target.x,target.y):null;syncState();});
  document.addEventListener('swup:willReplaceContent',clear);
  allowed.addEventListener('change',clear);
  reduced.addEventListener('change',clear);
  resize();
}
