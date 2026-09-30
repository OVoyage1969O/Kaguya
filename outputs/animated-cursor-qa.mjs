import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const reducedMotion of ['no-preference','reduce']){
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4321/Kaguya/archive/');
 await page.mouse.move(600,250);
 await page.waitForTimeout(250);
 const first=await page.locator('[data-animated-cursor]').getAttribute('data-frame');
 await page.waitForTimeout(210);
 const second=await page.locator('[data-animated-cursor]').getAttribute('data-frame');
 const state=()=>page.evaluate(()=>document.documentElement.dataset.aniCursorState);
 console.log(reducedMotion,{normal:await state(),first,second,active:await page.evaluate(()=>document.documentElement.hasAttribute('data-ani-active'))});
 await page.locator('#nav-search-btn').hover();await page.waitForTimeout(200);
 if(await state()!=='link')throw Error('Link state missing');
 await page.locator('#nav-search-btn').click();await page.waitForTimeout(200);
 console.log('search',await page.locator('.search-modal-backdrop').isVisible());
 await page.keyboard.press('Escape');
 await page.evaluate(()=>{
 const fixture=document.createElement('div');fixture.id='cursor-fixture';fixture.style.cssText='position:fixed;left:800px;top:200px;z-index:9999';
 fixture.innerHTML='<button id="busy" aria-busy="true" style="width:90px;height:40px">Busy</button><button id="blocked" disabled style="width:90px;height:40px">Blocked</button><textarea id="text" style="width:90px;height:40px"></textarea><div id="resize" style="cursor:ew-resize;width:90px;height:40px">Resize</div>';
 document.body.append(fixture);
 });
 for(const [id,expected] of [['busy','working'],['blocked','unavailable'],['text','text'],['resize','horizontal']]){
  await page.locator('#'+id).hover({force:true});await page.waitForTimeout(150);
  if(await state()!==expected)throw Error(`${id} expected ${expected}, got ${await state()}`);
 }
 await page.evaluate(()=>document.getElementById('cursor-fixture').remove());
 await page.mouse.move(600,250);await page.waitForTimeout(100);
 await page.evaluate(()=>document.documentElement.setAttribute('aria-busy','true'));
 await page.waitForTimeout(150);if(await state()!=='busy')throw Error('Stationary busy missing');
 await page.evaluate(()=>document.documentElement.removeAttribute('aria-busy'));
 await page.waitForTimeout(150);if(await state()!=='normal')throw Error('Busy completion missing');
 console.log('all states passed',errors);
 if(!errors.length&&reducedMotion==='no-preference')await page.screenshot({path:'outputs/animated-cursor-site.png'});
 await page.close();
}
const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
await mobile.goto('http://127.0.0.1:4321/Kaguya/archive/');
console.log('mobile canvas',await mobile.locator('[data-animated-cursor]').evaluate(e=>getComputedStyle(e).display));
const preview=await browser.newPage({viewport:{width:900,height:180},reducedMotion:'reduce'});
await preview.goto('http://127.0.0.1:4321/Kaguya/archive/');
await preview.evaluate(()=>{
 const roles=[['normal','普通'],['link','链接'],['text','文本'],['working','后台工作'],['busy','忙碌'],['unavailable','禁止']];
 const panel=document.createElement('div');panel.style.cssText='position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:space-evenly;background:#f0eee6;color:#3d3d3a;font:14px sans-serif';
 panel.innerHTML=roles.map(([name,label])=>`<div style="width:120px;text-align:center"><div style="width:32px;height:32px;margin:0 auto 22px;background-image:url(/Kaguya/assets/cursors/${name}.png);background-position:0 0;image-rendering:pixelated"></div>${label}</div>`).join('');document.body.append(panel);
});
await preview.waitForTimeout(400);
await preview.screenshot({path:'outputs/animated-cursor-pack-preview.png'});
await browser.close();
