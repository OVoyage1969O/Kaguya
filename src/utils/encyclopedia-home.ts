import { gsap } from "gsap";
import { riseIntoPlace } from "./editorial-motion";
import { mountPrismOrbital } from "./prism-orbital-webgl2";

interface OrbitalEntryLink {
	folio: string;
	title: string;
	groupLabel: string;
	summary: string;
	quote: string;
	previewImage: string;
	href: string;
}

interface OrbitalVolume {
	index: number;
	code: string;
	id: string;
	name: string;
	english: string;
	volumeNumeral: string;
	volumeRoman: string;
	era: string;
	locale: string;
	synopsis: string;
	cover: string;
	href: string;
	count: number;
	entries: OrbitalEntryLink[];
}

/**
 * Encyclopedia controller (Open-Space Porcelain WebGL2 Crystal Orbital Edition):
 * 1. Native WebGL2 3D Crystal Orbital Ring with ink-edged multi-spire crystals & radially outward labels
 * 2. Live crimson resonance tether SVG sized dynamically to viewport
 * 3. Entry hover artwork preview & in-place random memory shuffle spin
 * 4. Character portrait 3D micro-tilt & archival ledger (`/` search, gliding crimson bar, hover card)
 */
export function mountEncyclopedia(): () => void {
	const root = document.querySelector<HTMLElement>("[data-encyc-root]");
	if (!root || root.dataset.encycMounted) return () => {};
	root.dataset.encycMounted = "true";

	const events = new AbortController();
	const { signal } = events;
	const reduced = matchMedia("(prefers-reduced-motion: reduce)");
	const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
	const activeAnimations: Animation[] = [];
	const gsapCtx = gsap.context(() => {}, root);

	let hoverRaf = 0;
	let orbitalController: {
		select: (idx: number) => void;
		destroy: () => void;
	} | null = null;

	const trackAnim = (anim: Animation) => {
		activeAnimations.push(anim);
		return anim;
	};

	/* ---------- 1. Native WebGL2 3D Crystal Orbital Stage ---------- */
	const orbitalRoot = root.querySelector<HTMLElement>(
		"[data-prism-orbital-root]",
	);
	const orbitalCanvas = orbitalRoot?.querySelector<HTMLCanvasElement>(
		"[data-prism-orbital-canvas]",
	);
	const orbitalVolumes: OrbitalVolume[] = (() => {
		try {
			return JSON.parse(orbitalRoot?.dataset.orbitalVolumes || "[]");
		} catch {
			return [];
		}
	})();

	if (orbitalRoot && orbitalCanvas && orbitalVolumes.length > 0) {
		const headerEl = orbitalRoot.querySelector<HTMLElement>(
			"[data-orbital-header]",
		);
		const eraEl = orbitalRoot.querySelector<HTMLElement>("[data-orbital-era]");
		const titleEl = orbitalRoot.querySelector<HTMLElement>(
			"[data-orbital-title]",
		);
		const enEl = orbitalRoot.querySelector<HTMLElement>("[data-orbital-en]");
		const synopsisEl = orbitalRoot.querySelector<HTMLElement>(
			"[data-orbital-synopsis]",
		);
		const plateLink = orbitalRoot.querySelector<HTMLAnchorElement>(
			"[data-orbital-plate-link]",
		);
		const plateImg = orbitalRoot.querySelector<HTMLImageElement>(
			"[data-orbital-plate-img]",
		);
		const localeEl = orbitalRoot.querySelector<HTMLElement>(
			"[data-orbital-locale]",
		);
		const menuEl = orbitalRoot.querySelector<HTMLElement>(
			"[data-orbital-menu]",
		);
		const enterLink = orbitalRoot.querySelector<HTMLAnchorElement>(
			"[data-orbital-enter]",
		);
		const enterLabel = orbitalRoot.querySelector<HTMLElement>(
			"[data-orbital-enter-label]",
		);
		const metaLine = orbitalRoot.querySelector<HTMLElement>(
			"[data-orbital-meta-line]",
		);
		const tetherSvg =
			orbitalRoot.querySelector<SVGSVGElement>("[data-orbital-svg]");
		const tetherPath = orbitalRoot.querySelector<SVGPathElement>(
			"[data-orbital-tether]",
		);
		const tetherGlow = orbitalRoot.querySelector<SVGPathElement>(
			"[data-orbital-tether-glow]",
		);
		const centerTag = orbitalRoot.querySelector<HTMLElement>(
			"[data-orbital-center-tag]",
		);
		const nodeBtns = [
			...orbitalRoot.querySelectorAll<HTMLButtonElement>("[data-orbital-node]"),
		];
		const tabBtns = [
			...orbitalRoot.querySelectorAll<HTMLButtonElement>("[data-orbital-tab]"),
		];

		const totalEntries = orbitalVolumes.reduce((sum, v) => sum + v.count, 0);
		let currentVolIndex = 0;

		const wireMenuHoverPreview = (vol: OrbitalVolume) => {
			if (!menuEl || !plateImg) return;
			const links =
				menuEl.querySelectorAll<HTMLAnchorElement>(".prism-menu-item");
			links.forEach((link) => {
				link.addEventListener(
					"pointerenter",
					() => {
						const pImg = link.dataset.previewImg;
						if (pImg && plateImg.getAttribute("src") !== pImg) {
							plateImg.src = pImg;
						}
						if (localeEl && link.dataset.previewNote) {
							localeEl.textContent = link.dataset.previewNote;
						}
					},
					{ signal },
				);
			});
			menuEl.onpointerleave = () => {
				if (plateImg.getAttribute("src") !== vol.cover) {
					plateImg.src = vol.cover;
				}
				if (localeEl) localeEl.textContent = vol.locale;
			};
		};

		const renderOrbitalMenu = (vol: OrbitalVolume, highlightFolio?: string) => {
			if (!menuEl) return;
			menuEl.replaceChildren();
			vol.entries.forEach((entry) => {
				const li = document.createElement("li");
				const a = document.createElement("a");
				a.className = "prism-menu-item";
				if (highlightFolio && entry.folio === highlightFolio) {
					a.classList.add("is-highlighted");
				}
				a.href = entry.href;
				a.dataset.previewImg = entry.previewImage;
				a.dataset.previewNote = entry.quote
					? `「${entry.quote}」`
					: entry.summary;

				const mark = document.createElement("span");
				mark.className = "prism-menu-item__mark";
				mark.setAttribute("aria-hidden", "true");
				const diamond = document.createElement("i");
				diamond.className = "prism-diamond prism-diamond--sm";
				const stem = document.createElement("em");
				stem.className = "prism-menu-item__stem";
				mark.append(diamond, stem);

				const title = document.createElement("span");
				title.className = "prism-menu-item__title";
				title.textContent = entry.title;

				const meta = document.createElement("span");
				meta.className = "prism-menu-item__meta";
				meta.textContent = entry.groupLabel;

				const folio = document.createElement("span");
				folio.className = "prism-menu-item__folio";
				folio.lang = "en";
				folio.textContent = `NO.${entry.folio}`;

				a.append(mark, title, meta, folio);
				li.append(a);
				menuEl.append(li);
			});
			wireMenuHoverPreview(vol);
		};

		const applyOrbitalVolume = (
			idx: number,
			animate = true,
			highlightFolio?: string,
		) => {
			const safeIdx =
				((idx % orbitalVolumes.length) + orbitalVolumes.length) %
				orbitalVolumes.length;
			currentVolIndex = safeIdx;
			const vol = orbitalVolumes[safeIdx];

			if (headerEl) headerEl.textContent = `ARCHIVE // VOLUME ${vol.code}`;
			if (eraEl) eraEl.textContent = vol.era;
			if (titleEl) titleEl.textContent = vol.name;
			if (enEl) enEl.textContent = vol.english;
			if (synopsisEl) synopsisEl.textContent = vol.synopsis;
			if (plateLink) plateLink.href = vol.href;
			if (plateImg) plateImg.src = vol.cover;
			if (localeEl) localeEl.textContent = vol.locale;
			if (enterLink) enterLink.href = vol.href;
			if (enterLabel) enterLabel.textContent = `步入「${vol.name}」专刊`;
			if (metaLine) {
				metaLine.textContent = `ARCHIVE // ${vol.volumeNumeral} · ${vol.count} 篇收录 | 馆藏共 ${orbitalVolumes.length} 卷 ${totalEntries} 词条`;
			}
			renderOrbitalMenu(vol, highlightFolio);

			nodeBtns.forEach((btn, i) => {
				const active = i === safeIdx;
				btn.classList.toggle("is-active", active);
				btn.setAttribute("aria-pressed", String(active));
				const existingBadge = btn.querySelector("[data-orbital-badge]");
				if (active && !existingBadge) {
					const b = document.createElement("span");
					b.className = "prism-orbit-node__badge";
					b.dataset.orbitalBadge = "";
					b.lang = "en";
					b.textContent = "· ACTIVE";
					btn.append(b);
				} else if (!active && existingBadge) {
					existingBadge.remove();
				}
			});

			tabBtns.forEach((btn, i) => {
				const active = i === safeIdx;
				btn.classList.toggle("is-active", active);
				btn.setAttribute("aria-pressed", String(active));
			});

			if (animate && !reduced.matches) {
				gsapCtx.add(() => {
					if (titleEl) {
						gsap.fromTo(
							titleEl,
							{ y: 12, opacity: 0 },
							{ y: 0, opacity: 1, duration: 0.45, ease: "power3.out" },
						);
					}
					if (menuEl) {
						gsap.fromTo(
							menuEl.querySelectorAll(".prism-menu-item"),
							{ x: -10, opacity: 0 },
							{
								x: 0,
								opacity: 1,
								duration: 0.38,
								stagger: 0.04,
								ease: "power2.out",
							},
						);
					}
					if (plateImg) {
						gsap.fromTo(
							plateImg,
							{ scale: 1.06, opacity: 0.5 },
							{ scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" },
						);
					}
				});
			}
		};

		const params = new URLSearchParams(location.search);
		const requested = params.get("category");
		const hashWorld = location.hash.startsWith("#world-")
			? location.hash.slice(7)
			: null;
		const initialWorld =
			hashWorld || (requested && requested !== "all" ? requested : null);
		const initialIdx = Math.max(
			0,
			orbitalVolumes.findIndex((v) => v.id === initialWorld),
		);

		orbitalController = mountPrismOrbital({
			canvas: orbitalCanvas,
			count: orbitalVolumes.length,
			initialIndex: initialIdx,
			onSelect: (idx) => applyOrbitalVolume(idx, true),
			onProject: (projections, center, tether, dims) => {
				if (tetherSvg) {
					tetherSvg.setAttribute("viewBox", `0 0 ${dims.width} ${dims.height}`);
				}
				if (tetherPath) tetherPath.setAttribute("d", tether);
				if (tetherGlow) tetherGlow.setAttribute("d", tether);
				if (centerTag) {
					centerTag.style.left = `${center.x.toFixed(1)}px`;
					centerTag.style.top = `${center.tagY.toFixed(1)}px`;
				}
				projections.forEach((proj) => {
					const btn = nodeBtns[proj.index];
					if (!btn) return;
					btn.style.transform = `translate3d(${proj.labelX.toFixed(1)}px, ${proj.labelY.toFixed(1)}px, 0) translate(-50%, -50%) scale(${proj.scale.toFixed(2)})`;
					btn.style.zIndex = proj.active
						? "6"
						: String(Math.round(proj.scale * 4));
				});
			},
		});

		const selectBoth = (idx: number) => {
			orbitalController?.select(idx);
			applyOrbitalVolume(idx, true);
		};

		nodeBtns.forEach((btn, idx) => {
			btn.addEventListener("click", () => selectBoth(idx), { signal });
		});
		tabBtns.forEach((btn, idx) => {
			btn.addEventListener("click", () => selectBoth(idx), { signal });
		});

		// In-place random memory draw: spins 3D ring to a random world & highlights a random entry
		orbitalRoot.querySelector("[data-orbital-random]")?.addEventListener(
			"click",
			() => {
				const candidates = orbitalVolumes.filter(
					(v) => v.entries.length > 0 && v.index !== currentVolIndex,
				);
				const pool = candidates.length ? candidates : orbitalVolumes;
				const pickedVol = pool[Math.floor(Math.random() * pool.length)];
				const pickedEntry =
					pickedVol.entries[
						Math.floor(Math.random() * pickedVol.entries.length)
					];
				orbitalController?.select(pickedVol.index);
				applyOrbitalVolume(pickedVol.index, true, pickedEntry?.folio);
				if (pickedEntry && plateImg && pickedEntry.previewImage) {
					plateImg.src = pickedEntry.previewImage;
				}
				if (pickedEntry && localeEl) {
					localeEl.textContent = `随机抽取 · ${pickedEntry.title}`;
				}
			},
			{ signal },
		);

		if (initialIdx > 0) {
			applyOrbitalVolume(initialIdx, false);
		} else {
			wireMenuHoverPreview(orbitalVolumes[0]);
		}
	}

	/* ---------- 2. Scroll Reveals & Portrait 3D Micro-Tilt ---------- */
	let revealObserver: IntersectionObserver | undefined;
	if (!reduced.matches) {
		revealObserver = new IntersectionObserver(
			(entries) => {
				const intersecting = entries.filter((e) => e.isIntersecting);
				intersecting.forEach((entry, idx) => {
					revealObserver?.unobserve(entry.target);
					const el = entry.target as HTMLElement;
					const customStagger = Number(
						el.style.getPropertyValue("--stagger") || idx,
					);
					trackAnim(riseIntoPlace(el, Math.min(customStagger, 5) * 60, 20));
				});
			},
			{ threshold: 0.08, rootMargin: "0px 0px -20px 0px" },
		);
		root.querySelectorAll<HTMLElement>("[data-encyc-reveal]").forEach((el) => {
			revealObserver?.observe(el);
		});
	}

	if (!reduced.matches && finePointer.matches) {
		root
			.querySelectorAll<HTMLElement>("[data-encyc-tilt]")
			.forEach((anchor) => {
				const mat = anchor.querySelector<HTMLElement>("[data-encyc-tilt-card]");
				if (!mat) return;
				anchor.addEventListener(
					"pointermove",
					(event) => {
						const rect = mat.getBoundingClientRect();
						const nx = (event.clientX - rect.left) / rect.width - 0.5;
						const ny = (event.clientY - rect.top) / rect.height - 0.5;
						const rotX = (-ny * 6).toFixed(2);
						const rotY = (nx * 6).toFixed(2);
						mat.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
					},
					{ signal },
				);
				anchor.addEventListener(
					"pointerleave",
					() => {
						mat.style.transform = "";
					},
					{ signal },
				);
			});
	}

	/* ---------- 3. Archival Ledger Search, Filter Glider & Hover Card ---------- */
	const input = root.querySelector<HTMLInputElement>("[data-encyc-search]");
	const filtersWrap = root.querySelector<HTMLElement>("[data-encyc-filters]");
	const glider = root.querySelector<HTMLElement>("[data-encyc-filter-glider]");
	const filters = [
		...root.querySelectorAll<HTMLButtonElement>("[data-encyc-filter]"),
	];
	const entries = [...root.querySelectorAll<HTMLElement>("[data-encyc-entry]")];
	const result = root.querySelector<HTMLElement>("[data-encyc-result]");
	const empty = root.querySelector<HTMLElement>("[data-encyc-empty]");
	const clear = root.querySelector<HTMLButtonElement>("[data-encyc-clear]");

	const params = new URLSearchParams(location.search);
	const requested = params.get("category");
	let selected =
		requested && filters.some((b) => b.dataset.encycFilter === requested)
			? requested
			: "all";
	if (input) input.value = params.get("q") || "";

	function syncFilterGlider() {
		if (!filtersWrap || !glider) return;
		const activeBtn = filters.find((b) => b.classList.contains("is-active"));
		if (!activeBtn) {
			glider.style.opacity = "0";
			return;
		}
		const wrapRect = filtersWrap.getBoundingClientRect();
		const btnRect = activeBtn.getBoundingClientRect();
		if (btnRect.top - wrapRect.top > 18) {
			glider.style.opacity = "0";
			return;
		}
		glider.style.opacity = "1";
		glider.style.width = `${btnRect.width}px`;
		glider.style.transform = `translateX(${btnRect.left - wrapRect.left}px)`;
	}

	function filter(writeUrl = false, animate = false) {
		const query = (input?.value || "").trim().toLocaleLowerCase();
		const words = query.split(/\s+/).filter(Boolean);
		const visible: HTMLElement[] = [];

		entries.forEach((entry) => {
			const text = (entry.dataset.search || "").toLocaleLowerCase();
			entry.hidden =
				!(selected === "all" || entry.dataset.category === selected) ||
				!words.every((word) => text.includes(word));
			if (!entry.hidden) visible.push(entry);
		});

		filters.forEach((button) => {
			const active = button.dataset.encycFilter === selected;
			button.classList.toggle("is-active", active);
			button.setAttribute("aria-pressed", String(active));
		});
		syncFilterGlider();

		if (result) {
			result.textContent = query
				? `匹配 ${visible.length} 篇词条`
				: `共 ${visible.length} 篇词条`;
		}
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

		if (animate && !reduced.matches) {
			visible.slice(0, 12).forEach((entry, index) => {
				trackAnim(riseIntoPlace(entry, index * 24, 10));
			});
		}
	}

	input?.addEventListener(
		"input",
		(event) => {
			if (!(event as InputEvent).isComposing) filter(true);
		},
		{ signal },
	);
	input?.addEventListener("compositionend", () => filter(true), { signal });
	filters.forEach((button) => {
		button.addEventListener(
			"click",
			() => {
				selected = button.dataset.encycFilter || "all";
				filter(true, true);
			},
			{ signal },
		);
	});
	clear?.addEventListener(
		"click",
		() => {
			if (input) input.value = "";
			filter(true, true);
			input?.focus({ preventScroll: true });
		},
		{ signal },
	);
	root.querySelector("[data-encyc-reset]")?.addEventListener(
		"click",
		() => {
			selected = "all";
			if (input) input.value = "";
			filter(true, true);
			input?.focus({ preventScroll: true });
		},
		{ signal },
	);
	root.querySelector("[data-encyc-search-form]")?.addEventListener(
		"submit",
		(event) => {
			event.preventDefault();
			filter(true);
		},
		{ signal },
	);

	window.addEventListener(
		"keydown",
		(event) => {
			if (
				event.key === "/" &&
				!event.metaKey &&
				!event.ctrlKey &&
				!event.altKey
			) {
				const tag = (document.activeElement as HTMLElement | null)?.tagName;
				if (
					tag === "INPUT" ||
					tag === "TEXTAREA" ||
					(document.activeElement as HTMLElement | null)?.isContentEditable
				) {
					return;
				}
				event.preventDefault();
				input?.scrollIntoView({
					behavior: reduced.matches ? "auto" : "smooth",
					block: "center",
				});
				input?.focus({ preventScroll: true });
			} else if (event.key === "Escape" && document.activeElement === input) {
				input?.blur();
			}
		},
		{ signal },
	);
	window.addEventListener("resize", syncFilterGlider, { signal });

	const ledgerStage = root.querySelector<HTMLElement>(
		"[data-encyc-ledger-stage]",
	);
	const hoverCard = root.querySelector<HTMLElement>("[data-encyc-hover-card]");
	const hoverImg = root.querySelector<HTMLImageElement>(
		"[data-encyc-hover-img]",
	);
	const hoverFolio = root.querySelector<HTMLElement>(
		"[data-encyc-hover-folio]",
	);
	const hoverLabel = root.querySelector<HTMLElement>(
		"[data-encyc-hover-label]",
	);

	if (
		ledgerStage &&
		hoverCard &&
		hoverImg &&
		!reduced.matches &&
		finePointer.matches
	) {
		let targetY = 0;
		let currentY = 0;
		let cardActive = false;

		const stepHoverCard = () => {
			if (!cardActive) {
				hoverRaf = 0;
				return;
			}
			currentY += (targetY - currentY) * 0.18;
			hoverCard.style.transform = `translate3d(0, ${currentY.toFixed(1)}px, 0) scale(1)`;
			hoverRaf = requestAnimationFrame(stepHoverCard);
		};

		entries.forEach((row) => {
			row.addEventListener(
				"pointerenter",
				() => {
					const src = row.dataset.previewSrc || "";
					if (!src) return;
					if (hoverImg.getAttribute("src") !== src) hoverImg.src = src;
					if (hoverFolio) {
						hoverFolio.textContent = row.dataset.previewFolio || "";
					}
					if (hoverLabel) {
						hoverLabel.textContent = row.dataset.previewLabel || "";
					}
					const stageRect = ledgerStage.getBoundingClientRect();
					const rowRect = row.getBoundingClientRect();
					const desired = Math.max(
						0,
						rowRect.top - stageRect.top + rowRect.height * 0.5 - 110,
					);
					if (!cardActive) {
						currentY = desired;
						hoverCard.hidden = false;
						requestAnimationFrame(() => hoverCard.classList.add("is-visible"));
					}
					targetY = desired;
					cardActive = true;
					if (!hoverRaf) hoverRaf = requestAnimationFrame(stepHoverCard);
				},
				{ signal },
			);
		});

		ledgerStage.addEventListener(
			"pointerleave",
			() => {
				cardActive = false;
				hoverCard.classList.remove("is-visible");
			},
			{ signal },
		);
	}

	filter();
	requestAnimationFrame(syncFilterGlider);

	return () => {
		events.abort();
		revealObserver?.disconnect();
		orbitalController?.destroy();
		orbitalController = null;
		gsapCtx.revert();
		if (hoverRaf) cancelAnimationFrame(hoverRaf);
		activeAnimations.forEach((a) => {
			a.cancel();
		});
		delete root.dataset.encycMounted;
	};
}

let dispose: (() => void) | undefined;
let initialized = false;

export function initEncyclopediaLifecycle() {
	if (initialized) return;
	initialized = true;
	const cleanup = () => {
		dispose?.();
		dispose = undefined;
	};
	const boot = () => {
		if (
			document.querySelector<HTMLElement>("[data-encyc-root]")?.dataset
				.encycMounted
		)
			return;
		cleanup();
		dispose = mountEncyclopedia();
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
