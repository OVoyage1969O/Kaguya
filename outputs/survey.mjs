// Full-surface visual survey for the Kaguya Persona framework.
// Usage: node outputs/survey.mjs [desktop|mobile|both] [light|dark|both] [routeFilter]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:4321/Kaguya';
const OUT = 'outputs/survey';
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = [
	['home', '/'],
	['about', '/about/'],
	['archive', '/archive/'],
	['categories', '/categories/'],
	['collections-tools', '/collections/'],
	['list', '/list/'],
	['rss', '/rss/'],
	['search', '/search/'],
	['bookshelf', '/bookshelf/'],
	['bookshelf-category', '/bookshelf/category/magic/'],
	['bookshelf-entry', '/bookshelf/entries/magic/榄旀硶/'],
	['gallery', '/gallery/'],
	['gallery-album', '/gallery/FGO/'],
	['calendar', '/calendar/'],
	['dynamic', '/dynamic/'],
	['friends', '/friends/'],
	['guestbook', '/guestbook/'],
	['music', '/music/'],
	['sponsor', '/sponsor/'],
	['konbini', '/konbini/'],
	['kuonji', '/kuonji/'],
	['kuonji-room', '/kuonji/rooms/parlor/'],
	['post', '/posts/PROB6/'],
	['notfound', '/this-page-does-not-exist/'],
];

const VIEWPORTS = {
	desktop: { width: 1440, height: 900 },
	mobile: { width: 390, height: 844 },
};

const devices = (process.argv[2] || 'desktop') === 'both' ? ['desktop', 'mobile'] : [process.argv[2] || 'desktop'];
const themes = (process.argv[3] || 'light') === 'both' ? ['light', 'dark'] : [process.argv[3] || 'light'];
const filters = (process.argv[4] || '').split(',').filter(Boolean);

// Playwright's bundled browsers are not installed here; drive the system Chrome/Edge instead.
const CANDIDATES = [
	'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const CHROMIUM = CANDIDATES.find((p) => fs.existsSync(p));
if (!CHROMIUM) throw new Error('no system browser found');
const browser = await chromium.launch({ executablePath: CHROMIUM });
const results = [];

for (const device of devices) {
	for (const theme of themes) {
		const context = await browser.newContext({
			viewport: VIEWPORTS[device],
			deviceScaleFactor: 1,
			reducedMotion: 'no-preference',
		});
		const page = await context.newPage();
		await page.addInitScript(
			([t]) => {
				try {
					localStorage.setItem('theme', t);
					localStorage.setItem('starlight-theme', t);
				} catch {}
			},
			[theme],
		);

		for (const [name, route] of ROUTES) {
			if (filters.length && !filters.some((f) => name.includes(f))) continue;
			const file = path.join(OUT, `${device}-${theme}-${name}.png`);
			const url = BASE + encodeURI(route);
			const rec = { device, theme, name, route, url };
			try {
				const resp = await page.goto(url, {
					waitUntil: process.env.SHOT_UNTIL || 'load',
					timeout: 45000,
					});
				rec.status = resp ? resp.status() : null;
				// Force theme class (Layout toggles `dark` on <html>).
				await page.evaluate((t) => {
					document.documentElement.classList.toggle('dark', t === 'dark');
				}, theme);
				// Let entrance motion, curtain reveal and lazy islands settle.
				// The 3D scene pages run a longer opening curtain, so they wait more.
				const settle = /^(konbini|kuonji)/.test(name) ? 6800 : Number(process.env.SHOT_WAIT || 3200);
				await page.waitForTimeout(settle);
				await page.screenshot({ path: file });
				const metrics = await page.evaluate(() => ({
					scrollW: document.documentElement.scrollWidth,
					innerW: window.innerWidth,
					scrollH: document.documentElement.scrollHeight,
					title: document.title,
				}));
				rec.metrics = metrics;
				rec.overflowX = metrics.scrollW > metrics.innerW;
				rec.file = file;
			} catch (error) {
				rec.error = String(error).slice(0, 200);
			}
			results.push(rec);
			const flag = rec.error ? 'ERR' : rec.overflowX ? 'OVF' : 'ok ';
			console.log(`${flag} ${device}/${theme} ${name} status=${rec.status} ${rec.error || ''}`);
		}
		await context.close();
	}
}

await browser.close();
fs.writeFileSync(path.join(OUT, '_report.json'), JSON.stringify(results, null, 2));
const bad = results.filter((r) => r.error || r.overflowX || (r.status && r.status >= 400 && r.name !== 'notfound'));
console.log(`\ntotal=${results.length} problems=${bad.length}`);
for (const b of bad) console.log(`  ! ${b.device}/${b.theme}/${b.name} status=${b.status} overflowX=${b.overflowX} ${b.error || ''}`);
