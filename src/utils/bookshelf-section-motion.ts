import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Scroll supplies the pace: the reader sees each page open, even on a slow visit. */
export function mountBookshelfSections(root: HTMLElement) {
	if (!root.classList.contains("atlas--exhibit")) {
		return { dispose: () => {}, refresh: () => {} };
	}
	const media = gsap.matchMedia();
	let refreshCall: gsap.core.Tween | undefined;
	let disposed = false;
	const context = gsap.context(() => {
		media.add(
			{
				motion: "(prefers-reduced-motion: no-preference)",
				desktop: "(min-width: 601px)",
				wide: "(min-width: 1280px)",
			},
			({ conditions }) => {
				if (!conditions?.motion) return;
				const desktop = !!conditions.desktop;
				const sideTravel = conditions.wide ? 46 : 0;
				root
					.querySelectorAll<HTMLElement>("[data-atlas-heading-line]")
					.forEach((line) => {
						gsap.fromTo(
							line,
							{ yPercent: 108, scaleX: 0.82 },
							{
								yPercent: 0,
								scaleX: 1,
								transformOrigin: "left bottom",
								ease: "power3.out",
								scrollTrigger: {
									trigger: line.parentElement,
									start: "top 93%",
									end: "top 61%",
									scrub: 0.65,
								},
							},
						);
					});
				root
					.querySelectorAll<HTMLElement>("[data-atlas-volume]")
					.forEach((volume, index) => {
						const art = volume.querySelector<HTMLElement>(".atlas-volume__art");
						const image = art?.querySelector("img");
						const page = volume.querySelector("[data-atlas-page]");
						if (!art || !image || !page) return;
						const direction = desktop && index % 2 ? -1 : 1;
						gsap.set(page, {
							transformOrigin: direction > 0 ? "right center" : "left center",
						});
						const unfolding = gsap.timeline({
							scrollTrigger: {
								trigger: art,
								start: "top 92%",
								end: "top 28%",
								scrub: 0.8,
							},
						});
						unfolding.fromTo(
							page,
							{ scaleX: 1 },
							{ scaleX: 0, duration: 1, ease: "power3.inOut" },
							0,
						);
						unfolding.fromTo(
							volume.querySelector(".atlas-volume__content"),
							{ x: sideTravel * direction, y: desktop ? 32 : 56 },
							{ x: 0, y: 0, duration: 0.85, ease: "power3.out" },
							0.12,
						);
						unfolding.fromTo(
							volume.querySelector("[data-atlas-volume-name]"),
							{ yPercent: 108, scaleX: 0.86 },
							{ yPercent: 0, scaleX: 1, duration: 0.7, ease: "power3.out" },
							0.15,
						);
						gsap.fromTo(
							image,
							{ scale: 1.24, yPercent: -5 },
							{
								scale: 1.14,
								yPercent: 5,
								ease: "none",
								scrollTrigger: {
									trigger: art,
									start: "top bottom",
									end: "bottom top",
									scrub: 0.8,
								},
							},
						);
					});
				root
					.querySelectorAll<HTMLElement>("[data-atlas-character]")
					.forEach((character, index) => {
						const portrait = character.querySelector<HTMLElement>(
							".atlas-character__portrait",
						);
						const caption = character.querySelector(
							".atlas-character__caption",
						);
						if (!portrait) return;
						const reveal = gsap.timeline({
							scrollTrigger: {
								trigger: character,
								start: "top 93%",
								end: "top 35%",
								scrub: 0.8,
							},
						});
						reveal.fromTo(
							portrait,
							{ y: index % 2 ? 110 : 68, clipPath: "inset(0 0 68% 0)" },
							{
								y: 0,
								clipPath: "inset(0 0 0% 0)",
								duration: 1,
								ease: "power3.inOut",
							},
							0,
						);
						if (caption)
							reveal.fromTo(
								caption,
								{ y: 36 },
								{ y: 0, duration: 0.7, ease: "power3.out" },
								0.2,
							);
					});
				const search = root.querySelector<HTMLElement>(".atlas-search");
				if (search)
					gsap.fromTo(
						search,
						{ "--atlas-search-line": 0 },
						{
							"--atlas-search-line": 1,
							ease: "power3.inOut",
							scrollTrigger: {
								trigger: search,
								start: "top 92%",
								end: "top 60%",
								scrub: 0.65,
							},
						},
					);
				const filters = root.querySelector(".atlas-filters");
				if (filters)
					gsap.fromTo(
						filters,
						{ y: 30 },
						{
							y: 0,
							ease: "power3.out",
							scrollTrigger: {
								trigger: filters,
								start: "top 94%",
								end: "top 72%",
								scrub: 0.6,
							},
						},
					);
				root
					.querySelectorAll<HTMLElement>("[data-atlas-entry]")
					.forEach((entry, index) => {
						gsap.set(entry, {
							"--atlas-rule-origin":
								desktop && index % 2 ? "right center" : "left center",
						});
						gsap.fromTo(
							entry,
							{ "--atlas-row-rule": 0 },
							{
								"--atlas-row-rule": 1,
								duration: 1.05,
								ease: "expo.out",
								scrollTrigger: { trigger: entry, start: "top 92%", once: true },
							},
						);
					});
			},
		);
	}, root);
	return {
		refresh: () => {
			refreshCall?.kill();
			refreshCall = gsap.delayedCall(0.12, () => {
				if (!disposed) ScrollTrigger.refresh();
			});
		},
		dispose: () => {
			disposed = true;
			refreshCall?.kill();
			media.revert();
			context.revert();
		},
	};
}
