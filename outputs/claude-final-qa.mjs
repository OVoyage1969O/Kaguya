import { chromium } from "playwright";
import fs from "node:fs/promises";

await fs.mkdir("outputs/claude-final", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await desktop.addInitScript(() => localStorage.setItem("theme", "light"));
await desktop.goto("http://127.0.0.1:4321/Kaguya/posts/PROB6/", { waitUntil: "networkidle", timeout: 60000 });
await desktop.screenshot({ path: "outputs/claude-final/post.png" });
await desktop.locator(".dropdown-trigger").first().hover();
const dropdownOpacity = await desktop.locator(".dropdown-menu").first().evaluate((el) => getComputedStyle(el).opacity);
await desktop.locator("#nav-search-btn").click();
await desktop.waitForTimeout(150);
const searchVisible = await desktop.locator(".search-modal-backdrop").isVisible();
await desktop.keyboard.press("Escape");
const fonts = await desktop.evaluate(async () => {
	await document.fonts.ready;
	return {
		sans: document.fonts.check('16px "Anthropic Sans"'),
		serif: document.fonts.check('16px "Anthropic Serif"'),
		mono: document.fonts.check('16px "Anthropic Mono"'),
	};
});

for (const [name, route] of [["bookshelf", "bookshelf/"], ["about", "about/"]]) {
	await desktop.goto(`http://127.0.0.1:4321/Kaguya/${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
	await desktop.waitForTimeout(650);
	await desktop.screenshot({ path: `outputs/claude-final/${name}.png` });
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
await mobile.addInitScript(() => {
	localStorage.setItem("theme", "dark");
	for (const key of Object.keys(localStorage)) {
		if (key.toLowerCase().includes("mobile") || key.toLowerCase().includes("notice")) localStorage.setItem(key, "true");
	}
});
await mobile.goto("http://127.0.0.1:4321/Kaguya/", { waitUntil: "domcontentloaded", timeout: 60000 });
await mobile.waitForTimeout(800);
const dismiss = mobile.getByRole("button", { name: "我知道了" });
if (await dismiss.count()) await dismiss.click();
await mobile.waitForTimeout(200);
await mobile.screenshot({ path: "outputs/claude-final/home-mobile.png" });

console.log(JSON.stringify({
	fonts,
	dropdownOpacity,
	searchVisible,
	desktopOverflow: await desktop.evaluate(() => document.documentElement.scrollWidth > innerWidth),
	mobileOverflow: await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth),
}, null, 2));

await desktop.close();
await mobile.close();
await browser.close();
