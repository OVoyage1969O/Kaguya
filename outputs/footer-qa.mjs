import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const [name,width,height,mode] of [['dark',1440,900,'dark'],['light',1440,900,'light'],['mobile',390,844,'dark']]) {
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  await page.addInitScript(theme=>localStorage.setItem('theme',theme),mode);
  await page.goto('http://127.0.0.1:4321/Kaguya/archive/',{waitUntil:'domcontentloaded'});
  const footer=page.locator('.study-footer');
  await footer.scrollIntoViewIfNeeded();
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(200);
  await footer.screenshot({path:`outputs/footer-${name}.png`});
  console.log(name,await footer.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth,quotePresent:el.textContent.includes('知识有迹'),links:el.querySelectorAll('a').length})));
  await page.close();
}
await browser.close();
