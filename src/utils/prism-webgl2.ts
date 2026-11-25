/**
 * Native WebGL2 Ambient Optical Field & Physical Interaction Engine
 *
 * Powers all non-home pages (`[data-study-page]`) with:
 * 1. GLSL ES 3.00 chromatic dispersion caustics & spring-damped pointer optical field on porcelain white
 * 2. Click-triggered radial optical refraction ripples (ruby crimson + ice cyan dispersion edge)
 * 3. Instanced faceted micro-diamond shards (drawArraysInstanced) with real 2D spring-repulsion,
 *    angular torque, specular facet glints, and scroll-momentum buoyancy
 * 4. Interactive CSS specular sheen (`--prism-mx`, `--prism-my`) & subtle magnetic spring pull
 *
 * Zero external 3D dependencies — pure native WebGL2RenderingContext.
 * Automatically suspends on homepage (`/`) or dedicated 3D dioramas (`/kuonji/`, `/konbini/`).
 */

interface Shard {
	x: number;
	y: number;
	z: number;
	vx: number;
	vy: number;
	angle: number;
	vAngle: number;
	size: number;
	aspect: number;
	colorIdx: number;
	phase: number;
}

interface Ripple {
	x: number;
	y: number;
	startTime: number;
}

const MAX_RIPPLES = 4;
const SHARD_COUNT = 54;

// Palettes for porcelain-white (light) and obsidian-crystal (dark) optical modes
const SHARD_PALETTE_LIGHT: [number, number, number][] = [
	[0.69, 0.09, 0.22], // Ruby crimson
	[0.77, 0.62, 0.36], // Antique champagne gold
	[0.58, 0.82, 0.95], // Ice quartz cyan
	[0.91, 0.69, 0.81], // Rose quartz pink
	[0.2, 0.19, 0.23], // Graphite obsidian
];

const SHARD_PALETTE_DARK: [number, number, number][] = [
	[0.92, 0.23, 0.37], // Luminous ruby crimson
	[0.86, 0.71, 0.43], // Champagne gold
	[0.54, 0.84, 0.98], // Ice quartz cyan
	[0.95, 0.66, 0.8], // Rose quartz pink
	[0.82, 0.84, 0.93], // Platinum moonlight
];

const BG_VS = `#version 300 es
precision highp float;
const vec2 POS[3] = vec2[3](
	vec2(-1.0, -1.0),
	vec2( 3.0, -1.0),
	vec2(-1.0,  3.0)
);
out vec2 vUv;
void main() {
	vec2 p = POS[gl_VertexID];
	vUv = p * 0.5 + 0.5;
	gl_Position = vec4(p, 0.0, 1.0);
}
`;

const BG_FS = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;      // normalized [0,1], y-up
uniform vec2 uPointerVel;   // smoothed velocity
uniform float uScroll;
uniform float uDark;        // 0.0 = porcelain light, 1.0 = obsidian dark
uniform vec4 uRipples[4];   // xy = pos (0..1, y-up), z = age (sec), w = active (0/1)

float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

