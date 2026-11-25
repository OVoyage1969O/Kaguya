import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mountBookshelfSections } from "./bookshelf-section-motion";
import { riseIntoPlace } from "./editorial-motion";
import { navigateToPage } from "./navigation-utils";
import { mountWorldStage } from "./world-stage";

gsap.registerPlugin(ScrollTrigger);

export function mountBookshelfAnimations(): () => void {
	const root = document.querySelector<HTMLElement>("[data-bk-root]");
	if (!root || root.dataset.bkMounted) return () => {};
	root.dataset.bkMounted = "true";
	const events = new AbortController();
	let refreshSectionMotion: (() => void) | undefined;
	let disposed = false;
	let resultAnimations: Animation[] = [];
	const input = root.querySelector<HTMLInputElement>("[data-atlas-search]");
	const filters = [
		...root.querySelectorAll<HTMLButtonElement>("[data-atlas-filter]"),
	];
	const entries = [
		...root.querySelectorAll<HTMLAnchorElement>("[data-atlas-entry]"),
	];
	const result = root.querySelector<HTMLElement>("[data-atlas-result]");
	const empty = root.querySelector<HTMLElement>("[data-atlas-empty]");
	const clear = root.querySelector<HTMLButtonElement>("[data-atlas-clear]");
	const params = new URLSearchParams(location.search);
	const category = params.get("category");
	let selected =
		category &&
		filters.some((button) => button.dataset.atlasFilter === category)
			? category
			: "all";
	if (input) input.value = params.get("q") || "";
	const reduced = matchMedia("(prefers-reduced-motion: reduce)");

	function filter(writeUrl = false, animate = false) {
		const query = (input?.value || "").trim().toLocaleLowerCase();
		const words = query.split(/\s+/).filter(Boolean);
		resultAnimations.forEach((animation) => {
			animation.cancel();
		});
		resultAnimations = [];
		const visible: HTMLElement[] = [];
		entries.forEach((entry) => {
			const text = (entry.dataset.search || "").toLocaleLowerCase();
			entry.hidden =
				!(selected === "all" || entry.dataset.category === selected) ||
				!words.every((word) => text.includes(word));
			if (!entry.hidden) visible.push(entry);
		});
		filters.forEach((button) => {
			const active = button.dataset.atlasFilter === selected;
			button.classList.toggle("is-active", active);
			button.setAttribute("aria-pressed", String(active));
		});
		if (result)
			result.textContent = query
				? `找到 ${visible.length} 个匹配词条`
				: `共 ${visible.length} 个词条`;
		if (empty) empty.hidden = visible.length > 0;
		if (clear) clear.hidden = !input?.value;
		if (writeUrl) {
			const target = new URL(location.href);
			if (query) target.searchParams.set("q", input?.value.trim() || "");
			else target.searchParams.delete("q");
			if (selected !== "all") target.searchParams.set("category", selected);
			else target.searchParams.delete("category");
			history.replaceState(history.state, "", target);
		}
		if (animate && !reduced.matches)
			visible.slice(0, 8).forEach((entry, index) => {
				resultAnimations.push(riseIntoPlace(entry, index * 25, 10));
			});
		if (writeUrl) refreshSectionMotion?.();
	}
	input?.addEventListener(
		"input",
		(event) => {
			if (!(event as InputEvent).isComposing) filter(true);
		},
		{ signal: events.signal },
	);
	input?.addEventListener("compositionend", () => filter(true), {
		signal: events.signal,
	});
	filters.forEach((button) => {
		button.addEventListener(
			"click",
			() => {
				selected = button.dataset.atlasFilter || "all";
				filter(true, true);
			},
			{ signal: events.signal },
		);
	});
	const reset = () => {
		selected = "all";
		if (input) input.value = "";
		filter(true, true);
		input?.focus({ preventScroll: true });
	};
	clear?.addEventListener(
		"click",
		() => {
			if (input) input.value = "";
			filter(true);
			input?.focus({ preventScroll: true });
		},
		{ signal: events.signal },
	);
	root
		.querySelector("[data-atlas-reset]")
		?.addEventListener("click", reset, { signal: events.signal });
	root.querySelector("[data-atlas-search-form]")?.addEventListener(
		"submit",
		(event) => {
			event.preventDefault();
			filter(true);
		},
		{ signal: events.signal },
	);
	root.querySelector<HTMLElement>("[data-atlas-random]")?.addEventListener(
		"click",
		(event) => {
			const links: string[] = JSON.parse(
				(event.currentTarget as HTMLElement).dataset.entries || "[]",
			);
			if (links.length)
				navigateToPage(links[Math.floor(Math.random() * links.length)]);
		},
		{ signal: events.signal },
	);
	filter();

	const disposeStage = mountWorldStage(root);
	const sectionMotion = mountBookshelfSections(root);
	refreshSectionMotion = sectionMotion.refresh;
	void document.fonts.ready.then(() => {
		if (!disposed) ScrollTrigger.refresh();
	});
	return () => {
		disposed = true;
		events.abort();
		disposeStage();
		resultAnimations.forEach((animation) => {
			animation.cancel();
		});
		sectionMotion.dispose();
		delete root.dataset.bkMounted;
	};
}

let dispose: (() => void) | undefined;
let initialized = false;
export function initBookshelfLifecycle() {
	if (initialized) return;
	initialized = true;
	const cleanup = () => {
		dispose?.();
		dispose = undefined;
	};
	const boot = () => {
		if (
			document.querySelector<HTMLElement>("[data-bk-root]")?.dataset.bkMounted
		)
			return;
		cleanup();
		dispose = mountBookshelfAnimations();
	};
	let bound = false;
	const bind = () => {
		if (bound || !window.swup?.hooks) return;
		bound = true;
		window.swup.hooks.before("content:replace", cleanup);
		window.swup.hooks.on("page:view", boot);
	};
	document.addEventListener("swup:enable", bind);
	document.addEventListener("astro:before-swap", cleanup);
	document.addEventListener("astro:page-load", boot);
	window.addEventListener("pagehide", cleanup);
	window.addEventListener("pageshow", boot);
	bind();
	boot();
}
