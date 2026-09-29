import { chromium } from "playwright";
import fs from "node:fs/promises";

await fs.mkdir("outputs/claude-special", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
for (const [name, route] of [["gallery", "gallery/"], ["guestbook", "guestbook/"], ["music", "music/"], ["kuonji", "kuonji/"], ["konbini", "konbini/"]]) {
	const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
	await page.addInitScript(() => localStorage.setItem("theme", "light"));
	await page.goto(`http://127.0.0.1:4321/Kaguya/${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
	await page.waitForTimeout(name === "kuonji" || name === "konbini" ? 2200 : 800);
	await page.screenshot({ path: `outputs/claude-special/${name}.png` });
	console.log(name, await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, bg: getComputedStyle(document.body).backgroundColor })));
	await page.close();
}
await browser.close();
