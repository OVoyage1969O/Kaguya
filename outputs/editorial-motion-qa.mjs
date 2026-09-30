import { chromium } from 'playwright';
const browser = await chromium.launch({channel:'msedge',headless:true});
for (const reducedMotion of ['no-preference','reduce']) {
  const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.motionCalls=[];
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(frames,options){
      window.motionCalls.push({className:this.className,duration:options?.duration});
      return animate.call(this,frames,options);
    };
  });
  await page.goto('http://127.0.0.1:4321/Kaguya/collections/',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(1700);
  await page.evaluate(()=>scrollTo(0,700));
  await page.waitForTimeout(1000);
  const before=await page.evaluate(()=>window.motionCalls.length);
  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForTimeout(1000);
  const report=await page.evaluate(()=>({calls:window.motionCalls.length,overflow:document.documentElement.scrollWidth>innerWidth,hiddenCards:[...document.querySelectorAll('.tools-card')].filter(e=>getComputedStyle(e).opacity==='0').length}));
  await page.locator('#nav-search-btn').click();
  await page.waitForTimeout(150);
  console.log(reducedMotion,{...report,replayed:report.calls!==before,search:await page.locator('.search-modal-backdrop').isVisible(),errors});
  await page.keyboard.press('Escape');
  await page.locator('.navbar-logo').click();
  await page.waitForTimeout(2200);
  console.log('route',await page.evaluate(()=>({path:location.pathname,curtainHidden:document.querySelector('[data-p3-wipe]')?.hidden})));
  await page.close();
}
const mobile=await browser.newPage({viewport:{width:390,height:844}});
await mobile.goto('http://127.0.0.1:4321/Kaguya/collections/');
await mobile.waitForTimeout(1200);
console.log('mobile',await mobile.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,hiddenCards:[...document.querySelectorAll('.tools-card')].filter(e=>getComputedStyle(e).opacity==='0').length})));
await browser.close();
