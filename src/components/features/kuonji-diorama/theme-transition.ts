import {gsap} from 'gsap';

/**
 * 「入宅」卧室床沿的明暗过场：黑白线稿的日月交替。
 * 幕布本身就是目标主题的渐变，上下各带一条渐变软边——过场因此是"洗"过画面而不是硬切；
 * 幕布完全覆盖时才在背后交接主题。日月为线稿图形：太阳是暖核加长短芒线，月亮是双弧月牙。
 */

const NS='http://www.w3.org/2000/svg';
const node=<K extends keyof SVGElementTagNameMap>(tag:K,attrs:Record<string,string|number>={})=>{const el=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));return el;};

const HORIZON=470;
const SUN={x:498,y:288};
const MOON={x:706,y:604};
/** 白昼与夜晚两端：太阳沉到地平线以下，月亮升到天顶附近。 */
const SUN_SET={x:-58,y:318};
const MOON_RISE={x:58,y:-326};
const MOON_R=54;
const MOON_INNER=30;
const SPARKLES:readonly (readonly [number,number,number])[]=[[338,222,6],[426,168,9],[522,104,7],[704,128,8],[796,196,6]];
const LABEL={dark:'DAYFALL / 日落 · 入夜',light:'DAYBREAK / 日出 · 天明'};

let sequence=0;

export type ThemeTransition={play(toDark:boolean,commit:()=>void):boolean;dispose():void};

