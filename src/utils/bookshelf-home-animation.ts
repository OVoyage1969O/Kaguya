import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { navigateToPage } from "@/utils/navigation-utils";

gsap.registerPlugin(ScrollTrigger);

export function mountBookshelfAnimations(): () => void {
	const root = document.querySelector<HTMLElement>("[data-bk-root]");
	if (!root || root.dataset.bkMounted) return () => {};
	root.dataset.bkMounted = "true";
	const events = new AbortController();
	const books = Array.from(
		root.querySelectorAll<HTMLButtonElement>("[data-bk-book]"),
	);
	const panels = Array.from(
		root.querySelectorAll<HTMLElement>("[data-bk-volume]"),
	);
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
	const media = gsap.matchMedia();
	const intro = root.querySelector<HTMLElement>("[data-bk-intro]");
	const introTitle = intro?.querySelector("[data-bk-intro-title]");
	const introMark = intro?.querySelector(".el-opening__mark");
	const leaves = intro?.querySelectorAll("[data-bk-leaf]");
	// Escape the page's stacking context and Swup transforms so the curtain
	// covers the viewport, including the navigation and floating controls.
	if (intro) document.body.appendChild(intro);
	let active = -1; // 默认不选中任何书
	let panelMotion: gsap.core.Timeline | undefined;
	root.classList.add("is-enhanced");
	const sync = () => {
		books.forEach((book, i) =>
			book.setAttribute("aria-expanded", String(i === active)),
		);
		panels.forEach((panel, i) => {
			panel.hidden = i !== active;
		});
	};
	sync();
	const context = gsap.context(() => {
		books.forEach((book, index) => {
			book.addEventListener(
				"click",
				() => {
					if (index === active) return;
					panelMotion?.kill();
					gsap.set(panels, { clearProps: "transform,opacity,clipPath" });
					active = index;
					sync();
					if (!reduced.matches) {
						panelMotion = gsap.timeline({
							onComplete: () => ScrollTrigger.refresh(),
						});
						panelMotion.fromTo(
							panels[active],
							{ clipPath: "inset(0 0 100% 0)", y: 22 },
							{
								clipPath: "inset(0 0 0% 0)",
								y: 0,
								duration: 0.85,
								ease: "power3.inOut",
								clearProps: "transform,clipPath",
							},
						);
					} else ScrollTrigger.refresh();
				},
				{ signal: events.signal },
			);
			book.addEventListener(
				"keydown",
				(event) => {
					let next = index;
					if (event.key === "ArrowRight") next = (index + 1) % books.length;
					else if (event.key === "ArrowLeft")
						next = (index - 1 + books.length) % books.length;
					else if (event.key === "Home") next = 0;
					else if (event.key === "End") next = books.length - 1;
					else return;
					event.preventDefault();
					books[next].focus({ preventScroll: true });
					books[next].scrollIntoView({
						block: "nearest",
						inline: "nearest",
						behavior: reduced.matches ? "instant" : "smooth",
					});
					books[next].click();
				},
				{ signal: events.signal },
			);
		});
		root.querySelector<HTMLButtonElement>("[data-bk-random]")?.addEventListener(
			"click",
			(event) => {
				const urls: string[] = JSON.parse(
					(event.currentTarget as HTMLElement).dataset.entries || "[]",
				);
				if (urls.length)
					navigateToPage(urls[Math.floor(Math.random() * urls.length)]);
			},
			{ signal: events.signal },
		);
		media.add("(prefers-reduced-motion: no-preference)", () => {
			if (!intro || !introTitle || !introMark || !leaves?.length) return;
			const opening = gsap.timeline({ defaults: { ease: "power3.inOut" } });
			opening
				.set(intro, { display: "block" })
				.fromTo(
					introTitle,
					{ yPercent: 115, scaleY: 0.6 },
					{ yPercent: 0, scaleY: 1, duration: 1.1, ease: "power4.out" },
					0.1,
				)
				.to(
					introMark,
					{ clipPath: "inset(0 0 100% 0)", y: -30, duration: 0.8 },
					1.15,
				)
				.to(
					leaves[0],
					{ xPercent: -101, duration: 1.45, ease: "power4.inOut" },
					1.35,
				)
				.to(
					leaves[1],
					{ xPercent: 101, duration: 1.45, ease: "power4.inOut" },
					1.35,
				)
				.from(
					"[data-bk-title]",
					{ yPercent: 115, scaleY: 0.72, duration: 1.25, ease: "power4.out" },
					1.85,
				)
				.from(
					"[data-bk-heading]",
					{ clipPath: "inset(0 100% 0 0)", x: 24, duration: 1.1, stagger: 0.1 },
					2,
				)
				.from(
					"[data-bk-slot]",
					{
						y: 140,
						rotation: 9,
						scaleY: 0.75,
						autoAlpha: 0,
						duration: 1.45,
						stagger: 0.13,
						ease: "power4.out",
						clearProps: "all",
					},
					1.85,
				)
				.set(intro, { display: "none" }, 2.85);
			root
				.querySelectorAll<HTMLElement>("[data-bk-reveal]")
				.forEach((section) => {
					gsap.from(section, {
						clipPath: "inset(0 0 100% 0)",
						y: 50,
						duration: 1.3,
						ease: "power3.inOut",
						scrollTrigger: { trigger: section, start: "top 94%", once: true },
						clearProps: "clipPath,transform",
					});
				});
			return () => {
				panelMotion?.kill();
				gsap.set(panels, { clearProps: "transform,clipPath,opacity" });
			};
		});
	}, root);
	return () => {
		events.abort();
		panelMotion?.kill();
		media.revert();
		context.revert();
		if (intro) root.insertBefore(intro, root.firstChild);
		panels.forEach((panel) => {
			panel.hidden = false;
		});
		root.classList.remove("is-enhanced");
		delete root.dataset.bkMounted;
	};
}

let dispose: (() => void) | undefined;
let initialized = false;
export function initBookshelfLifecycle() {
	if (initialized) return;
	initialized = true;
	const boot = () => {
		if (
			document.querySelector<HTMLElement>("[data-bk-root]")?.dataset.bkMounted
		)
			return;
		dispose?.();
		dispose = mountBookshelfAnimations();
	};
	const cleanup = () => {
		dispose?.();
		dispose = undefined;
	};
	let swupBound = false;
	const bindSwup = () => {
		if (swupBound || !window.swup?.hooks) return;
		swupBound = true;
		window.swup.hooks.before("content:replace", cleanup);
		window.swup.hooks.on("page:view", boot);
	};
	bindSwup();
	document.addEventListener("swup:enable", bindSwup);
	document.addEventListener("astro:before-swap", cleanup);
	document.addEventListener("astro:page-load", boot);
	boot();
}
