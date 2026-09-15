import * as T from 'three';
import {createThemeTransition} from './theme-transition';

function weatherIcon(code:number){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 64 64');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.2');svg.setAttribute('aria-label',weatherName(code));svg.setAttribute('role','img');
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',code===0?'M32 5v7m0 40v7M5 32h7m40 0h7M13 13l5 5m28 28 5 5M13 51l5-5m28-28 5-5M45 32a13 13 0 1 1-26 0 13 13 0 1 1 26 0':code<=3?'M16 43h32a10 10 0 0 0 0-20 15 15 0 0 0-29-2 11 11 0 0 0-3 22':code<=48?'M10 20h44M6 30h45M14 40h44M8 50h39':'M16 37h32a10 10 0 0 0 0-20 15 15 0 0 0-29-2 11 11 0 0 0-3 22M20 44l-4 11m17-11-4 11m17-11-4 11');svg.append(path);return svg;
}
const PROFILE='https://github.com/OVoyage1969O';
const weatherName=(code:number)=>code===0?'晴':code<=3?'多云':code<=48?'雾':code<=67?'雨':code<=77?'雪':code<=82?'阵雨':code<=86?'阵雪':'雷雨';

/** Object-triggered utilities. No network or location request until the corresponding object is activated. */
export function mountRoomInteractions(host:HTMLElement,root:T.Group,onTheme:(dark:boolean)=>void,render:()=>void,onInspect:(kind:string|null)=>void){
  let disposed=false,dark=true,sequence=0,timer:ReturnType<typeof setInterval>|undefined,deadline=0;
  let transition:ReturnType<typeof createThemeTransition>|undefined;
  const requests=new Set<AbortController>();
  const media=matchMedia('(prefers-color-scheme: dark)');
  const readTheme=()=>{try{return localStorage.getItem('theme')||'dark';}catch{return 'dark';}};
  const screens=new Map<string,{texture:T.CanvasTexture;material:T.MeshBasicMaterial;canvas:HTMLCanvasElement;lines:string[]}>();
  for(const [name,lines] of [['github-screen',['GITHUB','OVoyage1969O','点击连接个人主页']],['weather-screen',['WEATHER','窗外 · 此刻','点击查看当地天气']]] as const){
    const mesh=root.getObjectByName(name) as T.Mesh|undefined;if(!mesh)continue;
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512;
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const material=new T.MeshBasicMaterial({map:texture});mesh.material=material;
    screens.set(name,{texture,material,canvas,lines:[...lines]});
  }
  const draw=()=>{for(const s of screens.values()){const c=s.canvas.getContext('2d')!;c.fillStyle=dark?'#101215':'#f2f2ef';c.fillRect(0,0,768,512);c.strokeStyle=dark?'#73777b':'#898c8f';c.lineWidth=2;c.strokeRect(22,22,724,468);s.lines.forEach((line,i)=>{c.fillStyle=dark?'#d8dadd':'#25282c';c.font=i===0?'26px monospace':i===1?'38px serif':'25px sans-serif';c.fillText(line,52,90+i*93,665);});s.texture.needsUpdate=true;}render();};
  const screen=(name:string,lines:string[])=>{const s=screens.get(name);if(s){s.lines=lines;draw();}};
  const applyTheme=(value:string)=>{dark=value==='system'?media.matches:value!=='light';host.dataset.theme=dark?'dark':'light';document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light';root.getObjectByName('fireplace-flames')?.traverse(o=>{if(o instanceof T.Mesh)(o.material as T.MeshBasicMaterial).color.setHex(dark?0xd2d3d5:0x34383c);});onTheme(dark);draw();};
  applyTheme(readTheme());
  const sync=()=>applyTheme(readTheme());window.addEventListener('storage',sync);media.addEventListener('change',sync);
  const dialog=document.createElement('dialog');dialog.className='room-object-dialog';dialog.setAttribute('aria-labelledby','room-object-title');
  const close=document.createElement('button');close.className='room-object-close';close.textContent='返回房间 ↙';close.onclick=()=>dialog.close();
  const title=document.createElement('h2');title.id='room-object-title';
  const body=document.createElement('div');body.className='room-object-body';body.setAttribute('aria-live','polite');
  dialog.append(close,title,body);host.append(dialog);
  dialog.addEventListener('close',()=>{onInspect(null);sequence++;requests.forEach(r=>r.abort());requests.clear();});
  const paragraph=(text:string)=>{const p=document.createElement('p');p.textContent=text;body.append(p);return p;};
  const button=(label:string,fn:()=>void)=>{const b=document.createElement('button');b.textContent=label;b.addEventListener('click',fn);body.append(b);return b;};
  const link=(label:string,href:string)=>{const a=document.createElement('a');a.textContent=label;a.href=href;a.target='_blank';a.rel='noopener noreferrer';body.append(a);};
  const open=(label:string,kind='tea')=>{title.textContent=label;dialog.dataset.kind=kind;body.replaceChildren();if(!dialog.open){dialog.showModal();onInspect(kind);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)dialog.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:900,easing:'cubic-bezier(.22,1,.36,1)'});}return ++sequence;};
  const valid=(id:number)=>!disposed&&dialog.open&&id===sequence;
  async function json(url:string){const ctrl=new AbortController();requests.add(ctrl);const timeout=setTimeout(()=>ctrl.abort(),12000);try{const response=await fetch(url,{signal:ctrl.signal,headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`HTTP ${response.status}`);return await response.json();}finally{clearTimeout(timeout);requests.delete(ctrl);}}
  async function github(){
    const id=open('个人档案','github');const state=paragraph('正在接通 OVoyage1969O …');
    link('访问 GitHub ↗',PROFILE);
    try{
      const data=await json('https://api.github.com/users/OVoyage1969O');if(!valid(id))return;if(typeof data.login!=='string')throw new Error('Invalid profile');
      body.replaceChildren();const identity=document.createElement('div');identity.className='object-identity';
      const monogram=document.createElement('span');monogram.className='object-monogram';monogram.textContent='OV';
      const heading=document.createElement('div'),name=document.createElement('h3'),handle=document.createElement('p');name.textContent=data.name||data.login;handle.textContent='@'+data.login;heading.append(name,handle);identity.append(monogram,heading);body.append(identity);
      paragraph(data.bio||'技术、学习与日常的公开记录。');
      const stats=document.createElement('dl');stats.className='object-stats';for(const [label,value] of [['REPOSITORIES',data.public_repos],['FOLLOWERS',data.followers],['FOLLOWING',data.following]]){const item=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=String(label);dd.textContent=String(value??'—');item.append(dd,dt);stats.append(item);}body.append(stats);
      link('访问 GitHub 个人主页 ↗',PROFILE);screen('github-screen',['GITHUB',data.name||data.login,`${data.public_repos} REPOS / ${data.followers} FOLLOWERS`]);
      const section=document.createElement('section');section.className='object-repositories';const caption=document.createElement('h4');caption.textContent='RECENT WORK / 最近更新';section.append(caption);body.append(section);
      try{const repos=await json('https://api.github.com/users/OVoyage1969O/repos?sort=updated&per_page=3&type=owner');if(!valid(id))return;if(!Array.isArray(repos))throw new Error('Invalid repositories');for(const repo of repos){const a=document.createElement('a');a.className='object-repo';a.href=PROFILE+'/'+encodeURIComponent(repo.name);a.target='_blank';a.rel='noopener noreferrer';const strong=document.createElement('strong'),desc=document.createElement('span'),meta=document.createElement('small');strong.textContent=repo.name+' ↗';desc.textContent=repo.description||'查看项目';meta.textContent=`${repo.language||'PROJECT'}   /   ☆ ${repo.stargazers_count}`;a.append(strong,desc,meta);section.append(a);}if(!repos.length)section.append('尚无公开仓库。');}catch{if(valid(id))section.append('项目列表暂不可用，仍可访问个人主页。');}
    }catch{if(valid(id)){state.textContent='暂时无法读取 GitHub 信息，可直接打开主页。';screen('github-screen',['GITHUB','OVoyage1969O','网络暂不可用 · 点击重试']);}}
  }
  async function forecast(lat:number,lon:number,city:string,id:number){
    try{const data=await json(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`);if(!valid(id))return;const c=data.current;if(!c||!Number.isFinite(c.temperature_2m)||!Number.isFinite(c.weather_code))throw new Error('Invalid weather');body.replaceChildren();
      const location=paragraph(city);location.className='weather-location';
      const hero=document.createElement('div');hero.className='weather-hero';const temperature=document.createElement('strong');temperature.textContent=`${Math.round(c.temperature_2m)}°`;hero.append(temperature,weatherIcon(c.weather_code));body.append(hero);
      paragraph(`${weatherName(c.weather_code)} / 体感 ${Math.round(c.apparent_temperature)} °C / 风速 ${c.wind_speed_10m} km/h`);
      const daily=data.daily;if(daily?.time){const days=document.createElement('div');days.className='weather-days';daily.time.slice(0,5).forEach((date:string,i:number)=>{const day=document.createElement('div'),label=document.createElement('span'),range=document.createElement('small');label.textContent=i===0?'今天':new Intl.DateTimeFormat('zh-CN',{weekday:'short'}).format(new Date(date+'T12:00:00'));range.textContent=`${Math.round(daily.temperature_2m_min[i])}° / ${Math.round(daily.temperature_2m_max[i])}°`;day.append(label,weatherIcon(daily.weather_code[i]),range);days.append(day);});body.append(days);}
      const updated=paragraph(`更新于 ${String(c.time).replace('T',' ')} · 当地时间`);updated.className='object-caption';
      link('天气数据 · Open-Meteo ↗','https://open-meteo.com/');button('重新定位',()=>void weather());button('选择其他城市',()=>citySearch(++sequence));screen('weather-screen',['WEATHER',`${city} · ${Math.round(c.temperature_2m)}°`,weatherName(c.weather_code)]);
    }catch{if(valid(id)){body.replaceChildren();paragraph('天气服务暂时无法连接，请稍后重试。');button('重试',()=>void forecast(lat,lon,city,id));button('输入城市',()=>citySearch(++sequence));}}
  }
  function citySearch(id:number){
    body.replaceChildren();paragraph('输入城市名称，选择匹配地点查看天气。');
    const form=document.createElement('form'),input=document.createElement('input'),submit=document.createElement('button'),results=document.createElement('div');input.placeholder='例如：上海 / Shanghai';input.setAttribute('aria-label','城市名称');input.required=true;input.maxLength=80;submit.textContent='查找';submit.type='submit';form.append(input,submit);body.append(form,results);input.focus();
    form.addEventListener('submit',async e=>{e.preventDefault();const query=input.value.trim();if(!query)return;submit.disabled=true;results.textContent='正在查找 …';try{const data=await json(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=zh&format=json`);if(!valid(id))return;results.replaceChildren();if(!Array.isArray(data.results)||!data.results.length)results.textContent='没有找到城市，可以尝试拼音或英文名称。';else for(const place of data.results){const b=document.createElement('button');b.textContent=[place.name,place.admin1,place.country].filter(Boolean).join(' · ');b.addEventListener('click',()=>{const next=++sequence;body.replaceChildren();paragraph('正在读取天气 …');void forecast(place.latitude,place.longitude,place.name,next);});results.append(b);}}catch{if(valid(id))results.textContent='城市查询暂不可用，请稍后再试。';}finally{submit.disabled=false;}});
  }
  async function weather(){const id=open('窗外 · 此刻','weather');paragraph('正在请求定位，以读取你所在城市的天气。');paragraph('定位仅在查看天气时使用，用于查询 Open-Meteo 天气与 BigDataCloud 城市名称，不保存坐标。');button('改为输入城市',()=>citySearch(++sequence));
    try{if(!navigator.geolocation)throw new Error('No geolocation');const pos=await new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:10000,maximumAge:300000}));if(!valid(id))return;const {latitude,longitude}=pos.coords;let city='当前位置';try{const place=await json(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`);city=place.city||place.locality||city;}catch{/* Weather remains usable when locality lookup fails. */}if(valid(id))await forecast(latitude,longitude,city,id);
    }catch{if(valid(id)){citySearch(id);paragraph('未获得定位权限或定位不可用，请手动选择城市。');}}
  }
  function tea(){open('片刻休息','tea');const status=paragraph('泡一杯茶，留三分钟给自己。');status.className='tea-clock';const update=()=>{const remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));status.textContent=deadline?(remaining?`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')} · 等待茶香`:'茶已泡好。'): '泡一杯茶，留三分钟给自己。';if(deadline&&!remaining&&timer){clearInterval(timer);timer=undefined;}};button('开始三分钟',()=>{deadline=Date.now()+180000;if(timer)clearInterval(timer);timer=setInterval(update,1000);update();});button('结束休息',()=>{deadline=0;if(timer)clearInterval(timer);timer=undefined;update();});if(deadline){if(timer)clearInterval(timer);timer=setInterval(update,1000);update();}}
  const handle=(href:string)=>{if(!href.startsWith('action:'))return false;switch(href.slice(7)){case 'theme':{const next=dark?'light':'dark';const commit=()=>{try{localStorage.setItem('theme',next);}catch{}applyTheme(next);};if(matchMedia('(prefers-reduced-motion: reduce)').matches)commit();else{transition??=createThemeTransition();if(!transition.play(next==='dark',commit))commit();}break;}case 'github':void github();break;case 'weather':void weather();break;case 'tea':tea();break;case 'fireplace':{const flame=root.getObjectByName('fireplace-flames');if(flame){flame.visible=!flame.visible;render();}break;}}return true;};
  const accessible=(e:Event)=>{const target=(e.target as HTMLElement).closest<HTMLElement>('[data-room-action]');if(target)handle(`action:${target.dataset.roomAction}`);};document.addEventListener('click',accessible);
  return {handle,dispose(){disposed=true;sequence++;if(timer)clearInterval(timer);requests.forEach(r=>r.abort());transition?.dispose();window.removeEventListener('storage',sync);media.removeEventListener('change',sync);document.removeEventListener('click',accessible);dialog.remove();screens.forEach(s=>{s.material.dispose();s.texture.dispose();});}};
}
