import { chromium } from 'playwright';
const b = await chromium.launch({ channel:'msedge', headless:true });
for (const c of [
  {name:'archive',route:'archive/',light:false,expand:false},
  {name:'archive-expanded',route:'archive/',light:false,expand:true},
  {name:'archive-light',route:'archive/',light:true,expand:true},
  {name:'home',route:'',light:false,expand:false},
]) {
  const p = await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await p.goto('http://127.0.0.1:4321/Kaguya/'+c.route,{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForTimeout(700);
  await p.evaluate(light=>document.documentElement.classList.toggle('dark',!light),c.light);
  if(c.expand){await p.locator('#dock-toggle-btn').click({force:true});await p.waitForTimeout(220);}
  if(c.name==='archive') await p.locator('#dock-music-btn').hover();
  await p.screenshot({path:`outputs/dock-soft-${c.name}.png`});
  const report=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,dock:document.querySelector('#floating-dock')?.getBoundingClientRect().toJSON(),expanded:document.querySelector('#dock-stack')?.getAttribute('data-expanded')}));
  console.log(c.name,report);
  await p.close();
}
await b.close();
