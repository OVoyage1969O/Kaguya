import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** One scenic aperture survives opening, scroll and manual world changes. */
export function mountWorldStage(root: HTMLElement): () => void {
	const stage = root.querySelector<HTMLElement>("[data-world-stage]");
	if (!stage) return () => {};
	const events = new AbortController();
	const media = gsap.matchMedia();
	const reduced = matchMedia("(prefers-reduced-motion: reduce)");
	const switches = [
		...stage.querySelectorAll<HTMLAnchorElement>("[data-world-switch]"),
	];
	const scenes = [...stage.querySelectorAll<HTMLElement>("[data-world-scene]")];
	const portraits = [
		...stage.querySelectorAll<HTMLAnchorElement>("[data-world-portrait]"),
	];
	const word = stage.querySelector<HTMLElement>("[data-world-word]");
	const open = stage.querySelector<HTMLAnchorElement>("[data-world-open]");
	const status = stage.querySelector<HTMLElement>("[data-world-status]");
	const replay = stage.querySelector<HTMLButtonElement>("[data-world-replay]");
	const frame = stage.querySelector<HTMLElement>(".atlas-stage");
	const aperture = stage.querySelector<HTMLElement>("[data-world-window]");
	const lines = [...stage.querySelectorAll<HTMLElement>("[data-world-line]")];
	const details = stage.querySelectorAll<HTMLElement>("[data-world-detail]");
	const shutters = stage.querySelectorAll("[data-world-shutter]");
	const movingControls = stage.querySelectorAll<HTMLElement>(
		".atlas-stage__actions,.atlas-stage__portraits",
	);
	const setControlsHidden = (hidden: boolean) => {
		movingControls.forEach((group) => {
			if (group.inert === hidden) return;
			group.inert = hidden;
			if (hidden) group.setAttribute("aria-hidden", "true");
			else group.removeAttribute("aria-hidden");
		});
	};
	let current = 0;
	let transition: gsap.core.Timeline | undefined;
	let opening: gsap.core.Timeline | undefined;
	let scrollScene: gsap.core.Timeline | undefined;
	let fallback: ReturnType<typeof setTimeout> | undefined;
	let disposed = false;

	function finishOpening() {
		if (fallback) clearTimeout(fallback);
		opening?.progress(1);
		delete stage?.dataset.opening;
	}

	const context = gsap.context(() => {
		function select(index: number) {
			if (index === current) return;
			finishOpening();
			transition?.progress(1).kill();
			const previous = scenes[current];
			current = index;
			const button = switches[index];
			const next = scenes[index];
			const id = button.dataset.worldSwitch;
			switches.forEach((item, i) => {
				item.classList.toggle("is-current", i === index);
				if (i === index) item.setAttribute("aria-current", "true");
				else item.removeAttribute("aria-current");
			});
			portraits.forEach((portrait) => {
				const active = portrait.dataset.worldPortrait === id;
				portrait.classList.toggle("is-current", active);
				portrait.tabIndex = active ? 0 : -1;
				if (active) portrait.removeAttribute("aria-hidden");
				else portrait.setAttribute("aria-hidden", "true");
			});
			if (word) word.textContent = button.dataset.worldWord || "";
			if (open) {
				open.href = button.dataset.worldHref || button.href;
				if (open.firstChild)
					open.firstChild.textContent = `打开${button.dataset.worldName}`;
			}
			if (status) status.textContent = `正在展出：${button.dataset.worldName}`;
			next.classList.add("is-current");
			const finish = () => {
				scenes.forEach((scene, i) => {
					scene.classList.toggle("is-current", i === current);
				});
				gsap.set(scenes, { clearProps: "clipPath,zIndex" });
			};
			if (reduced.matches) {
				finish();
				return;
			}
			gsap.set(previous, { zIndex: 1 });
			gsap.set(next, { zIndex: 2 });
			transition = gsap.timeline({ onComplete: finish });
			transition.fromTo(
				next,
				{ clipPath: "inset(0 0 0 100%)" },
				{ clipPath: "inset(0 0 0 0%)", duration: 1.2, ease: "power4.inOut" },
				0,
			);
			const portrait = portraits.find(
				(item) => item.dataset.worldPortrait === id,
			);
			if (portrait)
				transition.fromTo(
					portrait,
					{ clipPath: "inset(100% 0 0 0)", y: 24 },
					{
						clipPath: "inset(0% 0 0 0)",
						y: 0,
						duration: 1.2,
						ease: "expo.out",
						clearProps: "transform,clipPath",
					},
					0.25,
				);
			if (word)
				transition.fromTo(
					word,
					{ clipPath: "inset(100% 0 0 0)" },
					{
						clipPath: "inset(0% 0 0 0)",
						duration: 1,
						ease: "expo.out",
						clearProps: "clipPath",
					},
					0.3,
				);
		}

		switches.forEach((button, index) => {
			button.addEventListener(
				"click",
				(event) => {
					if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
						return;
					event.preventDefault();
					select(index);
				},
				{ signal: events.signal },
			);
			button.addEventListener(
				"keydown",
				(event) => {
					if (event.ctrlKey || event.metaKey || event.altKey) return;
					let next = index;
					if (event.key === "ArrowRight") next = (index + 1) % switches.length;
					else if (event.key === "ArrowLeft")
						next = (index - 1 + switches.length) % switches.length;
					else if (event.key === "Home") next = 0;
					else if (event.key === "End") next = switches.length - 1;
					else return;
					event.preventDefault();
					switches[next].focus({ preventScroll: true });
					select(next);
					switches[next].scrollIntoView({
						block: "nearest",
						inline: "nearest",
						behavior: "instant",
					});
				},
				{ signal: events.signal },
			);
		});

		media.add(
			{
				desktop: "(min-width: 601px)",
				mobile: "(max-width: 600px)",
				short: "(max-height: 803px)",
				motion: "(prefers-reduced-motion: no-preference)",
			},
			(ctx) => {
				if (!ctx.conditions?.motion || !frame || !aperture) {
					setControlsHidden(false);
					if (replay) replay.disabled = true;
					return;
				}
				if (replay) replay.disabled = false;
				const mobile = !!ctx.conditions.mobile;
				const restingClip = getComputedStyle(aperture).clipPath;
				scrollScene = gsap.timeline({
					defaults: { ease: "none" },
					scrollTrigger: {
						trigger: frame,
						start: "top 94px",
						end: () => `+=${innerHeight * (mobile ? 0.55 : 1.25)}`,
						pin: !mobile || !ctx.conditions?.short,
						scrub: 0.8,
						invalidateOnRefresh: true,
						onUpdate: (self) => {
							setControlsHidden(self.progress > 0.025);
							if (self.progress > 0.015 && stage.dataset.opening)
								finishOpening();
						},
					},
				});
				scrollScene.fromTo(
					aperture,
					{ clipPath: restingClip },
					{
						clipPath: mobile ? "inset(0% 0% 9% 0%)" : "inset(0% 0% 8% 0%)",
						duration: 0.62,
						immediateRender: false,
					},
					0,
				);
				scrollScene.to(
					stage.querySelectorAll(".atlas-title-mask"),
					{
						xPercent: (i) => (i ? 210 : -115),
						yPercent: mobile ? -30 : -8,
						duration: 0.55,
					},
					0,
				);
				scrollScene.to(
					stage.querySelector(
						".atlas-stage__copy>p:not(.atlas-stage__translation)",
					),
					{ y: -50, clipPath: "inset(0 0 100% 0)", duration: 0.3 },
					0.05,
				);
				scrollScene.to(
					stage.querySelectorAll(
						".atlas-stage__translation,.atlas-stage__actions",
					),
					{
						y: -60,
						clipPath: "inset(0 0 100% 0)",
						duration: 0.4,
						stagger: 0.06,
					},
					0.08,
				);
				scrollScene.to(
					stage.querySelector(".atlas-stage__portraits"),
					{ xPercent: 150, yPercent: -15, duration: 0.45 },
					0.2,
				);
				scrollScene.to(
					stage.querySelector(".atlas-stage__scenes"),
					{ scale: 1.09, yPercent: -3, duration: 1 },
					0,
				);
				scrollScene.to(
					word,
					{ xPercent: mobile ? 0 : -12, yPercent: -20, duration: 0.45 },
					0.45,
				);
				scrollScene.to({}, { duration: 0.2 }, 0.8);
				scrollScene.scrollTrigger?.disable();

				const play = (event?: Event) => {
					if (disposed) return;
					opening?.kill();
					scrollScene?.scrollTrigger?.disable();
					if (event) window.scrollTo({ top: 0, behavior: "instant" });
					scrollScene?.progress(0);
					setControlsHidden(false);
					stage.dataset.opening = "true";
					if (fallback) clearTimeout(fallback);
					const reveal = () => {
						delete stage.dataset.opening;
						if (fallback) clearTimeout(fallback);
						scrollScene?.scrollTrigger?.enable();
						ScrollTrigger.refresh();
					};
					opening = gsap.timeline({
						defaults: { ease: "expo.out" },
						onComplete: reveal,
					});
					opening.fromTo(
						aperture,
						{
							clipPath: mobile
								? "inset(48% 49.7% 9% 49.7%)"
								: "inset(3% 49.7% 10% 49.7%)",
						},
						{ clipPath: restingClip, duration: 1.9 },
						0.4,
					);
					opening.fromTo(
						shutters,
						{ scaleY: 1 },
						{ scaleY: 0, stagger: 0.1, duration: 1.35, ease: "power4.inOut" },
						0.5,
					);
					opening.fromTo(
						lines,
						{ yPercent: 112, scaleX: 0.6, scaleY: 1.35 },
						{
							yPercent: 0,
							scaleX: 1,
							scaleY: 1,
							duration: 1.7,
							stagger: 0.18,
							clearProps: "transform",
						},
						0.15,
					);
					opening.fromTo(
						details,
						{ clipPath: "inset(100% 0 0 0)", y: 26 },
						{
							clipPath: "inset(0% 0 0 0)",
							y: 0,
							stagger: 0.1,
							duration: 1.2,
							clearProps: "clipPath,transform",
						},
						1.35,
					);
					const portrait = portraits.find((item) =>
						item.classList.contains("is-current"),
					);
					if (portrait)
						opening.fromTo(
							portrait,
							{ clipPath: "inset(100% 0 0 0)", y: 70 },
							{
								clipPath: "inset(0% 0 0 0)",
								y: 0,
								duration: 1.5,
								clearProps: "clipPath,transform",
							},
							1.25,
						);
					opening.fromTo(
						word,
						{ clipPath: "inset(100% 0 0 0)" },
						{
							clipPath: "inset(0% 0 0 0)",
							duration: 1.2,
							clearProps: "clipPath",
						},
						1.7,
					);
					opening.to({}, { duration: 0.3 }, 2.9);
					fallback = setTimeout(finishOpening, 5000);
				};
				replay?.addEventListener("click", play);
				// Deep links and restored scroll positions must not be pulled into the opening.
				if (
					!location.hash &&
					scrollY < 100 &&
					!new URLSearchParams(location.search).has("q")
				)
					play();
				else scrollScene.scrollTrigger?.enable();
				return () => {
					replay?.removeEventListener("click", play);
					if (fallback) clearTimeout(fallback);
					transition?.progress(1).kill();
					opening?.revert();
					scrollScene?.scrollTrigger?.kill();
					scrollScene?.kill();
					gsap.set(
						[aperture, ...lines, ...details, ...portraits, ...shutters, word],
						{ clearProps: "transform,clipPath" },
					);
					delete stage.dataset.opening;
					setControlsHidden(false);
				};
			},
		);
		stage.addEventListener(
			"focusin",
			(event) => {
				if (stage.dataset.opening && event.target !== replay) finishOpening();
			},
			{ signal: events.signal },
		);
		stage.addEventListener(
			"click",
			(event) => {
				if ((event.target as Element).closest(".atlas-stage__actions"))
					finishOpening();
			},
			{ signal: events.signal },
		);
		window.addEventListener(
			"wheel",
			() => {
				if (stage.dataset.opening) finishOpening();
			},
			{ signal: events.signal, passive: true },
		);
		window.addEventListener(
			"touchmove",
			() => {
				if (stage.dataset.opening) finishOpening();
			},
			{ signal: events.signal, passive: true },
		);
	}, stage);
	return () => {
		disposed = true;
		events.abort();
		if (fallback) clearTimeout(fallback);
		transition?.kill();
		opening?.kill();
		media.revert();
		context.revert();
		delete stage.dataset.opening;
		setControlsHidden(false);
	};
}
