import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { navigateToPage } from "@/utils/navigation-utils";

gsap.registerPlugin(ScrollTrigger);

export function mountBookshelfAnimations(): () => void {
	const root = document.querySelector<HTMLElement>("[data-bk-root]");
	if (!root || root.dataset.bkMounted) return () => {};
	root.dataset.bkMounted = "true";
	const events = new AbortController();
	const media = gsap.matchMedia();
	const intro = root.querySelector<HTMLElement>("[data-bk-intro]");
	const volumes = Array.from(
		root.querySelectorAll<HTMLDetailsElement>("[data-bk-volume]"),
	);
	let opening: gsap.core.Timeline | undefined;
	let watchdog: ReturnType<typeof setTimeout> | undefined;
	let disposed = false;
	const finishOpening = () => {
		if (watchdog) clearTimeout(watchdog);
		opening?.progress(1);
		if (intro) intro.hidden = true;
		root.dataset.bkOpening = "complete";
	};
	if (intro) document.body.appendChild(intro);
	intro?.querySelector("[data-bk-skip]")?.addEventListener(
		"click",
		() => {
			finishOpening();
			root
				.querySelector<HTMLAnchorElement>(".el-index-link")
				?.focus({ preventScroll: true });
		},
		{ signal: events.signal },
	);
	document.addEventListener(
		"keydown",
		(event) => {
			if (event.key === "Escape" || event.key === "Tab") finishOpening();
		},
		{ signal: events.signal },
	);
	// User intent takes priority over the opening; scrolling is never locked.
	window.addEventListener("wheel", finishOpening, {
		passive: true,
		signal: events.signal,
	});
	window.addEventListener("touchstart", finishOpening, {
		passive: true,
		signal: events.signal,
	});
	root.addEventListener("pointerdown", finishOpening, {
		signal: events.signal,
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

	const context = gsap.context(() => {
		media.add(
			{
				motion: "(prefers-reduced-motion: no-preference)",
				desktop: "(min-width: 901px)",
			},
			(mm) => {
				const motionEvents = new AbortController();
				if (!mm.conditions?.motion) {
					if (intro) intro.hidden = true;
					root.dataset.bkOpening = "complete";
					return;
				}
				const titles = root.querySelectorAll("[data-bk-title]");
				const heroImages = root.querySelectorAll("[data-bk-hero-image]");
				const heroDetails = root.querySelectorAll("[data-bk-hero-detail]");
				const isAtOpening =
					!location.hash && window.scrollY < root.offsetTop + 200;
				if (intro && root.dataset.bkOpening !== "complete" && isAtOpening) {
					intro.hidden = false;
					root.dataset.bkOpening = "playing";
					const curtains = intro.querySelectorAll("[data-bk-curtain]");
					opening = gsap.timeline({
						defaults: { ease: "power4.inOut" },
						onComplete: () => {
							intro.hidden = true;
							root.dataset.bkOpening = "complete";
							if (watchdog) clearTimeout(watchdog);
						},
					});
					opening
						.fromTo(
							intro.querySelectorAll("[data-bk-intro-word]"),
							{ yPercent: 125, scaleY: 0.48, rotation: -3 },
							{
								yPercent: 0,
								scaleY: 1,
								rotation: 0,
								duration: 1.25,
								stagger: 0.12,
								ease: "expo.out",
							},
							0.08,
						)
						.fromTo(
							intro.querySelector("[data-bk-intro-line]"),
							{ scaleX: 0 },
							{ scaleX: 1, duration: 1.25 },
							0.1,
						)
						.to(
							intro.querySelector(".el-opening__identity"),
							{ yPercent: -15, clipPath: "inset(0 0 100% 0)", duration: 1.15 },
							1.15,
						)
						.to(curtains[0], { yPercent: -102, duration: 1.8 }, 1.25)
						.to(curtains[1], { yPercent: 102, duration: 1.8 }, 1.35)
						.from(
							titles,
							{
								yPercent: 120,
								scaleY: 0.6,
								rotation: -2,
								transformOrigin: "left bottom",
								duration: 1.65,
								stagger: 0.13,
								ease: "expo.out",
								clearProps: "transform",
							},
							1.7,
						)
						.from(
							heroImages,
							{
								y: 145,
								scale: 0.68,
								rotation: 8,
								clipPath: "inset(0 0 100% 0)",
								duration: 1.75,
								stagger: 0.17,
								ease: "expo.out",
								clearProps: "transform,clipPath",
							},
							1.68,
						)
						.from(
							heroDetails,
							{
								x: 28,
								clipPath: "inset(0 100% 0 0)",
								duration: 1.25,
								stagger: 0.08,
								clearProps: "transform,clipPath",
							},
							2.0,
						);
					watchdog = setTimeout(finishOpening, 5500);
				} else {
					if (intro) intro.hidden = true;
					root.dataset.bkOpening = "complete";
				}

				root
					.querySelectorAll<HTMLElement>("[data-bk-section-heading]")
					.forEach((heading) => {
						gsap.from(heading, {
							x: -35,
							clipPath: "inset(0 100% 0 0)",
							duration: 1.35,
							ease: "expo.out",
							clearProps: "transform,clipPath",
							scrollTrigger: { trigger: heading, start: "top 93%", once: true },
						});
					});
				const revealPicture = (frame: HTMLElement) => {
					const shutter = frame.querySelector("[data-bk-shutter]");
					if (!shutter) return;
					return gsap.fromTo(
						shutter,
						{ scaleY: 1 },
						{
							scaleY: 0,
							duration: 1.45,
							ease: "expo.inOut",
							clearProps: "transform",
							scrollTrigger: { trigger: frame, start: "top 90%", once: true },
						},
					);
				};
				root
					.querySelectorAll<HTMLElement>("[data-bk-image-reveal]")
					.forEach(revealPicture);
				volumes
					.filter((volume) => volume.open)
					.forEach((volume) => {
						const frame = volume.querySelector<HTMLElement>(
							".el-volume__picture",
						);
						if (frame) revealPicture(frame);
					});
				const volumeMotions = new Map<HTMLDetailsElement, gsap.core.Timeline>();
				volumes.forEach((volume) => {
					volume.addEventListener(
						"toggle",
						() => {
							volumeMotions.get(volume)?.kill();
							if (volume.open)
								mm.add(() => {
									const shutter = volume.querySelector("[data-bk-shutter]");
									const rows = volume.querySelectorAll(".el-entry");
									gsap.set(rows, { clearProps: "transform,clipPath" });
									const timeline = gsap.timeline();
									if (shutter)
										timeline.fromTo(
											shutter,
											{ scaleY: 1 },
											{
												scaleY: 0,
												duration: 1.25,
												ease: "expo.inOut",
												clearProps: "transform",
											},
											0,
										);
									timeline.from(
										rows,
										{
											x: 38,
											clipPath: "inset(0 100% 0 0)",
											duration: 1,
											stagger: 0.07,
											ease: "expo.out",
											clearProps: "transform,clipPath",
										},
										0.1,
									);
									volumeMotions.set(volume, timeline);
								});
							// Native details owns layout and keyboard behavior; refresh after its size changes.
							ScrollTrigger.refresh();
						},
						{ signal: motionEvents.signal },
					);
				});

				// Parallax is desktop-only and bounded to 5% of the oversized image.
				// It never alters layout or drives a component render on each scroll frame.
				if (mm.conditions?.desktop) {
					root
						.querySelectorAll<HTMLElement>("[data-bk-parallax-frame]")
						.forEach((frame) => {
							if (frame.closest("details")) return;
							const image = frame.querySelector("[data-bk-parallax]");
							if (!image) return;
							gsap.fromTo(
								image,
								{ yPercent: -4 },
								{
									yPercent: 4,
									ease: "none",
									scrollTrigger: {
										trigger: frame,
										start: "top bottom",
										end: "bottom top",
										scrub: 1.4,
									},
								},
							);
						});
				}
				const finale = root.querySelector<HTMLElement>("[data-bk-finale]");
				if (finale)
					gsap.from(finale.querySelector("[data-bk-finale-text]"), {
						xPercent: 20,
						scaleX: 0.82,
						transformOrigin: "left center",
						duration: 1.7,
						ease: "expo.out",
						clearProps: "transform",
						scrollTrigger: { trigger: finale, start: "top 85%", once: true },
					});
				return () => {
					motionEvents.abort();
					volumeMotions.forEach((timeline) => {
						timeline.kill();
					});
					if (watchdog) clearTimeout(watchdog);
					if (intro) intro.hidden = true;
					root.dataset.bkOpening = "complete";
					opening = undefined;
				};
			},
		);
	}, root);
	// Font metrics may settle after the first paint. Never refresh a disposed route.
	void document.fonts.ready.then(() => {
		if (!disposed) ScrollTrigger.refresh();
	});
	return () => {
		disposed = true;
		events.abort();
		if (watchdog) clearTimeout(watchdog);
		media.revert();
		context.revert();
		if (intro) {
			intro.hidden = true;
			root.insertBefore(intro, root.firstChild);
		}
		delete root.dataset.bkMounted;
		delete root.dataset.bkOpening;
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
