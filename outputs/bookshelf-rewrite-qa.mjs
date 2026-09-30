import {chromium} from 'playwright';
import fs from 'node:fs/promises';
await fs.mkdir('outputs/bookshelf-rewrite',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const base='http://127.0.0.1:4321';
for(const [name,width,height,theme,motion] of [['desktop',1440,1000,'light','no-preference'],['dark',1440,1000,'dark','reduce'],['mobile',390,844,'light','no-preference']]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:motion});
 await page.addInitScript(theme=>localStorage.setItem('theme',theme),theme);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/Kaguya/bookshelf/',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(1900);
 await page.screenshot({path:`outputs/bookshelf-rewrite/${name}-hero.png`});
 if(name==='desktop'){
  const links=await page.locator('.atlas a[href]').evaluateAll(elements=>[...new Set(elements.map(e=>e.getAttribute('href')))].filter(href=>href.includes('/bookshelf/')));
  const responses=await Promise.all(links.map(async href=>({href,status:(await page.request.get(base+href)).status()})));
  console.log('links',responses.filter(response=>response.status!==200));
 }
 console.log(name,await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,mounted:document.querySelector('[data-bk-root]')?.dataset.bkMounted,entries:document.querySelectorAll('[data-atlas-entry]').length,brokenImages:[...document.querySelectorAll('.atlas img')].filter(img=>img.complete&&!img.naturalWidth).map(img=>img.src)})),errors);
 await page.locator('#worlds').scrollIntoViewIfNeeded();await page.waitForTimeout(1200);
 await page.screenshot({path:`outputs/bookshelf-rewrite/${name}-worlds.png`});
 await page.locator('#characters').scrollIntoViewIfNeeded();await page.waitForTimeout(1000);
 await page.screenshot({path:`outputs/bookshelf-rewrite/${name}-characters.png`});
 await page.locator('#catalogue').scrollIntoViewIfNeeded();await page.waitForTimeout(800);
 await page.screenshot({path:`outputs/bookshelf-rewrite/${name}-catalogue.png`});
 await page.locator('[data-atlas-search]').fill('久远寺有珠');
 console.log('query',await page.locator('[data-atlas-entry]:visible').count());
 await page.locator('[data-atlas-search]').fill('zzzz不存在');
 console.log('empty',await page.locator('[data-atlas-empty]').isVisible());
 await page.locator('[data-atlas-reset]').click();
 await page.locator('[data-atlas-filter="trivia"]').click();
 console.log('trivia',await page.locator('[data-atlas-entry]:visible').count());
 await page.locator('[data-atlas-filter="all"]').click();
 if(name==='desktop'){
  await page.locator('.atlas-entry').first().click();await page.waitForTimeout(1300);
  console.log('entry route',page.url());
  await page.goBack();await page.waitForTimeout(1600);
  await page.locator('[data-atlas-search]').fill('魔术礼装');
  console.log('returned',await page.locator('[data-atlas-entry]:visible').count(),await page.locator('[data-bk-root]').getAttribute('data-bk-mounted'));
  await page.locator('[data-atlas-random]').click();await page.waitForTimeout(1400);
  console.log('random route',page.url(),await page.locator('.bookshelf-entry').count());
 }
 await page.close();
}
const category=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
await category.goto(base+'/Kaguya/bookshelf/category/typemoon/');
await category.screenshot({path:'outputs/bookshelf-rewrite/category.png'});
console.log('category',await category.locator('.atlas-entry').count());
const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:1024,height:768}});
await nojs.goto(base+'/Kaguya/bookshelf/');
console.log('nojs',await nojs.locator('.atlas-entry:visible').count());
await browser.close();