void main() {
	vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
	vec2 p = vUv * aspect;
	vec2 m = uPointer * aspect;

	// Dual-mode base: porcelain white (light) <-> deep velvet obsidian (dark)
	float radial = length((vUv - vec2(0.5, 0.48)) * aspect);
	vec3 lightBase = mix(vec3(0.996, 0.995, 0.998), vec3(0.958, 0.955, 0.970), smoothstep(0.18, 1.08, radial));
	vec3 darkBase  = mix(vec3(0.064, 0.062, 0.088), vec3(0.036, 0.035, 0.052), smoothstep(0.14, 1.08, radial));
	vec3 base = mix(lightBase, darkBase, uDark);

	// Subtle ambient architectural caustic waves drifting slowly
	float t = uTime * 0.24;
	float wave1 = sin(p.x * 4.2 + t + sin(p.y * 3.1 - t * 0.7) * 0.65);
	float wave2 = cos(p.y * 3.8 - t * 0.8 + uScroll * 0.0014);
	float caustic = smoothstep(0.55, 1.0, (wave1 * wave2) * 0.5 + 0.5);
	vec3 causticTint = mix(vec3(0.925, 0.962, 0.995), vec3(0.12, 0.16, 0.24), uDark);
	base = mix(base, causticTint, caustic * mix(0.12, 0.26, uDark));

	// Pointer-coupled optical prism dispersion lobe (stretches gently along velocity)
	vec2 d = p - m;
	float speed = min(length(uPointerVel) * 18.0, 0.85);
	vec2 velDir = speed > 0.001 ? normalize(uPointerVel * aspect) : vec2(1.0, 0.0);
	vec2 perp = vec2(-velDir.y, velDir.x);

	// Chromatic split offsets for ice-cyan, rose-quartz, and champagne-gold caustics
	vec2 dispVec = velDir * (0.018 + speed * 0.045) + vec2(0.012, -0.008);
	float cyanLobe = exp(-dot(d - dispVec, d - dispVec) * 10.5);
	float roseLobe = exp(-dot(d + dispVec * 0.9, d + dispVec * 0.9) * 11.5);
	float goldLobe = exp(-dot(d + perp * 0.022, d + perp * 0.022) * 16.0);

	// Faceted prism ray crossing through cursor
	float rayA = exp(-abs(dot(d, normalize(vec2(0.86, 0.51)))) * 58.0) * exp(-length(d) * 3.6);
	float rayB = exp(-abs(dot(d, normalize(vec2(-0.52, 0.85)))) * 64.0) * exp(-length(d) * 4.0);
	float specRay = (rayA + rayB) * (0.28 + speed * 0.35);

	vec3 col = base;
	vec3 cyanCol = mix(vec3(0.75, 0.91, 0.99), vec3(0.28, 0.62, 0.84), uDark);
	vec3 roseCol = mix(vec3(0.97, 0.79, 0.89), vec3(0.72, 0.24, 0.44), uDark);
	vec3 goldCol = mix(vec3(0.95, 0.87, 0.71), vec3(0.68, 0.52, 0.28), uDark);
	vec3 rayCol  = mix(vec3(0.78, 0.14, 0.28), vec3(0.94, 0.28, 0.44), uDark);

	col = mix(col, cyanCol, cyanLobe * (0.17 + speed * 0.12) * mix(1.0, 0.68, uDark));
	col = mix(col, roseCol, roseLobe * (0.14 + speed * 0.10) * mix(1.0, 0.68, uDark));
	col = mix(col, goldCol, goldLobe * mix(0.11, 0.08, uDark));
	col = mix(col, rayCol, specRay * mix(0.12, 0.22, uDark));

	// Click-triggered optical refraction shockwave rings
	for (int i = 0; i < 4; i++) {
		vec4 rp = uRipples[i];
		if (rp.w > 0.5) {
			float age = rp.z;
			float env = exp(-age * 2.15) * smoothstep(0.0, 0.04, age);
			float radius = age * 0.68;
			float dist = length(p - rp.xy * aspect);

			// Chromatic aberration split ring (crimson core + ice-cyan outer halo)
			float ringR = exp(-pow((dist - radius) * 48.0, 2.0));
			float ringC = exp(-pow((dist - (radius + 0.012)) * 42.0, 2.0));
			float ringG = exp(-pow((dist - (radius - 0.009)) * 55.0, 2.0));

			col = mix(col, mix(vec3(0.76, 0.11, 0.25), vec3(0.96, 0.24, 0.42), uDark), ringR * env * 0.34);
			col = mix(col, mix(vec3(0.56, 0.84, 0.98), vec3(0.42, 0.82, 0.99), uDark), ringC * env * 0.34);
			col = mix(col, mix(vec3(0.84, 0.71, 0.44), vec3(0.92, 0.76, 0.44), uDark), ringG * env * 0.26);
		}
	}

	// Ultra-fine optical micro-grain to eliminate color banding
	float grain = (hash21(gl_FragCoord.xy + fract(uTime) * 17.0) - 0.5) * 0.008;
	col += grain;

	fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

// Instanced faceted diamond shard shaders (6 vertices = 2 triangles forming a diamond)
const SHARD_VS = `#version 300 es
precision highp float;

// Unit diamond geometry: 4 corners forming 2 triangles
const vec2 VERTS[6] = vec2[6](
	vec2( 0.0,  1.0),
	vec2(-1.0,  0.0),
	vec2( 1.0,  0.0),
	vec2(-1.0,  0.0),
	vec2( 0.0, -1.0),
	vec2( 1.0,  0.0)
);

layout(location = 0) in vec4 aTransform; // xy = px pos, z = angle, w = size px
layout(location = 1) in vec4 aStyle;     // rgb = color, a = alpha
layout(location = 2) in vec2 aMeta;      // x = aspect, y = glint

uniform vec2 uResolution;

out vec2 vLocal;
out vec4 vColor;
out float vGlint;

void main() {
	vec2 local = VERTS[gl_VertexID];
	vec2 scaled = vec2(local.x * aMeta.x, local.y) * aTransform.w;
	float c = cos(aTransform.z);
	float s = sin(aTransform.z);
	vec2 rot = vec2(scaled.x * c - scaled.y * s, scaled.x * s + scaled.y * c);
	vec2 px = aTransform.xy + rot;
	vec2 ndc = (px / uResolution) * 2.0 - 1.0;
	ndc.y = -ndc.y;
	gl_Position = vec4(ndc, 0.0, 1.0);
	vLocal = local;
	vColor = aStyle;
	vGlint = aMeta.y;
}
`;

const SHARD_FS = `#version 300 es
precision highp float;

in vec2 vLocal;
in vec4 vColor;
in float vGlint;

out vec4 fragColor;

void main() {
	// Crisp diamond facet split: upper-left facet catches bright prismatic highlight
	float facet = step(0.0, vLocal.y * 0.7 - vLocal.x * 0.45);
	float ridge = exp(-abs(vLocal.x) * 8.0) * 0.22;
	vec3 col = mix(vColor.rgb * 0.86, mix(vColor.rgb, vec3(1.0), 0.34), facet);
	col = mix(col, vec3(0.88, 0.96, 1.0), vGlint * 0.55 + ridge);

	// Anti-aliased diamond edge
	float dist = abs(vLocal.x) + abs(vLocal.y);
	float alpha = smoothstep(1.0, 0.82, dist) * vColor.a;
	if (alpha < 0.01) discard;
	fragColor = vec4(col, alpha);
}
`;

function compileShader(
	gl: WebGL2RenderingContext,
	type: number,
	source: string,
): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function createProgram(
	gl: WebGL2RenderingContext,
	vsSrc: string,
	fsSrc: string,
): WebGLProgram | null {
	const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
	const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
	if (!vs || !fs) return null;
	const prog = gl.createProgram();
	if (!prog) return null;
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		gl.deleteProgram(prog);
		return null;
	}
	return prog;
}

