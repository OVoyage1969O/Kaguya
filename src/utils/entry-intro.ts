/**
 * 词条开场动画：进入某个词条时播放一次带 alpha 的 webm。
 *
 * 这段逻辑挂在全局（Layout.astro）而不是词条页自己的 script 上，因为
 * @swup/astro 换页时不会重新执行模块脚本——模块脚本只在首次整页加载时
 * 跑一次。所以这里注册一次全局的 astro:page-load，每次换页再去找当前
 * 页面上有没有待播放的开场。
 */

const PREFIX = "p3-intro:";

/** 隐私模式等场景 localStorage 会抛错；读不到就按「没看过」处理。 */
const hasSeen = (key: string) => {
	try {
		return window.localStorage.getItem(PREFIX + key) === "1";
	} catch {
		return false;
	}
};

const markSeen = (key: string) => {
	try {
		window.localStorage.setItem(PREFIX + key, "1");
	} catch {
		/* 写不进去就算了：本次照常播放，下次还会再放一次。 */
	}
};

let cleanupCurrent: (() => void) | undefined;

function play(root: HTMLElement) {
	const video = root.querySelector<HTMLVideoElement>(".p3-intro__video");
	const key = root.dataset.key ?? "";
	const once = root.dataset.once !== "0";
	const src = root.dataset.src ?? "";

	// 已经看过：直接摘掉，连视频文件都不下载。
	if (once && key && hasSeen(key)) {
		root.remove();
		return;
	}
	// 系统要求减少动态效果：整段跳过，并且不记为已播放，
	// 这样访客关掉该设置之后仍然能看到。
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		root.remove();
		return;
	}
	if (!video || !src) {
		root.remove();
		return;
	}

	let settled = false;
	let timer = 0;

	const cleanup = () => {
		window.clearTimeout(timer);
		document.removeEventListener("pointerdown", skip, true);
		document.removeEventListener("keydown", skip, true);
		window.removeEventListener("pagehide", finish);
		document.removeEventListener("astro:before-swap", finish);
		cleanupCurrent = undefined;
	};

	const finish = () => {
		if (settled) return;
		settled = true;
		cleanup();
		root.classList.remove("is-playing");
		root.classList.add("is-done");
		if (once && key) markSeen(key);
		window.setTimeout(() => root.remove(), 450);
	};

	const skip = () => finish();

	video.addEventListener("ended", finish, { once: true });
	video.addEventListener("error", finish, { once: true });
	// 兜底：视频没起来或中途卡住时，不让遮罩一直留在页面上。
	timer = window.setTimeout(finish, 15000);

	// 任何交互都可以提前结束，不必看完。
	document.addEventListener("pointerdown", skip, true);
	document.addEventListener("keydown", skip, true);
	window.addEventListener("pagehide", finish);
	document.addEventListener("astro:before-swap", finish);
	cleanupCurrent = finish;

	video.src = src;
	root.hidden = false;
	requestAnimationFrame(() => root.classList.add("is-playing"));

	const started = video.play();
	if (started && typeof started.catch === "function") started.catch(finish);
}

export function initEntryIntro() {
	const run = () => {
		// 一次导航只处理一个待播开场；加标记避免首次整页加载时被重复处理。
		const root = document.querySelector<HTMLElement>("[data-p3-intro]:not([data-p3-intro-armed])");
		if (!root) return;
		root.dataset.p3IntroArmed = "1";
		cleanupCurrent?.();
		play(root);
	};

	document.addEventListener("astro:page-load", run);
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", run, { once: true });
	} else {
		run();
	}
}
