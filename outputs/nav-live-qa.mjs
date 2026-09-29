import {chromium} from 'playwright';
const b=await chromium.launch({channel:'msedge',headless:true});
for(const [name,width,height,route] of [['home',1440,900,''],['archive',1024,768,'archive/'],['phone',390,844,'archive/']]) {
 const p=await b.newPage({viewport:{width,height},reducedMotion:'reduce'});
 await p.goto('http://127.0.0.1:4321/Kaguya/'+route,{waitUntil:'domcontentloaded',timeout:60000});
 await p.waitForTimeout(1200);
 await p.screenshot({path:`outputs/nav-live-${name}.png`});
 console.log(name,await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,nav:document.querySelector('#navbar')?.getBoundingClientRect().toJSON()})));
 if(name==='archive') {await p.locator('.dropdown-trigger').first().click(); console.log('dropdown',await p.locator('.dropdown-trigger').first().getAttribute('aria-expanded')); await p.locator('#nav-search-btn').click(); console.log('search',await p.locator('[role="dialog"]').count());}
 await p.close();
}
await b.close();
