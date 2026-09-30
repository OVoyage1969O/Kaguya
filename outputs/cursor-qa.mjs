import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const reducedMotion of ['no-preference','reduce']) {
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4321/Kaguya/archive/',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(600);
  await page.mouse.move(900,420);
  await page.waitForTimeout(20);
  for(let i=1;i<=15;i++){await page.mouse.move(900-i*14,420+Math.sin(i/5)*70);await page.waitForTimeout(9);}
  console.log(reducedMotion,await page.evaluate(()=>{
    const canvas=document.querySelector('[data-cursor-trail]');
    const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let pixels=0;for(let i=3;i<data.length;i+=4)if(data[i])pixels++;
    return {cursor:getComputedStyle(document.body).cursor,pixels,canvasDisplay:getComputedStyle(canvas).display};
  }));
  if(reducedMotion==='no-preference') {
    // Browser screenshots omit native cursors; add the same asset at the tested hotspot for preview only.
    await page.evaluate(()=>{const img=new Image();img.src='/Kaguya/assets/cursor-mark.svg';img.style.cssText='position:fixed;left:674px;top:414px;width:32px;height:32px;z-index:10030;pointer-events:none';document.body.append(img);});
    await page.screenshot({path:'outputs/cursor-trail-preview.png'});
  }
  await page.waitForTimeout(450);
  console.log('settled',await page.locator('[data-cursor-trail]').evaluate(e=>getComputedStyle(e).visibility),errors);
  await page.locator('#nav-search-btn').click();
  await page.waitForTimeout(150);
  console.log('search',await page.locator('.search-modal-backdrop').isVisible());
  await page.close();
}
const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await phone.goto('http://127.0.0.1:4321/Kaguya/archive/');
console.log('touch',await phone.locator('[data-cursor-trail]').evaluate(e=>getComputedStyle(e).display));
await browser.close();
