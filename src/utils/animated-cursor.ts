import cursorPack from '../../public/assets/cursors/manifest.json';
import { url } from './url-utils';

type CursorRole = keyof typeof cursorPack;
type CursorFrame = { x:number; y:number; width:number; height:number; hotX:number; hotY:number };
let initialized=false;

/** Windows cursor frames, timings and hotspots rendered without an OS installation. */
export function initAnimatedCursor() {
  if(initialized)return;
  const canvas=document.querySelector<HTMLCanvasElement>('[data-animated-cursor]');
  const context=canvas?.getContext('2d');
  if(!canvas||!context)return;
  initialized=true;
  const surface=canvas,ctx=context,root=document.documentElement;
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const images=new Map<CursorRole,HTMLImageElement>();
  let role:CursorRole='normal';
  let x=0,y=0,inside=false;
  let target:Element|null=null;
  let timer:ReturnType<typeof setTimeout>|undefined;
  let started=performance.now();
  let currentFrame:CursorFrame=cursorPack.normal.frames[0];

  function hide() {
    clearTimeout(timer);timer=undefined;
    surface.style.visibility='hidden';
    delete root.dataset.aniActive;
  }
  function imageFor(name:CursorRole) {
    let image=images.get(name);
    if(!image){
      image=new Image();
      image.onload=()=>{if(role===name&&inside)paint();};
      image.onerror=hide;
      image.src=url(`/assets/cursors/${name}.png`);
      images.set(name,image);
    }
    return image;
  }
  function position(){surface.style.transform=`translate3d(${x-currentFrame.hotX}px,${y-currentFrame.hotY}px,0)`;}
  function paint() {
    clearTimeout(timer);timer=undefined;
    if(!inside||!fine.matches||document.hidden){hide();return;}
    const image=imageFor(role);
    if(!image.complete||!image.naturalWidth){hide();return;}
    const pack=cursorPack[role];
    const period=pack.steps.reduce((total,step)=>total+step.duration,0);
    let remaining=reduced.matches?0:(performance.now()-started)%period;
    let step=pack.steps[0];
    for(const candidate of pack.steps){step=candidate;if(remaining<candidate.duration)break;remaining-=candidate.duration;}
    currentFrame=pack.frames[step.frame];
    const {width,height}=currentFrame;
    const ratio=Math.min(devicePixelRatio||1,2);
    if(surface.width!==Math.round(width*ratio)||surface.height!==Math.round(height*ratio)){
      surface.width=Math.round(width*ratio);surface.height=Math.round(height*ratio);
    }
    surface.style.width=`${width}px`;surface.style.height=`${height}px`;
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.drawImage(image,currentFrame.x,currentFrame.y,width,height,0,0,width,height);
    surface.dataset.frame=String(step.frame);
    position();
    surface.style.visibility='visible';
    root.dataset.aniActive='';
    if(!reduced.matches&&pack.steps.length>1)timer=setTimeout(paint,Math.max(8,step.duration-remaining));
  }
  const nativeRoles:Record<string,CursorRole>={
    pointer:'link',text:'text','vertical-text':'text',help:'help',progress:'working',wait:'busy',
    'not-allowed':'unavailable','no-drop':'unavailable',crosshair:'precision',cell:'precision',
    move:'move',grab:'move',grabbing:'move','all-scroll':'move',
    'ns-resize':'vertical','n-resize':'vertical','s-resize':'vertical','row-resize':'vertical',
    'ew-resize':'horizontal','e-resize':'horizontal','w-resize':'horizontal','col-resize':'horizontal',
    'nwse-resize':'diagonal1','nw-resize':'diagonal1','se-resize':'diagonal1',
    'nesw-resize':'diagonal2','ne-resize':'diagonal2','sw-resize':'diagonal2',
    'context-menu':'alternate','alias':'alternate','copy':'alternate',
  };
  function resolve():CursorRole {
    const element=target?.isConnected?target:null;
    if(element?.closest(':disabled,[aria-disabled="true"]'))return 'unavailable';
    if(root.matches('.is-leaving,.is-rendering,[aria-busy="true"]'))return 'busy';
    if(element?.closest('[aria-busy="true"],[data-loading="true"],.is-loading'))return 'working';
    const declared=element?.closest<HTMLElement>('[data-cursor-role]')?.dataset.cursorRole;
    if(declared&&declared in cursorPack)return declared as CursorRole;
    // Existing explicit native cursors (such as draggable/resizable handles) retain their meaning.
    for(let node=element;node&&node!==root;node=node.parentElement){
      const native=(node as HTMLElement).style?.cursor;
      if(native&&nativeRoles[native])return nativeRoles[native];
    }
    const inherited=element?getComputedStyle(element).getPropertyValue('--ani-role').trim():'';
    return inherited in cursorPack?inherited as CursorRole:'normal';
  }
  function sync() {
    const next=resolve();
    const changed=role!==next;
    role=next;
    root.dataset.aniCursorState=role;
    const first=cursorPack[role].frames[0];
    root.style.setProperty('--pack-cursor',`url("${url(`/assets/cursors/${role}.cur`)}") ${first.hotX} ${first.hotY}, ${role==='text'?'text':role==='link'?'pointer':role==='unavailable'?'not-allowed':'default'}`);
    if(changed){started=performance.now();paint();}
  }
  function leave(){inside=false;target=null;hide();}
  window.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||!fine.matches){leave();return;}
    const arriving=!inside;
    inside=true;x=event.clientX;y=event.clientY;
    target=event.target instanceof Element?event.target:null;
    sync();position();
    if(arriving){started=performance.now();paint();}
  },{passive:true});
  document.addEventListener('pointerover',event=>{if(inside){target=event.target instanceof Element?event.target:null;sync();}},{passive:true});
  window.addEventListener('blur',leave);
  window.addEventListener('pagehide',leave);
  root.addEventListener('pointerleave',leave);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)leave();});
  document.addEventListener('change',sync);
  document.addEventListener('astro:page-load',()=>{target=inside?document.elementFromPoint(x,y):null;sync();});
  const observer=new MutationObserver(sync);
  observer.observe(root,{subtree:true,attributes:true,attributeFilter:['class','aria-busy','data-loading','aria-disabled','disabled','data-cursor-role']});
  fine.addEventListener('change',leave);
  reduced.addEventListener('change',paint);
  window.addEventListener('resize',()=>{if(inside)paint();},{passive:true});
  imageFor('normal');
}