function isOpticalPageActive(): boolean {
	const hasStudy = Boolean(document.querySelector("main[data-study-page]"));
	if (!hasStudy) return false;
	// Keep dedicated full-screen 3D dioramas untouched
	const path = location.pathname;
	if (path.includes("/kuonji") || path.includes("/konbini")) return false;
	return true;
}

function syncRootOpticalClass(): boolean {
	const active = isOpticalPageActive();
	document.documentElement.classList.toggle("prism-study", active);
	return active;
}

/**
 * Mounts the persistent native WebGL2 optical canvas and global physical micro-interactions.
 */
export function initPrismOpticalSystem() {
	if (window.__prismOpticalInitialized) {
		syncRootOpticalClass();
		return;
	}
	window.__prismOpticalInitialized = true;

	const canvas =
		document.querySelector<HTMLCanvasElement>("[data-prism-webgl]");
	const reduced = matchMedia("(prefers-reduced-motion: reduce)");
	const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

	let isActive = syncRootOpticalClass();
	let raf = 0;
	let gl: WebGL2RenderingContext | null = null;
	let bgProg: WebGLProgram | null = null;
	let shardProg: WebGLProgram | null = null;
	let bgVao: WebGLVertexArrayObject | null = null;
	let shardVao: WebGLVertexArrayObject | null = null;
	let instanceBuf: WebGLBuffer | null = null;
	const instanceData = new Float32Array(SHARD_COUNT * 10);

	// Uniform locations
	let uRes: WebGLUniformLocation | null = null;
	let uTime: WebGLUniformLocation | null = null;
	let uPtr: WebGLUniformLocation | null = null;
	let uPtrVel: WebGLUniformLocation | null = null;
	let uScroll: WebGLUniformLocation | null = null;
	let uDark: WebGLUniformLocation | null = null;
	let uRipples: WebGLUniformLocation | null = null;
	let uShardRes: WebGLUniformLocation | null = null;
	let darkMix = document.documentElement.classList.contains("dark") ? 1 : 0;

	// Spring-damper physical cursor state
	let width = window.innerWidth;
	let height = window.innerHeight;
	let dpr = Math.min(window.devicePixelRatio || 1, 2);
	let targetX = width * 0.52;
	let targetY = height * 0.42;
	let curX = targetX;
	let curY = targetY;
	let velX = 0;
	let velY = 0;
	let lastScrollY = window.scrollY;
	let scrollVel = 0;
	let lastTs = 0;
	let elapsed = 0;

	const ripples: Ripple[] = [];
	const rippleUniformBuf = new Float32Array(MAX_RIPPLES * 4);
	const shards: Shard[] = [];

	function seedShards() {
		shards.length = 0;
		for (let i = 0; i < SHARD_COUNT; i++) {
			const z = 0.35 + Math.random() * 0.85;
			const isTiny = Math.random() < 0.72;
			shards.push({
				x: Math.random() * width,
				y: Math.random() * height,
				z,
				vx: (Math.random() - 0.5) * 8,
				vy: -(4 + Math.random() * 10) * z,
				angle: Math.random() * Math.PI * 2,
				vAngle: (Math.random() - 0.5) * 0.7,
				size:
					(isTiny ? 3.2 + Math.random() * 3.6 : 6.2 + Math.random() * 4.8) * z,
				aspect: 0.58 + Math.random() * 0.48,
				colorIdx: Math.floor(Math.random() * SHARD_PALETTE_LIGHT.length),
				phase: Math.random() * Math.PI * 2,
			});
		}
	}

	function resizeCanvas() {
		if (!canvas) return;
		width = window.innerWidth;
		height = window.innerHeight;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.max(1, Math.floor(width * dpr));
		canvas.height = Math.max(1, Math.floor(height * dpr));
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		if (gl) {
			gl.viewport(0, 0, canvas.width, canvas.height);
		}
	}

	function initWebGL2(): boolean {
		if (!canvas) return false;
		gl = canvas.getContext("webgl2", {
			alpha: false,
			antialias: true,
			depth: false,
			stencil: false,
			powerPreference: "high-performance",
		});
		if (!gl) return false;

		bgProg = createProgram(gl, BG_VS, BG_FS);
		shardProg = createProgram(gl, SHARD_VS, SHARD_FS);
		if (!bgProg || !shardProg) return false;

		bgVao = gl.createVertexArray();
		uRes = gl.getUniformLocation(bgProg, "uResolution");
		uTime = gl.getUniformLocation(bgProg, "uTime");
		uPtr = gl.getUniformLocation(bgProg, "uPointer");
		uPtrVel = gl.getUniformLocation(bgProg, "uPointerVel");
		uScroll = gl.getUniformLocation(bgProg, "uScroll");
		uDark = gl.getUniformLocation(bgProg, "uDark");
		uRipples = gl.getUniformLocation(bgProg, "uRipples[0]");

		shardVao = gl.createVertexArray();
		instanceBuf = gl.createBuffer();
		uShardRes = gl.getUniformLocation(shardProg, "uResolution");

		gl.bindVertexArray(shardVao);
		gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuf);
		gl.bufferData(gl.ARRAY_BUFFER, instanceData.byteLength, gl.DYNAMIC_DRAW);

		const stride = 10 * 4;
		// location 0: aTransform (vec4)
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 4, gl.FLOAT, false, stride, 0);
		gl.vertexAttribDivisor(0, 1);
		// location 1: aStyle (vec4)
		gl.enableVertexAttribArray(1);
		gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 4 * 4);
		gl.vertexAttribDivisor(1, 1);
		// location 2: aMeta (vec2)
		gl.enableVertexAttribArray(2);
		gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 8 * 4);
		gl.vertexAttribDivisor(2, 1);

		gl.bindVertexArray(null);
		resizeCanvas();
		seedShards();
		return true;
	}

	function renderFrame(ts: number) {
		if (!isActive || !canvas || !gl || !bgProg || !shardProg) {
			raf = 0;
			return;
		}
		raf = requestAnimationFrame(renderFrame);

		const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
		lastTs = ts;
		elapsed += dt;

		// Hooke's law spring-damper cursor physics
		const stiffness = 68.0;
		const damping = 12.5;
		const ax = (targetX - curX) * stiffness - velX * damping;
		const ay = (targetY - curY) * stiffness - velY * damping;
		velX += ax * dt;
		velY += ay * dt;
		curX += velX * dt;
		curY += velY * dt;

		// Scroll momentum decay
		const curScroll = window.scrollY;
		const ds = curScroll - lastScrollY;
		lastScrollY = curScroll;
		scrollVel = scrollVel * 0.86 + ds * 0.42;

		// 1. Background Optical Caustics & Ripples Pass
		gl.disable(gl.BLEND);
		gl.useProgram(bgProg);
		gl.bindVertexArray(bgVao);
		gl.uniform2f(uRes, canvas.width, canvas.height);
		gl.uniform1f(uTime, elapsed);
		gl.uniform2f(
			uPtr,
			curX / Math.max(width, 1),
			1.0 - curY / Math.max(height, 1),
		);
		gl.uniform2f(
			uPtrVel,
			velX / Math.max(width, 1),
			-velY / Math.max(height, 1),
		);
		const targetDark = document.documentElement.classList.contains("dark")
			? 1
			: 0;
		darkMix += (targetDark - darkMix) * Math.min(1, dt * 8.0);

		gl.uniform1f(uScroll, curScroll);
		gl.uniform1f(uDark, darkMix);

		for (let i = 0; i < MAX_RIPPLES; i++) {
			const rp = ripples[i];
			const offset = i * 4;
			if (rp) {
				const age = elapsed - rp.startTime;
				if (age < 2.2) {
					rippleUniformBuf[offset] = rp.x;
					rippleUniformBuf[offset + 1] = rp.y;
					rippleUniformBuf[offset + 2] = age;
					rippleUniformBuf[offset + 3] = 1.0;
					continue;
				}
			}
			rippleUniformBuf[offset + 3] = 0.0;
		}
		gl.uniform4fv(uRipples, rippleUniformBuf);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		// 2. Instanced Faceted Diamond Shards Pass with 2D Physics
		for (let i = 0; i < SHARD_COUNT; i++) {
			const s = shards[i];
			const dx = s.x - curX;
			const dy = s.y - curY;
			const distSq = dx * dx + dy * dy;
			const radius = 155;
			let glint = Math.max(0, Math.sin(elapsed * 1.4 + s.phase) * 0.45);

			if (distSq < radius * radius && distSq > 1) {
				const dist = Math.sqrt(distSq);
				const force = (1 - dist / radius) * 260 * s.z;
				s.vx += (dx / dist) * force * dt;
				s.vy += (dy / dist) * force * dt;
				s.vAngle += ((dx * velY - dy * velX) * 0.00008 + 0.05) * dt * 12;
				glint = Math.min(1, glint + (1 - dist / radius) * 0.85);
			}

			// Gentle ambient buoyancy + damping
			s.vx *= 0.965;
			s.vy = s.vy * 0.965 - 7.5 * s.z * dt;
			s.vAngle *= 0.975;

			s.x += (s.vx + Math.sin(elapsed * 0.7 + s.phase) * 6) * dt;
			s.y += s.vy * dt - scrollVel * 0.24 * s.z;
			s.angle += s.vAngle * dt;

			const pad = 28;
			if (s.y < -pad) {
				s.y = height + pad;
				s.x = Math.random() * width;
			} else if (s.y > height + pad) {
				s.y = -pad;
				s.x = Math.random() * width;
			}
			if (s.x < -pad) s.x = width + pad;
			else if (s.x > width + pad) s.x = -pad;

			const [lr, lg, lb] = SHARD_PALETTE_LIGHT[s.colorIdx];
			const [dr, dg, db] = SHARD_PALETTE_DARK[s.colorIdx];
			const r = lr + (dr - lr) * darkMix;
			const g = lg + (dg - lg) * darkMix;
			const b = lb + (db - lb) * darkMix;
			const base = i * 10;
			instanceData[base] = s.x * dpr;
			instanceData[base + 1] = s.y * dpr;
			instanceData[base + 2] = s.angle;
			instanceData[base + 3] = s.size * dpr;
			instanceData[base + 4] = r;
			instanceData[base + 5] = g;
			instanceData[base + 6] = b;
			instanceData[base + 7] = 0.28 + s.z * 0.42;
			instanceData[base + 8] = s.aspect;
			instanceData[base + 9] = glint;
		}

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.useProgram(shardProg);
		gl.bindVertexArray(shardVao);
		gl.uniform2f(uShardRes, canvas.width, canvas.height);
		gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuf);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, instanceData);
		gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, SHARD_COUNT);
		gl.bindVertexArray(null);
	}

	function startLoop() {
		if (!isActive || reduced.matches || document.hidden) return;
		if (!gl && !initWebGL2()) return;
		if (!raf) {
			lastTs = 0;
			raf = requestAnimationFrame(renderFrame);
		}
	}

	function stopLoop() {
		if (raf) {
			cancelAnimationFrame(raf);
			raf = 0;
		}
	}

	function handleRouteSync() {
		isActive = syncRootOpticalClass();
		if (canvas) canvas.hidden = !isActive;
		if (isActive) {
			resizeCanvas();
			startLoop();
		} else {
			stopLoop();
		}
	}

	// Global pointer & optical ripple listeners
	window.addEventListener(
		"pointermove",
		(e) => {
			if (!isActive) return;
			targetX = e.clientX;
			targetY = e.clientY;
			// Feed local specular glare coordinates into hovered optical surfaces
			if (finePointer.matches) {
				const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
					".tools-card, .vol-card, .encyc-slip, .encyc-oracle__card, .prism-lozenge, .article-list-card--pinned",
				);
				if (target) {
					const rect = target.getBoundingClientRect();
					target.style.setProperty(
						"--prism-mx",
						`${(((e.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`,
					);
					target.style.setProperty(
						"--prism-my",
						`${(((e.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`,
					);
				}
			}
		},
		{ passive: true },
	);

	window.addEventListener(
		"pointerdown",
		(e) => {
			if (!isActive || reduced.matches) return;
			const nx = e.clientX / Math.max(width, 1);
			const ny = 1.0 - e.clientY / Math.max(height, 1);
			ripples.unshift({ x: nx, y: ny, startTime: elapsed });
			if (ripples.length > MAX_RIPPLES) ripples.length = MAX_RIPPLES;

			// Physical radial impulse to nearby shards
			for (let i = 0; i < shards.length; i++) {
				const s = shards[i];
				const dx = s.x - e.clientX;
				const dy = s.y - e.clientY;
				const d = Math.hypot(dx, dy);
				if (d < 240 && d > 1) {
					const push = (1 - d / 240) * 180;
					s.vx += (dx / d) * push;
					s.vy += (dy / d) * push;
					s.vAngle += (Math.random() - 0.5) * 4.5;
				}
			}
		},
		{ passive: true },
	);

	window.addEventListener("resize", () => {
		if (isActive) resizeCanvas();
	});
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) stopLoop();
		else startLoop();
	});

	// Hook Swup & Astro lifecycle so navigating between `/` and inner pages toggles cleanly
	const bindSwup = () => {
		if (!window.swup?.hooks || window.__prismSwupBound) return;
		window.__prismSwupBound = true;
		window.swup.hooks.on("page:view", handleRouteSync);
	};
	bindSwup();
	document.addEventListener("swup:enable", bindSwup);
	document.addEventListener("astro:page-load", handleRouteSync);

	handleRouteSync();
}

declare global {
	interface Window {
		__prismOpticalInitialized?: boolean;
		__prismSwupBound?: boolean;
	}
}
