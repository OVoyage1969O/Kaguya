import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const cases = [
  ['home-dark', 1440, 900, '', true],
  ['archive-dark', 1440, 900, 'archive/', true],
  ['archive-light', 1440, 900, 'archive/', false],
  ['archive-1024', 1024, 768, 'archive/', true],
];
for (const [name, width, height, route, dark] of cases) {
  const p = await b.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
  await p.goto('http://127.0.0.1:4321/Kaguya/' + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(800);
  if (!dark && await p.locator('html').evaluate(el => el.classList.contains('dark'))) await p.locator('#dock-theme-btn').click();
  if (dark && !await p.locator('html').evaluate(el => el.classList.contains('dark'))) await p.locator('#dock-theme-btn').click();
  await p.waitForTimeout(250);
  await p.screenshot({ path: `outputs/nav-wing-${name}.png` });
  const report = await p.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, top: document.querySelector('#top-row')?.getBoundingClientRect().toJSON(), left: document.querySelector('.navbar-seg--left')?.getBoundingClientRect().toJSON(), center: document.querySelector('.navbar-seg--center')?.getBoundingClientRect().toJSON() }));
  console.log(name, report);
  await p.close();
}
await b.close();
