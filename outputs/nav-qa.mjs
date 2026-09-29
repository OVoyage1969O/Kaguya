import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const browser=await chromium.launch({channel:'msedge',headless:true});
const report=[];
for(const [name,width,height] of [['desktop',1440,900],['tablet',1024,768],['mobile',390,844]]) {
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 await page.route('http://nav.local/**',async route=>{
  let file=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/Kaguya\/?/,'');
  if(!path.extname(file)) file=path.join(file,'index.html');
  try {await route.fulfill({path:path.resolve('dist',file)});} catch {await route.abort();}
 });
 await page.goto('http://nav.local/Kaguya/archive/',{waitUntil:'load'});
 await page.addStyleTag({content:await fs.readFile('src/styles/persona-theme.css','utf8')});
 await page.waitForTimeout(800);
 await page.screenshot({path:`outputs/nav-${name}.png`});
 report.push({name,...await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,nav:document.querySelector('#navbar').getBoundingClientRect().toJSON(),links:[...document.querySelectorAll('.navbar-nav>.dropdown-container')].map(x=>({label:x.textContent.trim().slice(0,10),x:x.getBoundingClientRect().x,y:x.getBoundingClientRect().y}))}))});
 if(name==='desktop') {await page.locator('.dropdown-trigger').first().click(); await page.screenshot({path:'outputs/nav-dropdown.png'}); await page.mouse.click(1100,500); await page.evaluate(()=>window.scrollTo(0,600)); await page.waitForTimeout(300); await page.screenshot({path:'outputs/nav-scrolled.png'});}
 await page.close();
}
console.log(JSON.stringify(report,null,2));
await browser.close();
