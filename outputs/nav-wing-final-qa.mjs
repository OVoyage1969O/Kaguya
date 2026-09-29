import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'msedge', headless: true });
for (const c of [
  {name:'scroll', width:1440, height:900, light:false, scroll:true},
  {name:'light', width:1440, height:900, light:true, scroll:false},
  {name:'1024', width:1024, height:768, light:false, scroll:false},
]) {
  const p = await b.newPage({ viewport:{width:c.width,height:c.height}, reducedMotion:'reduce' });
  await p.goto('http://127.0.0.1:4321/Kaguya/archive/', {waitUntil:'domcontentloaded', timeout:60000});
  await p.waitForTimeout(700);
  await p.evaluate(light => document.documentElement.classList.toggle('dark', !light), c.light);
  if (c.scroll) { await p.evaluate(()=>scrollTo(0,600)); await p.waitForTimeout(350); }
  await p.screenshot({path:`outputs/nav-wing-${c.name}.png`});
  const active = p.locator('.dropdown-trigger').first();
  await active.hover();
  await p.waitForTimeout(180);
  const dropdown = await p.locator('.dropdown-menu').first().evaluate(e=>getComputedStyle(e).opacity);
  await p.locator('#nav-search-btn').click();
  await p.waitForTimeout(180);
  const search = await p.locator('.search-modal-backdrop').isVisible();
  console.log(c.name, {dropdown, search, overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  await p.close();
}
await b.close();
