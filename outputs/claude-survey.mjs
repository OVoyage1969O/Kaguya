import { chromium } from "playwright";
import fs from "node:fs/promises";

await fs.mkdir("outputs/claude-survey", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const cases = [
	["home-light", "", 1440, 900, "light"],
	["home-dark", "", 1440, 900, "dark"],
	["archive-light", "archive/", 1440, 900, "light"],
	["archive-dark", "archive/", 1440, 900, "dark"],
	["post-light", "posts/PROB6/", 1440, 900, "light"],
	["collections-light", "collections/", 1440, 900, "light"],
	["bookshelf-light", "bookshelf/", 1440, 900, "light"],
	["about-light", "about/", 1440, 900, "light"],
	["archive-mobile", "archive/", 390, 844, "light"],
	["home-mobile", "", 390, 844, "dark"],
];
const report = [];
for (const [name, route, width, height, theme] of cases) {
	const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
	await page.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
	await page.goto(`http://127.0.0.1:4321/Kaguya/${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
	await page.waitForTimeout(950);
	await page.screenshot({ path: `outputs/claude-survey/${name}.png`, fullPage: false });
	report.push(await page.evaluate((caseName) => ({
		name: caseName,
		overflow: document.documentElement.scrollWidth > innerWidth,
		rootClass: document.documentElement.className,
		bodyFont: getComputedStyle(document.body).fontFamily,
		bodyBg: getComputedStyle(document.body).backgroundColor,
		bodyColor: getComputedStyle(document.body).color,
		h1: document.querySelector("h1")?.textContent?.trim().slice(0, 60) ?? null,
	}), name));
	await page.close();
}
console.log(JSON.stringify(report, null, 2));
await browser.close();
