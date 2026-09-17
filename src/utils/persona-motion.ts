import { gsap } from "gsap";

let initialized = false;

/** A persistent curtain, with all route-local animation reverted before replacement. */
export function initPersonaMotion() {
	if (initialized) return;
	initialized = true;
	const wipe = document.querySelector<HTMLElement>("[data-p3-wipe]");
	if (!wipe) return;
	const planes = wipe.querySelectorAll("[data-p3-wipe-plane]");
	const word = wipe.querySelector(".p3-route-wipe__word");
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
	let media: gsap.MatchMedia | undefined;
	let curtain: gsap.core.Timeline | undefined;
	let fallback: ReturnType<typeof setTimeout> | undefined;
	let finishOut: (() => void) | undefined;
	let current: Element | null = null;

	const reset = () => {
		curtain?.kill();
		clearTimeout(fallback);
		wipe.hidden = true;
		gsap.set(word, { visibility: "hidden", opacity: 0, yPercent: 0 });
		finishOut?.();
		finishOut = undefined;
	};
	const cleanup = () => {
		media?.revert();
		media = undefined;
		current = null;
	};
	const mount = () => {
		const page = document.getElementById("swup-container");
		if (page === current) return;
		cleanup();
		current = page;
		if (!page) return;
		media = gsap.matchMedia();
		media.add("(prefers-reduced-motion: no-preference)", () => {
			const type = page.querySelector("[data-p3-masthead-type]");
			if (type)
				gsap.from(type, {
					yPercent: 115,
					scaleY: 0.55,
					duration: 1.25,
					delay: wipe.hidden ? 0.08 : 0.3,
					ease: "expo.out",
					clearProps: "transform",
				});
		});
		if (!wipe.hidden) {
			curtain?.kill();
			// 幕布合拢期间标题一直停留在画面里，拉帘时让它先退场再开帘。
			// 之前这里是一帧就 set 成 hidden，白字只闪了一下才显得刺眼。
			curtain = gsap
				.timeline({ onComplete: reset })
				.to(
					planes,
					{
						xPercent: 115,
						duration: 0.85,
						stagger: 0.08,
						ease: "expo.inOut",
					},
					0,
				)
				// 标题跟着帘子一起退，而不是先退完留下一段空蓝。
				.to(word, { yPercent: -120, opacity: 0, duration: 0.55, ease: "power2.in" }, 0.15);
		}
	};
	const cover = () => {
		reset();
		if (reduced.matches) return;
		wipe.hidden = false;
		fallback = setTimeout(reset, 4500);
		return new Promise<void>((resolve) => {
			finishOut = resolve;
			curtain = gsap
				.timeline({
					onComplete: () => {
						finishOut = undefined;
						resolve();
					},
				})
				.set(planes, { x: 0, xPercent: -110, skewX: -15 })
				.set(word, { visibility: "visible", opacity: 0, yPercent: 0 })
				.to(
					planes,
					{
						xPercent: 0,
						duration: 0.62,
						stagger: 0.06,
						ease: "power3.inOut",
					},
					0,
				)
				// 幕布即将合拢时标题淡入，而不是在最后一帧突然出现。
				.to(word, { opacity: 1, duration: 0.28, ease: "power2.out" }, 0.42);
		});
	};
	let bound = false;
	const bind = () => {
		if (bound || !window.swup?.hooks) return;
		bound = true;
		window.swup.hooks.on("animation:out:await", cover);
		window.swup.hooks.before("content:replace", cleanup);
		window.swup.hooks.on("page:view", mount);
	};
	reduced.addEventListener("change", () => {
		if (reduced.matches) reset();
	});
	window.addEventListener("pagehide", reset);
	document.addEventListener("swup:enable", bind);
	document.addEventListener("astro:before-swap", cleanup);
	document.addEventListener("astro:page-load", mount);
	bind();
	mount();
}
