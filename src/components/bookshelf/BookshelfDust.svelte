<script lang="ts">
	// 永远百科 · 背景尘埃上飘特效
	// 细小微粒从底部缓缓上浮、轻微漂移、接近顶部后淡出消失，营造"尘埃在空气中上飘"的静谧氛围。
	// 仅作背景装饰：全屏 fixed、pointer-events:none、位于内容之下；遵循 prefers-reduced-motion。
	import { onMount, onDestroy } from "svelte";

	let canvas: HTMLCanvasElement;

	let dpr = 1;
	let w = 0;
	let h = 0;
	let ctx: CanvasRenderingContext2D | null = null;
	let raf = 0;
	let running = true;

	interface Particle {
		x: number;
		y: number;
		r: number;
		vy: number;
		drift: number;
		wobble: number;
		life: number;
		alpha: number;
	}

	let parts: Particle[] = [];
	const DENSITY = 0.00012;
	const MAX_PARTICLES = 220;

	function colorOf(): string {
		const dark = document.documentElement.classList.contains("dark");
		// 书籍页黑白高对比：浅色页用深灰粒子，深色页用浅白粒子
		return dark ? "255,255,255" : "40,44,52";
	}

	function buildColor(alpha: number): string {
		return "rgba(" + colorOf() + "," + alpha + ")";
	}

	function sizeCanvas() {
		const host = canvas?.parentElement;
		if (!host) return;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		w = host.clientWidth || window.innerWidth;
		h = host.clientHeight || window.innerHeight;
		if (canvas) {
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
		}
	}

	function spawn(initial: boolean): Particle {
		const r = 0.6 + Math.random() * 1.8;
		return {
			x: Math.random() * w,
			y: initial ? Math.random() * h : h + Math.random() * 20,
			r,
			vy: 6 + Math.random() * 16,
			drift: (Math.random() - 0.5) * 12,
			wobble: Math.random() * Math.PI * 2,
			life: 0,
			alpha: 0.28 + Math.random() * 0.4,
		};
	}

	function ensureParticles() {
		const target = Math.min(MAX_PARTICLES, Math.floor(w * h * DENSITY));
		while (parts.length < target) parts.push(spawn(true));
		if (parts.length > target) parts.length = target;
	}

	function step(dt: number) {
		if (!ctx) return;
		ctx.clearRect(0, 0, w * dpr, h * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const tFadeTop = 0.82;

		for (let i = parts.length - 1; i >= 0; i--) {
			const p = parts[i];
			p.life += dt;
			p.wobble += dt * (1.2 + Math.random() * 0.6);
			p.y -= p.vy * dt;
			p.x += (p.drift + Math.sin(p.wobble) * 6) * dt;
			if (p.x < -4) p.x = w + 4;
			else if (p.x > w + 4) p.x = -4;

			// 淡出：上浮到顶部附近时消失
			const normY = 1 - p.y / h;
			let a = p.alpha;
			if (normY > tFadeTop) {
				a *= Math.max(0, 1 - (normY - tFadeTop) / (1 - tFadeTop));
			}
			if (a <= 0.003) {
				parts[i] = spawn(false);
				continue;
			}

			const grow = 1 + Math.min(0.6, p.life * 0.02);
			const rad = p.r * grow;

			ctx.beginPath();
			ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
			ctx.fillStyle = buildColor(a);
			ctx.fill();
		}
	}

	let last = 0;
	function loop(ts: number) {
		if (!running) return;
		raf = requestAnimationFrame(loop);
		const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
		last = ts;
		step(dt);
	}

	function start() {
		if (raf || !canvas) return;
		running = true;
		last = 0;
		raf = requestAnimationFrame(loop);
	}

	function stop() {
		running = false;
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
	}

	function onResize() {
		sizeCanvas();
		ensureParticles();
	}

	let visibilityObserver: IntersectionObserver | null = null;

	onMount(() => {
		ctx = canvas.getContext("2d");
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		sizeCanvas();
		ensureParticles();
		if (reduce) {
			ctx?.clearRect(0, 0, canvas.width, canvas.height);
			return;
		}
		start();
		window.addEventListener("resize", onResize);
		if (canvas) {
			visibilityObserver = new IntersectionObserver(
				(entries) => {
					const vis = entries[0]?.isIntersecting ?? true;
					if (vis) start();
					else stop();
				},
				{ threshold: 0 },
			);
			visibilityObserver.observe(canvas);
		}
	});

	onDestroy(() => {
		stop();
		window.removeEventListener("resize", onResize);
		visibilityObserver?.disconnect();
	});
</script>

<canvas
	bind:this={canvas}
	class="bookshelf-dust"
	aria-hidden="true"
></canvas>
