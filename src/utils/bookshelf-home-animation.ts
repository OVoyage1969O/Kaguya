import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { navigateToPage } from './navigation-utils';
import { riseIntoPlace } from './editorial-motion';

gsap.registerPlugin(ScrollTrigger);

export function mountBookshelfAnimations():()=>void {
  const root=document.querySelector<HTMLElement>('[data-bk-root]');
  if(!root||root.dataset.bkMounted)return ()=>{};
  root.dataset.bkMounted='true';
  const events=new AbortController();
  const media=gsap.matchMedia();
  let disposed=false;
  let resultAnimations:Animation[]=[];
  const input=root.querySelector<HTMLInputElement>('[data-atlas-search]');
  const filters=[...root.querySelectorAll<HTMLButtonElement>('[data-atlas-filter]')];
  const entries=[...root.querySelectorAll<HTMLAnchorElement>('[data-atlas-entry]')];
  const result=root.querySelector<HTMLElement>('[data-atlas-result]');
  const empty=root.querySelector<HTMLElement>('[data-atlas-empty]');
  const clear=root.querySelector<HTMLButtonElement>('[data-atlas-clear]');
  const params=new URLSearchParams(location.search);
  let selected=filters.some(button=>button.dataset.atlasFilter===params.get('category'))?params.get('category')!:'all';
  if(input)input.value=params.get('q')||'';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');

  function filter(writeUrl=false,animate=false) {
    const query=(input?.value||'').trim().toLocaleLowerCase();
    const words=query.split(/\s+/).filter(Boolean);
    resultAnimations.forEach(animation=>animation.cancel());resultAnimations=[];
    const visible:HTMLElement[]=[];
    entries.forEach(entry=>{
      const text=(entry.dataset.search||'').toLocaleLowerCase();
      entry.hidden=!(selected==='all'||entry.dataset.category===selected)||!words.every(word=>text.includes(word));
      if(!entry.hidden)visible.push(entry);
    });
    filters.forEach(button=>{const active=button.dataset.atlasFilter===selected;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    if(result)result.textContent=query?`找到 ${visible.length} 个匹配词条`:`共 ${visible.length} 个词条`;
    if(empty)empty.hidden=visible.length>0;
    if(clear)clear.hidden=!input?.value;
    if(writeUrl){
      const target=new URL(location.href);
      if(query)target.searchParams.set('q',input?.value.trim()||'');else target.searchParams.delete('q');
      if(selected!=='all')target.searchParams.set('category',selected);else target.searchParams.delete('category');
      history.replaceState(history.state,'',target);
    }
    if(animate&&!reduced.matches)visible.slice(0,8).forEach((entry,index)=>resultAnimations.push(riseIntoPlace(entry,index*25,10)));
  }
  input?.addEventListener('input',event=>{if(!(event as InputEvent).isComposing)filter(true);},{signal:events.signal});
  input?.addEventListener('compositionend',()=>filter(true),{signal:events.signal});
  filters.forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.atlasFilter||'all';filter(true,true);},{signal:events.signal}));
  const reset=()=>{selected='all';if(input)input.value='';filter(true,true);input?.focus({preventScroll:true});};
  clear?.addEventListener('click',()=>{if(input)input.value='';filter(true);input?.focus({preventScroll:true});},{signal:events.signal});
  root.querySelector('[data-atlas-reset]')?.addEventListener('click',reset,{signal:events.signal});
  root.querySelector('[data-atlas-search-form]')?.addEventListener('submit',event=>{event.preventDefault();filter(true);},{signal:events.signal});
  root.querySelector<HTMLElement>('[data-atlas-random]')?.addEventListener('click',event=>{
    const links:string[]=JSON.parse((event.currentTarget as HTMLElement).dataset.entries||'[]');
    if(links.length)navigateToPage(links[Math.floor(Math.random()*links.length)]);
  },{signal:events.signal});
  filter();

  const context=gsap.context(()=>{
    media.add('(prefers-reduced-motion: no-preference)',()=>{
      const books=[...root.querySelectorAll<HTMLElement>('[data-atlas-book]')];
      const fragments:HTMLElement[]=[];
      const titles=root.querySelectorAll<HTMLElement>('[data-atlas-title]');
      const blur=root.querySelector('[data-atlas-blur]');
      const counters=[...root.querySelectorAll<HTMLElement>('[data-atlas-number]')];
      const entrance=gsap.timeline({defaults:{ease:'expo.out'}});
      if(blur){gsap.set(blur,{attr:{stdDeviation:2.2}});gsap.set(titles,{filter:'url(#atlas-type-flow)'});}
      entrance.from(titles,{y:24,opacity:0,duration:.95,stagger:.09,clearProps:'transform,opacity'},0);
      if(blur)entrance.to(blur,{attr:{stdDeviation:0},duration:.8},.1).set(titles,{clearProps:'filter'},.95);
      entrance.from(root.querySelectorAll('[data-atlas-intro]'),{y:15,opacity:0,duration:.75,stagger:.08,clearProps:'transform,opacity'},.2);
      entrance.from(books,{x:(i:number)=>(2-i)*20,y:38,rotation:(i:number)=>(i-2)*3,opacity:0,duration:1,stagger:.075,clearProps:'transform,opacity'},.25);
      // The covers reassemble from strips of the actual artwork; no placeholder plates.
      books.forEach((book,index)=>{
        const cover=book.querySelector<HTMLElement>('.atlas-book__cover');
        const image=cover?.querySelector<HTMLImageElement>('img');
        if(!cover||!image||book.classList.contains('atlas-book--typemoon'))return;
        for(let strip=0;strip<4;strip++){
          const piece=document.createElement('span');piece.className='atlas-book__fragment';piece.setAttribute('aria-hidden','true');
          piece.style.cssText=`position:absolute;inset:0;background-image:url("${image.src}");background-size:cover;background-position:center;clip-path:inset(${strip*25}% 0 ${75-strip*25}% 0);pointer-events:none`;
          cover.append(piece);fragments.push(piece);
          entrance.from(piece,{x:strip%2?18:-18,y:(strip-1.5)*8,opacity:0,duration:.72},.3+index*.075+strip*.055);
        }
      });
      entrance.add(()=>fragments.forEach(fragment=>fragment.remove()),1.7);
      counters.forEach(counter=>{
        const end=Number(counter.dataset.atlasNumber)||0;const state={value:0};
        entrance.to(state,{value:end,duration:.75,onUpdate:()=>{counter.textContent=String(Math.round(state.value));},onComplete:()=>{counter.textContent=String(end);}},.25);
      });
      root.querySelectorAll<HTMLElement>('[data-atlas-volume]').forEach(volume=>{
        const timeline=gsap.timeline({scrollTrigger:{trigger:volume,start:'top 86%',once:true}});
        const page=volume.querySelector('[data-atlas-page]');
        timeline.from(volume.querySelector('.atlas-volume__content'),{y:20,opacity:0,duration:.85,clearProps:'transform,opacity'},0);
        if(page)timeline.fromTo(page,{scaleX:1},{scaleX:0,duration:1,ease:'power3.inOut'},0);
        timeline.from(volume.querySelector('img'),{scale:1.08,duration:1.2,ease:'power3.out',clearProps:'transform'},0);
      });
      gsap.from(root.querySelectorAll('[data-atlas-character]'),{y:28,opacity:0,duration:1,stagger:.08,clearProps:'transform,opacity',scrollTrigger:{trigger:root.querySelector('#characters'),start:'top 82%',once:true}});
      const shelf=root.querySelector<HTMLElement>('.atlas-shelf');
      const canvas=root.querySelector<HTMLCanvasElement>('[data-atlas-canvas]');
      const ctx=canvas?.getContext('2d');
      let progress=0,highlight=-1;
      const draw=()=>{
        if(!canvas||!ctx||!shelf||innerWidth<=600)return;
        const rect=shelf.getBoundingClientRect();const ratio=Math.min(devicePixelRatio||1,2);
        canvas.width=rect.width*ratio;canvas.height=rect.height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);
        const nodes=books.map(book=>book.offsetLeft+book.offsetWidth/2);
        if(!nodes.length)return;
        const color=getComputedStyle(root).getPropertyValue('--primary').trim();
        ctx.strokeStyle=color;ctx.fillStyle=color;ctx.globalAlpha=.35;ctx.lineWidth=1;
        const y=rect.height-2;
        ctx.beginPath();ctx.moveTo(nodes[0],y);ctx.lineTo(nodes[0]+(nodes[nodes.length-1]-nodes[0])*progress,y);ctx.stroke();
        nodes.forEach((x,index)=>{ctx.globalAlpha=index===highlight ? .75 : .25;ctx.beginPath();ctx.arc(x,y,index===highlight?2.5:1.4,0,Math.PI*2);ctx.fill();});
      };
      if(shelf&&canvas){
        ScrollTrigger.create({trigger:root.querySelector('.atlas-hero'),start:'top 30%',end:'bottom top',onUpdate:trigger=>{progress=trigger.progress;draw();}});
        books.forEach((book,index)=>{book.addEventListener('pointerenter',()=>{highlight=index;draw();},{signal:events.signal});book.addEventListener('pointerleave',()=>{highlight=-1;draw();},{signal:events.signal});});
        const resize=new ResizeObserver(draw);resize.observe(shelf);
        const theme=new MutationObserver(draw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
        draw();
        return ()=>{resize.disconnect();theme.disconnect();fragments.forEach(fragment=>fragment.remove());counters.forEach(counter=>{counter.textContent=counter.dataset.atlasNumber||'';});ctx?.clearRect(0,0,canvas.width,canvas.height);};
      }
      return ()=>fragments.forEach(fragment=>fragment.remove());
    });
  },root);
  void document.fonts.ready.then(()=>{if(!disposed)ScrollTrigger.refresh();});
  return ()=>{disposed=true;events.abort();resultAnimations.forEach(animation=>animation.cancel());media.revert();context.revert();delete root.dataset.bkMounted;};
}

let dispose:(()=>void)|undefined;
let initialized=false;
export function initBookshelfLifecycle(){
  if(initialized)return;initialized=true;
  const cleanup=()=>{dispose?.();dispose=undefined;};
  const boot=()=>{if(document.querySelector<HTMLElement>('[data-bk-root]')?.dataset.bkMounted)return;cleanup();dispose=mountBookshelfAnimations();};
  let bound=false;
  const bind=()=>{if(bound||!window.swup?.hooks)return;bound=true;window.swup.hooks.before('content:replace',cleanup);window.swup.hooks.on('page:view',boot);};
  document.addEventListener('swup:enable',bind);document.addEventListener('astro:before-swap',cleanup);document.addEventListener('astro:page-load',boot);
  window.addEventListener('pagehide',cleanup);window.addEventListener('pageshow',boot);
  bind();boot();
}
