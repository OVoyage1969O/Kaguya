<script lang="ts">
	// 永远百科 · 素白晶体微尘粒子
	// 细小切面菱形微粒（红宝石、香槟金、冰青与石墨）在瓷白光学场中缓缓漂浮。
	import { onDestroy, onMount } from "svelte";

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
		angle: number;
		vAngle: number;
		alpha: number;
		tone: "ruby" | "gold" | "ice" | "ink";
	}

	let parts: Particle[] = [];
	const DENSITY = 0.000045;
	const MAX_PARTICLES = 70;

	function colorOf(tone: Particle["tone"], alpha: number, isDark: boolean): string {
		switch (tone) {
			case "ruby":
				return isDark
					? `rgba(235, 59, 95, ${alpha * 0.78})`
					: `rgba(178, 24, 56, ${alpha * 0.72})`;
			case "gold":
				return isDark
					? `rgba(218, 182, 110, ${alpha * 0.78})`
					: `rgba(196, 160, 89, ${alpha * 0.75})`;
			case "ice":
				return `rgba(143, 211, 244, ${alpha * (isDark ? 0.76 : 0.7)})`;
			default:
				return isDark
					? `rgba(236, 234, 245, ${alpha * 0.45})`
					: `rgba(28, 27, 32, ${alpha * 0.42})`;
		}
	}

	function sizeCanvas() {
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		w = window.innerWidth;
		h = window.innerHeight;
		if (canvas) {
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
		}
	}

	function spawn(initial: boolean): Particle {
		const roll = Math.random();
		const tone: Particle["tone"] =
			roll < 0.28 ? "ruby" : roll < 0.54 ? "gold" : roll < 0.78 ? "ice" : "ink";
		return {
			x: Math.random() * w,
			y: initial ? Math.random() * h : h + 16,
			r: 1.8 + Math.random() * 2.8,
			vy: 6 + Math.random() * 14,
			drift: (Math.random() - 0.5) * 10,
			angle: Math.random() * Math.PI,
			vAngle: (Math.random() - 0.5) * 0.8,
			alpha: 0.35 + Math.random() * 0.4,
			tone,
		};
	}

	function ensureParticles() {
		const target = Math.min(MAX_PARTICLES, Math.floor(w * h * DENSITY));
		while (parts.length < target) parts.push(spawn(true));
		if (parts.length > target) parts.length = target;
	}

	function step(dt: number) {
		if (!ctx) return;
		const isDark = document.documentElement.classList.contains("dark");
		ctx.clearRect(0, 0, w * dpr, h * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		for (let i = parts.length - 1; i >= 0; i--) {
			const p = parts[i];
			p.y -= p.vy * dt;
			p.x += p.drift * dt;
			p.angle += p.vAngle * dt;
			if (p.x < -8) p.x = w + 8;
			else if (p.x > w + 8) p.x = -8;

			const normY = 1 - p.y / h;
			let a = p.alpha;
			if (normY > 0.82) a *= Math.max(0, 1 - (normY - 0.82) / 0.18);
			if (a <= 0.005 || p.y < -12) {
				parts[i] = spawn(false);
				continue;
			}

			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate(p.angle);
			ctx.beginPath();
			ctx.moveTo(0, -p.r);
			ctx.lineTo(p.r * 0.72, 0);
			ctx.lineTo(0, p.r);
			ctx.lineTo(-p.r * 0.72, 0);
			ctx.closePath();
			ctx.fillStyle = colorOf(p.tone, a, isDark);
			ctx.fill();
			ctx.restore();
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

	onMount(() => {
		ctx = canvas.getContext("2d");
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		sizeCanvas();
		ensureParticles();
		if (reduce) {
			ctx?.clearRect(0, 0, canvas.width, canvas.height);
			return;
		}
		raf = requestAnimationFrame(loop);
		window.addEventListener("resize", () => {
			sizeCanvas();
			ensureParticles();
		});
	});

	onDestroy(() => {
		running = false;
		if (raf) cancelAnimationFrame(raf);
	});
</script>

<canvas
	bind:this={canvas}
	class="bookshelf-dust"
	aria-hidden="true"
></canvas>
