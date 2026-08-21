import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * 永远百科 主页动效控制器
 * 高端创意机构/作品集风格：
 *  - 首屏全屏 Opening：幕布分条自上而下揭开 + 标题遮罩/压缩后归位强进场
 *  - 每个模块滚动进入时：英文大标题先大幅进场，卡片再依次 stagger
 *  - 卡片/封面轻微 parallax 与 reveal，节奏慢、缓动丝滑
 * 遵循 prefers-reduced-motion 与 gsap.context 清理。
 */
export function mountBookshelfAnimations(): () => void {
	const root = document.querySelector<HTMLElement>("[data-bk-root]");
	if (!root || root.dataset.bkMounted === "true") return () => undefined;
	root.dataset.bkMounted = "true";

	const reducedMotionQuery = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	);

	const context = gsap.context(() => {
		if (reducedMotionQuery.matches) {
			// 关闭动效：直接隐藏幕布、暴露全部内容
			root.querySelectorAll<HTMLElement>("[data-bk-intro]").forEach((el) => {
				el.style.display = "none";
			});
			root
				.querySelectorAll<HTMLElement>("[data-bk-en],[data-bk-card],[data-bk-header],.bookshelf__description,.bookshelf__stats")
				.forEach((el) => {
					gsap.set(el, { clearProps: "all" });
				});
			return;
		}

		/* ---------- 1. 首屏 Opening：幕布从中间向两侧揭开 + 标题强进场 ---------- */
		const intro = root.querySelector<HTMLElement>("[data-bk-intro]");
		const bands = root.querySelectorAll<HTMLElement>("[data-bk-band]");
		const introTitle = root.querySelector<HTMLElement>("[data-bk-intro-title]");
		const introEn = root.querySelector<HTMLElement>("[data-bk-intro-en]");
		const header = root.querySelector<HTMLElement>("[data-bk-header]");
		const headerTitle = header?.querySelector<HTMLElement>(
			".bookshelf__title-row",
		);
		const headerDesc = header?.querySelector<HTMLElement>(
			".bookshelf__description",
		);
		const headerStats = header?.querySelector<HTMLElement>(
			".bookshelf__stats",
		);

		if (intro && bands.length >= 2) {
			// 幕布默认 display:none，进入动画时再显示（JS 关闭时优雅降级）
			gsap.set(intro, { display: "block" });
			const [leftPanel, rightPanel] = bands;
			// 标题压缩后归位（scaleY 过大→归位，带轻微回弹丝滑）
			const opening = gsap.timeline({ defaults: { ease: "power3.out" } });

			if (introTitle) {
				opening.fromTo(
					introTitle,
					{ yPercent: 130, scaleY: 1.55, autoAlpha: 0, transformOrigin: "50% 100%" },
					{ yPercent: 0, scaleY: 1, autoAlpha: 1, duration: 1.0 },
					0.35,
				);
			}
			if (introEn) {
				opening.fromTo(
					introEn,
					{ yPercent: 120, autoAlpha: 0, letterSpacing: "0.4em" },
					{ yPercent: 0, autoAlpha: 1, letterSpacing: "0.18em", duration: 0.8 },
					0.2,
				);
			}

			// 左右幕布从中间向两侧揭开
			opening.to(
				leftPanel,
				{ xPercent: -101, duration: 1.3, ease: "power4.inOut" },
				0.6,
			);
			opening.to(
				rightPanel,
				{ xPercent: 101, duration: 1.3, ease: "power4.inOut" },
				0.6,
			);

			// 标题随幕布揭开而反色：从幕布对比色（--bk-invert）渐变为页面墨色（--bk-ink）
			const inkColor =
				getComputedStyle(root).getPropertyValue("--bk-ink").trim() ||
				"#000";
			if (introTitle) {
				opening.to(
					introTitle,
					{ color: inkColor, duration: 0.75, ease: "power2.inOut" },
					0.6,
				);
			}
			if (introEn) {
				opening.to(
					introEn,
					{ color: inkColor, duration: 0.75, ease: "power2.inOut" },
					0.6,
				);
			}

			// 标题随之退场，露出页面
			opening.to(
				[introTitle, introEn],
				{ yPercent: -40, autoAlpha: 0, duration: 0.7, ease: "power2.in" },
				1.35,
			);
			opening.to(
				intro,
				{ autoAlpha: 0, duration: 0.5, ease: "power2.inOut" },
				1.7,
			);
			opening.set(intro, { display: "none" }, 2.15);
		}

		// 首屏页头内容：标题、描述、统计 依次进场
		const headerTl = gsap.timeline({ defaults: { ease: "power3.out" } });
		if (headerTitle) {
			headerTl.fromTo(
				headerTitle,
				{ y: 70, autoAlpha: 0, scaleY: 1.25, transformOrigin: "50% 0%" },
				{ y: 0, autoAlpha: 1, scaleY: 1, duration: 0.9 },
				0.05,
			);
		}
		if (headerDesc) {
			headerTl.fromTo(
				headerDesc,
				{ y: 34, autoAlpha: 0 },
				{ y: 0, autoAlpha: 1, duration: 0.7 },
				0.12,
			);
		}
		if (headerStats) {
			headerTl.fromTo(
				headerStats,
				{ y: 26, autoAlpha: 0 },
				{ y: 0, autoAlpha: 1, duration: 0.6 },
				0.18,
			);
		}

		/* ---------- 2. 每个模块：英文大标题先进场 → 卡片 stagger ---------- */
		const sections = root.querySelectorAll<HTMLElement>("[data-bk-section]");
		sections.forEach((section, sectionIndex) => {
			const en = section.querySelector<HTMLElement>("[data-bk-en]");
			const cardsWrap = section.querySelector<HTMLElement>("[data-bk-cards]");
			const cards = cardsWrap
				? Array.from(cardsWrap.querySelectorAll<HTMLElement>("[data-bk-card]"))
				: [];

			const secTl = gsap.timeline({
				scrollTrigger: {
					id: `bk-section-${sectionIndex}`,
					trigger: section,
					start: "top 78%",
					toggleActions: "play none none none",
				},
				defaults: { ease: "power3.out" },
			});

			// 英文大标题大幅进场（遮罩揭开 + 位移）
			if (en) {
				gsap.set(en, { yPercent: 110, autoAlpha: 0 });
				secTl.to(en, { yPercent: 0, autoAlpha: 1, duration: 0.9 }, 0);
			}

			// 卡片依次 stagger
			if (cards.length) {
				cards.forEach((card) => {
					gsap.set(card, { y: 70, autoAlpha: 0, scaleY: 0.96, transformOrigin: "50% 100%" });
				});
				secTl.to(
					cards,
					{ y: 0, autoAlpha: 1, scaleY: 1, duration: 0.7, stagger: 0.09 },
					0.18,
				);
			}

			// 模块内轻微 parallax（内容随滚动缓慢位移）
			if (cardsWrap) {
				gsap.to(cardsWrap, {
					yPercent: 6,
					ease: "none",
					scrollTrigger: {
						trigger: section,
						start: "top bottom",
						end: "bottom top",
						scrub: 0.6,
					},
				});
			}
		});

		ScrollTrigger.refresh();
	}, root);

	return () => {
		context.revert();
		delete root.dataset.bkMounted;
	};
}
