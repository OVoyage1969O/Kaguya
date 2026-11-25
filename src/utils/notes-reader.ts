import { setTheme } from "./setting-utils";

let initialized = false;

function mountNotesReader() {
	const root = document.querySelector<HTMLElement>("[data-notes-root]");
	if (!root) return () => {};
	const events = new AbortController();
	const mobile = matchMedia("(max-width: 880px)");
	const sidebar = root.querySelector<HTMLElement>(".notes-sidebar");
	const menu = root.querySelector<HTMLButtonElement>("[data-notes-menu]");
	const input = root.querySelector<HTMLInputElement>("[data-notes-search]");
	const status = root.querySelector<HTMLElement>("[data-notes-search-status]");
	const items = [
		...root.querySelectorAll<HTMLElement>("[data-notes-nav-item]"),
	];
	const subjects = [
		...root.querySelectorAll<HTMLDetailsElement>("[data-notes-subject]"),
	];
	const originalOpen = new Map(
		subjects.map((subject) => [subject, subject.open]),
	);
	let drawerOpen = false;
	let previousOverflow = document.body.style.overflow;
	const backgroundState = new Map<HTMLElement, boolean>();
	root.dataset.notesEnhanced = "true";

	const setDrawer = (open: boolean, returnFocus = true) => {
		const wasOpen = drawerOpen;
		drawerOpen = mobile.matches && open;
		root.toggleAttribute("data-notes-open", drawerOpen);
		menu?.setAttribute("aria-expanded", String(drawerOpen));
		if (sidebar) sidebar.inert = mobile.matches && !drawerOpen;
		if (drawerOpen) {
			sidebar?.setAttribute("role", "dialog");
			sidebar?.setAttribute("aria-modal", "true");
			if (!wasOpen)
				document
					.querySelectorAll<HTMLElement>(
						"#top-row,.notes-main,.notes-outline,.notes-toolbar",
					)
					.forEach((node) => {
						backgroundState.set(node, node.inert);
						node.inert = true;
					});
		} else {
			sidebar?.removeAttribute("role");
			sidebar?.removeAttribute("aria-modal");
			backgroundState.forEach((inert, node) => {
				node.inert = inert;
			});
			backgroundState.clear();
		}
		root
			.querySelectorAll<HTMLButtonElement>("[data-notes-dismiss]")
			.forEach((button) => {
				button.hidden = !drawerOpen;
			});
		if (drawerOpen) {
			previousOverflow = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			input?.focus();
		} else {
			document.body.style.overflow = previousOverflow;
			if (returnFocus && mobile.matches) menu?.focus();
		}
	};
	const resize = () => {
		if (menu) menu.hidden = !mobile.matches;
		setDrawer(false, false);
	};
	resize();
	mobile.addEventListener("change", resize);
	menu?.addEventListener("click", () => setDrawer(!drawerOpen), {
		signal: events.signal,
	});
	root.querySelectorAll("[data-notes-dismiss]").forEach((button) => {
		button.addEventListener("click", () => setDrawer(false), {
			signal: events.signal,
		});
	});

	const filter = () => {
		const query = (input?.value || "").trim().toLocaleLowerCase();
		let count = 0;
		items.forEach((item) => {
			item.hidden = !query
				.split(/\s+/)
				.every((word) =>
					(item.dataset.search || "").toLocaleLowerCase().includes(word),
				);
			if (!item.hidden) count++;
		});
		subjects.forEach((subject) => {
			const hasMatches = !!subject.querySelector(
				"[data-notes-nav-item]:not([hidden])",
			);
			subject.hidden = !hasMatches;
			subject.open = query ? hasMatches : originalOpen.get(subject) || false;
		});
		if (status) {
			status.hidden = !query;
			status.textContent = count
				? `找到 ${count} 个章节`
				: "没有匹配章节，试试更短的关键词。";
		}
	};
	input?.addEventListener(
		"input",
		(event) => {
			if (!(event as InputEvent).isComposing) filter();
		},
		{ signal: events.signal },
	);
	input?.addEventListener("compositionend", filter, { signal: events.signal });
	input?.addEventListener(
		"keydown",
		(event) => {
			if (event.key === "Escape" && input.value) {
				event.preventDefault();
				event.stopPropagation();
				input.value = "";
				filter();
			}
		},
		{ signal: events.signal },
	);
	root.addEventListener(
		"keydown",
		(event) => {
			if (event.key === "Escape" && drawerOpen) {
				event.preventDefault();
				setDrawer(false);
			}
			if (event.key === "Tab" && drawerOpen && sidebar) {
				const controls = [
					...sidebar.querySelectorAll<HTMLElement>(
						"a[href],button:not([hidden]),input,summary",
					),
				].filter((node) => node.getClientRects().length > 0);
				const first = controls[0];
				const last = controls[controls.length - 1];
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last?.focus();
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first?.focus();
				}
			}
		},
		{ signal: events.signal },
	);
	const theme = root.querySelector<HTMLButtonElement>("[data-notes-theme]");
	if (theme) theme.hidden = false;
	theme?.addEventListener(
		"click",
		() =>
			setTheme(
				document.documentElement.classList.contains("dark") ? "light" : "dark",
			),
		{ signal: events.signal },
	);

	const tocLinks = [
		...root.querySelectorAll<HTMLAnchorElement>("[data-notes-toc-link]"),
	];
	const tocTargets = new Map(
		tocLinks.map((link) => {
			let id = link.hash.slice(1);
			try {
				id = decodeURIComponent(id);
			} catch {
				/* Literal percent in an authored heading. */
			}
			return [link, id] as const;
		}),
	);
	const headingIds = [...new Set(tocTargets.values())];
	const headings = headingIds
		.map((id) => document.getElementById(id))
		.filter((node): node is HTMLElement => !!node);
	const visibleHeadings = new Set<Element>();
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) visibleHeadings.add(entry.target);
				else visibleHeadings.delete(entry.target);
			});
			const current = headings.find((heading) =>
				visibleHeadings.has(heading),
			)?.id;
			if (!current) return;
			tocLinks.forEach((link) => {
				if (tocTargets.get(link) === current)
					link.setAttribute("aria-current", "location");
				else link.removeAttribute("aria-current");
			});
		},
		{ rootMargin: "-100px 0px -60% 0px", threshold: 0 },
	);
	headings.forEach((heading) => {
		observer.observe(heading);
	});
	return () => {
		events.abort();
		observer.disconnect();
		mobile.removeEventListener("change", resize);
		setDrawer(false, false);
		visibleHeadings.clear();
		if (sidebar) sidebar.inert = false;
		delete root.dataset.notesEnhanced;
		delete root.dataset.notesOpen;
	};
}

export function initNotesReader() {
	if (initialized) return;
	initialized = true;
	let dispose: (() => void) | undefined;
	const cleanup = () => {
		dispose?.();
		dispose = undefined;
	};
	const boot = () => {
		cleanup();
		dispose = mountNotesReader();
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
