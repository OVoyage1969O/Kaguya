import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
let initialized = false;

/** Only animate the shared shell; page-specific openings keep their own timelines. */
export function initStudyMotion() {
	if (initialized) return;
	initialized = true;
	let mounted: HTMLElement | null = null;
	let media: gsap.MatchMedia | undefined;
	const cleanup = () => {
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
