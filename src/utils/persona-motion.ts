import { gsap } from "gsap";

let initialized = false;

/** One panel's transform state at one end of a curtain move. */
type PanelState = {
	xPercent?: number;
	yPercent?: number;
	skewX?: number;
};

type Timing = { duration: number; stagger: number; ease: string };

/**
 * A curtain arrangement. Every arrangement moves the same material — flat Persona
 * colour planes covering the viewport — and differs only in how many panels it uses,
 * where they enter from, and which way they leave. Geometry lives in persona-theme.css
 * under the matching `[data-variant]`.
 */
type Arrangement = {
	id: string;
	/** How many pooled panels this arrangement uses. */
	panels: number;
	/** Where each panel waits before the curtain closes. */
	from: PanelState[];
	/** Where each panel sits with the curtain fully closed. */
	closed: PanelState[];
	/** Where each panel is heading as the curtain opens. */
	open: PanelState[];
	cover: Timing;
	reveal: Timing;
	/** Word fade-in offset within the cover timeline. */
	wordAt: number;
	/** Word exit offset within the reveal timeline. */
	wordOutAt: number;
};

const repeat = (count: number, state: PanelState): PanelState[] =>
	Array.from({ length: count }, () => ({ ...state }));

const ARRANGEMENTS: Arrangement[] = [
	{
		id: "planes-left",
		panels: 2,
		from: repeat(2, { xPercent: -112, skewX: -15 }),
		closed: repeat(2, { xPercent: 0, skewX: -15 }),
		open: repeat(2, { xPercent: 116, skewX: -15 }),
		cover: { duration: 0.62, stagger: 0.06, ease: "power3.inOut" },
		reveal: { duration: 0.85, stagger: 0.08, ease: "expo.inOut" },
		wordAt: 0.42,
		wordOutAt: 0.15,
	},
	{
		id: "planes-right",
		panels: 2,
		from: repeat(2, { xPercent: 112, skewX: 15 }),
		closed: repeat(2, { xPercent: 0, skewX: 15 }),
		open: repeat(2, { xPercent: -116, skewX: 15 }),
		cover: { duration: 0.62, stagger: 0.06, ease: "power3.inOut" },
		reveal: { duration: 0.85, stagger: 0.08, ease: "expo.inOut" },
		wordAt: 0.42,
		wordOutAt: 0.15,
	},
	{
		id: "blinds",
		panels: 5,
		from: repeat(5, { yPercent: -108 }),
		closed: repeat(5, { yPercent: 0 }),
		open: repeat(5, { yPercent: 108 }),
		cover: { duration: 0.6, stagger: 0.055, ease: "power3.inOut" },
		reveal: { duration: 0.8, stagger: 0.06, ease: "expo.inOut" },
		wordAt: 0.5,
		wordOutAt: 0.12,
	},
	{
		// Halves close towards the middle, then keep travelling so the content is
		// uncovered as a band that opens outward from the centre.
		id: "shutter",
		panels: 2,
		from: [{ yPercent: -108 }, { yPercent: 108 }],
		closed: [{ yPercent: 0 }, { yPercent: 0 }],
		open: [{ yPercent: 108 }, { yPercent: -108 }],
		cover: { duration: 0.62, stagger: 0.05, ease: "power3.inOut" },
		reveal: { duration: 0.9, stagger: 0, ease: "expo.inOut" },
		wordAt: 0.46,
		wordOutAt: 0.15,
	},
];

/** Per-panel state list → GSAP function-based vars. */
const panelProps = (states: PanelState[]) => ({
	xPercent: (i: number) => states[i]?.xPercent ?? 0,
	yPercent: (i: number) => states[i]?.yPercent ?? 0,
	skewX: (i: number) => states[i]?.skewX ?? 0,
});

/** A persistent curtain, with all route-local animation reverted before replacement. */
export function initPersonaMotion() {
	if (initialized) return;
	initialized = true;
	const wipe = document.querySelector<HTMLElement>("[data-p3-wipe]");
	if (!wipe) return;
	const panels = Array.from(wipe.querySelectorAll<HTMLElement>("[data-p3-panel]"));
	const word = wipe.querySelector<HTMLElement>(".p3-route-wipe__word");
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
	let media: gsap.MatchMedia | undefined;
	let curtain: gsap.core.Timeline | undefined;
	let fallback: ReturnType<typeof setTimeout> | undefined;
	let finishOut: (() => void) | undefined;
	let current: Element | null = null;
	let active: Arrangement = ARRANGEMENTS[0];
	let lastIndex = -1;

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
	/** Pick an arrangement at random, never repeating the previous one back to back. */
	const pick = (): Arrangement => {
		if (ARRANGEMENTS.length === 1) return ARRANGEMENTS[0];
		let i = Math.floor(Math.random() * ARRANGEMENTS.length);
		if (i === lastIndex) i = (i + 1) % ARRANGEMENTS.length;
		lastIndex = i;
		return ARRANGEMENTS[i];
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
			const used = panels.slice(0, active.panels);
			// 帘子先动，标题随后跟上，避免先退完留下一段空蓝。
			curtain = gsap
				.timeline({ onComplete: reset })
				.to(used, { ...panelProps(active.open), ...active.reveal }, 0)
				.to(
					word,
					{ yPercent: -120, opacity: 0, duration: 0.55, ease: "power2.in" },
					active.wordOutAt,
				);
		}
	};
	const cover = () => {
		reset();
		if (reduced.matches) return;
		active = pick();
		wipe.dataset.variant = active.id;
		const used = panels.slice(0, active.panels);
		// 先把色块摆到起点再显形，否则会闪一下上一次走位的残留位置。
		gsap.set(used, panelProps(active.from));
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
				.set(word, { visibility: "visible", opacity: 0, yPercent: 0 })
				.to(used, { ...panelProps(active.closed), ...active.cover }, 0)
				// 幕布即将合拢时标题淡入，而不是在最后一帧突然出现。
				.to(word, { opacity: 1, duration: 0.28, ease: "power2.out" }, active.wordAt);
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