export function createThemeTransition():ThemeTransition{
  const uid=++sequence;
  const glowId=`kuonji-glow-${uid}`;
  const clipId=`kuonji-sky-${uid}`;
  const panel=document.createElement('div');panel.className='kuonji-theme-transition';
  const slide=document.createElement('div');slide.className='kt-slide';
  const svg=node('svg',{viewBox:'0 0 1200 800',preserveAspectRatio:'xMidYMid slice','aria-hidden':'true'});

  // 柔光用单色径向渐变，深浅随主题走。
  const defs=node('defs');
  const clip=node('clipPath',{id:clipId});clip.append(node('rect',{x:-600,y:-600,width:2400,height:HORIZON+600}));
  const glow=node('radialGradient',{id:glowId,cx:'50%',cy:'50%',r:'50%'});
  glow.append(node('stop',{class:'kt-glow-stop',offset:'0%','stop-opacity':'.24'}),node('stop',{class:'kt-glow-stop',offset:'100%','stop-opacity':'0'}));
  defs.append(clip,glow);
  const halo=(x:number,y:number,r:number)=>{const disc=node('circle',{class:'kt-glow',cx:x,cy:y,r});disc.style.fill=`url(#${glowId})`;return disc;};

  // 星子只在夜里亮起，用四角星而非圆点。
  const stars=node('g',{class:'kt-stars'});
  for(const [x,y,r] of SPARKLES)stars.append(node('path',{class:'kt-fine',d:`M${x} ${y-r}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r}Q${x} ${y} ${x-r} ${y}Q${x} ${y} ${x} ${y-r}Z`}));

  // 太阳：核 + 虚线光环 + 长短相间的十二道芒。
  const sun=node('g',{class:'kt-sun'});
  sun.append(halo(SUN.x,SUN.y,120));
  sun.append(node('circle',{cx:SUN.x,cy:SUN.y,r:40}));
  sun.append(node('circle',{class:'kt-fine',cx:SUN.x,cy:SUN.y,r:55,'stroke-dasharray':'3 9'}));
  const rays=node('g',{class:'kt-rays'});
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6;
    const cos=Math.cos(angle);
    const sin=Math.sin(angle);
    const outer=i%2?86:106;
    rays.append(node('line',{class:'kt-ray',x1:SUN.x+cos*68,y1:SUN.y+sin*68,x2:SUN.x+cos*outer,y2:SUN.y+sin*outer}));
  }
  sun.append(rays);

  // 月亮：双弧月牙 + 两点月海 + 一圈细光环。
  const moon=node('g',{class:'kt-moon'});
  moon.append(halo(MOON.x,MOON.y,112));
  moon.append(node('path',{d:`M${MOON.x} ${MOON.y-MOON_R}A${MOON_R} ${MOON_R} 0 1 0 ${MOON.x} ${MOON.y+MOON_R}A${MOON_INNER} ${MOON_INNER} 0 0 1 ${MOON.x} ${MOON.y-MOON_R}Z`}));
  moon.append(node('circle',{class:'kt-fine',cx:MOON.x-41,cy:MOON.y-4,r:4}));
  moon.append(node('circle',{class:'kt-fine',cx:MOON.x-40,cy:MOON.y+22,r:2.6}));
  moon.append(node('circle',{class:'kt-halo',cx:MOON.x,cy:MOON.y,r:70}));

  const sky=node('g',{'clip-path':`url(#${clipId})`});sky.append(stars,sun,moon);

  // 地平线、回声线与刻度：线稿化的日落基线。
  const horizon=node('line',{class:'kt-horizon',x1:-600,y1:HORIZON,x2:1800,y2:HORIZON,pathLength:1});
  const echo=node('line',{class:'kt-rule',x1:-600,y1:HORIZON+10,x2:1800,y2:HORIZON+10});
  const ticks=node('g',{class:'kt-ticks'});
  for(let i=0;i<=41;i++){const x=i*30;ticks.append(node('line',{x1:x,y1:HORIZON,x2:x,y2:HORIZON+(i%5===0?34:15)}));}
  const label=node('text',{class:'kt-label',x:600,y:150});label.textContent=LABEL.dark;
  const rule=node('line',{class:'kt-rule',x1:40,y1:200,x2:1160,y2:200});

  svg.append(defs,sky,horizon,echo,ticks,rule,label);
  const head=document.createElement('span');head.className='kt-edge kt-edge--head';
  const tail=document.createElement('span');tail.className='kt-edge kt-edge--tail';
  slide.append(svg,head,tail);panel.append(slide);document.body.append(panel);

  let timeline:gsap.core.Timeline|undefined;
  let running=false;
  // 位移一律交给 GSAP 的 yPercent 管理，避免与样式表里的 transform 叠加。
  const settle=()=>{running=false;gsap.set(slide,{y:0,yPercent:100});gsap.set(panel,{visibility:'hidden'});};
  const play=(toDark:boolean,commit:()=>void)=>{
    if(running)return true; // 过场进行中，忽略重复点击，避免主题来回抖动。
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return false; // 交给调用方直接切换。
    running=true;timeline?.kill();
    panel.dataset.to=toDark?'dark':'light';
    label.textContent=toDark?LABEL.dark:LABEL.light;
    const day={sun:{x:0,y:0},moon:{x:0,y:0},rays:1,stars:0};
    const night={sun:SUN_SET,moon:MOON_RISE,rays:0,stars:.85};
    const from=toDark?day:night;
    const to=toDark?night:day;
    gsap.set(slide,{y:0,yPercent:100});
    gsap.set(panel,{visibility:'visible'});
    gsap.set(sun,from.sun);gsap.set(moon,from.moon);gsap.set(rays,{opacity:from.rays});gsap.set(stars,{opacity:from.stars});
    gsap.set(horizon,{strokeDashoffset:1});gsap.set(ticks.children,{opacity:0});
    timeline=gsap.timeline({onComplete:settle})
      // 幕布带着渐变软边升起。
      .to(slide,{yPercent:0,duration:.46,ease:'power3.inOut'},0)
      .to(horizon,{strokeDashoffset:0,duration:.55,ease:'power2.out'},.06)
      .to(ticks.children,{opacity:1,duration:.32,stagger:.012},.16)
      // 幕布合拢之后、退场之前换掉主题，画面之外完成色彩交接。
      .add(commit,.5)
      .to(sun,{...to.sun,duration:.64,ease:'power2.inOut'},.46)
      .to(moon,{...to.moon,duration:.66,ease:'power2.out'},.54)
      .to(rays,{opacity:to.rays,duration:.36},.54)
      .to(stars,{opacity:to.stars,duration:.52},.6)
      // 退场同样以渐变软边收尾。
      .to(slide,{yPercent:-100,duration:.56,ease:'power3.inOut'},1.1);
    return true;
  };
  return {
    play,
    dispose(){timeline?.kill();timeline=undefined;running=false;panel.remove();},
  };
}
