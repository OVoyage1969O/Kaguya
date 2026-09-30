import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const reducedMotion of ['no-preference','reduce']){
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4321/Kaguya/archive/');
 await page.evaluate(()=>{const b=document.createElement('button');b.id='state-fixture';b.textContent='state fixture';b.style.cssText='position:fixed;top:200px;left:900px;width:150px;height:50px;z-index:9999';document.body.append(b);});
 const button=page.locator('#state-fixture');
 await button.hover();await page.waitForTimeout(80);
 const mode=()=>page.evaluate(()=>document.documentElement.dataset.cursorState);
 const check=async(expected)=>{const actual=await mode();if(actual!==expected)throw Error(`${expected}: ${actual}`);};
 await check('hover');
 await page.mouse.down();await check('pressed');await page.mouse.up();
 await button.evaluate(b=>b.setAttribute('aria-pressed','true'));await page.waitForTimeout(40);await check('selected');
 await button.evaluate(b=>b.setAttribute('aria-disabled','true'));await page.waitForTimeout(40);await check('disabled');
 await button.evaluate(b=>{b.removeAttribute('aria-disabled');b.setAttribute('aria-busy','true');});await page.waitForTimeout(100);await check('busy');
 console.log(reducedMotion,'busy',await button.evaluate(b=>({cursor:getComputedStyle(b).cursor,canvas:getComputedStyle(document.querySelector('[data-cursor-trail]')).display})));
 await button.evaluate(b=>b.removeAttribute('aria-busy'));await page.waitForTimeout(40);await check('selected');
 await button.evaluate(b=>{b.removeAttribute('aria-pressed');b.disabled=true;});await page.waitForTimeout(40);await check('disabled');
 await page.mouse.move(650,200);await page.waitForTimeout(400);await check('default');
 console.log('state cycle passed',errors);
 await page.close();
}
const preview=await browser.newPage({viewport:{width:900,height:180},reducedMotion:'reduce'});
await preview.goto('http://127.0.0.1:4321/Kaguya/archive/');
await preview.evaluate(()=>{
 const states=[['mark','默认'],['hover','可点击'],['pressed','按下'],['selected','已选中'],['disabled','禁止'],['busy','加载']];
 const panel=document.createElement('div');
 panel.style.cssText='position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:space-evenly;background:#f0eee6;color:#3d3d3a;font:14px sans-serif';
 panel.innerHTML=states.map(([name,label])=>`<div style="width:120px;text-align:center"><img src="/Kaguya/assets/cursor-${name}.svg" style="width:48px;height:48px;object-fit:contain;margin:0 auto 20px;display:block"><span>${label}</span></div>`).join('');
 document.body.append(panel);
});
await preview.evaluate(()=>Promise.all([...document.querySelectorAll('img')].map(img=>img.decode().catch(()=>{}))));
await preview.screenshot({path:'outputs/cursor-states-preview.png'});
await browser.close();
