import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { riseIntoPlace } from "./editorial-motion";

gsap.registerPlugin(ScrollTrigger);
let initialized = false;

/** Only animate the shared shell; page-specific openings keep their own timelines. */
export function initStudyMotion() {
	if (initialized) return;
	initialized = true;
	let mounted: HTMLElement | null = null;
	let media: gsap.MatchMedia | undefined;
	let observer: IntersectionObserver | undefined;
	let entranceAnimations: Animation[] = [];
	const cleanup = () => {
		observer?.disconnect();
		observer = undefined;
		entranceAnimations.forEach(animation => animation.cancel());
		entranceAnimations = [];
		media?.revert();
		media = undefined;
		mounted = null;
	};
	const mount = () => {
		const page = document.getElementById("swup-container");
		if (page === mounted) return;
		cleanup();
		if (!page) return;
		mounted = page;
		media = gsap.matchMedia();
		media.add("(prefers-reduced-motion: no-preference)", () => {
			// Content stays visible without JavaScript. Animate only editorial groups,
			// leaving article prose and the home scene's own choreography untouched.
			const entrance = page.querySelectorAll<HTMLElement>(
				".page-title, .post-hero, .archive-stats, .tools-tab-wrapper",
			);
			entrance.forEach((element, index) => {
				entranceAnimations.push(riseIntoPlace(element, 140 + index * 65, 16));
			});
			observer = new IntersectionObserver(entries => {
				const visible = entries.filter(entry => entry.isIntersecting);
				visible.forEach((entry, index) => {
					observer?.unobserve(entry.target);
					entranceAnimations.push(riseIntoPlace(entry.target as HTMLElement, Math.min(index, 4) * 55));
				});
			}, { threshold: .08, rootMargin: "0px 0px 24px 0px" });
			page.querySelectorAll<HTMLElement>(
				".tools-card, .article-list-card, .related-posts, .el-volume, .el-pick",
			).forEach(element => observer?.observe(element));
			const stopEntrances = () => {
				observer?.disconnect();
				entranceAnimations.forEach(animation => animation.cancel());
				entranceAnimations = [];
			};
			const footer = page.querySelector<HTMLElement>("[data-study-footer]");
			if (footer) {
				const timeline = gsap.timeline({
					scrollTrigger: { trigger: footer, start: "top 92%", once: true },
				});
				timeline
					.from(footer.querySelector("[data-study-footer-line]"), {
						scaleX: 0,
						transformOrigin: "0 50%",
						duration: 1.5,
						ease: "power3.inOut",
					})
					.from(
						footer.querySelectorAll("[data-study-footer-item]"),
						{
							y: 38,
							clipPath: "inset(0 0 100% 0)",
							duration: 1.25,
							stagger: 0.13,
							ease: "power3.out",
							clearProps: "transform,clipPath",
						},
						0.2,
					);
			}
			return stopEntrances;
		});
	};
	let bound = false;
	const bind = () => {
		if (bound || !window.swup?.hooks) return;
		bound = true;
		window.swup.hooks.before("content:replace", cleanup);
		window.swup.hooks.on("page:view", mount);
	};
	bind();
	document.addEventListener("swup:enable", bind);
	document.addEventListener("astro:before-swap", cleanup);
	document.addEventListener("astro:page-load", mount);
	mount();
}
