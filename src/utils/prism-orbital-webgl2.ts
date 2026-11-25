/**
 * Native WebGL2 3D Faceted Crystal Orbital Engine (Refined Ink-Edged Edition)
 *
 * Renders directly in open porcelain-white space:
 * - Compound multi-spire faceted crystals (central crimson ruby relic + 5 orbiting quartz clusters)
 * - Dual render pass per crystal: flat-shaded crystalline facets (`gl.TRIANGLES` with dFdx/dFdy normals)
 *   + razor-sharp architectural ink-graphite ridge wireframes (`gl.LINES`) so every crystal reads
 *   crisply against pure white (matching Image 1 & Image 2)
 * - Sculpted champagne-gold filigree hoops encircling the central ruby
 * - Hooke's law spring-damper rotational physics (click any shard or drag horizontally to spin)
 * - Radially outward projected coordinates (`labelX`, `labelY`) guaranteeing ZERO label-crystal overlap
 */

export interface OrbitalCrystalProjection {
	index: number;
	x: number;
	y: number;
	labelX: number;
	labelY: number;
	scale: number;
	active: boolean;
}

export interface OrbitalEngineOptions {
	canvas: HTMLCanvasElement;
	count: number;
	initialIndex?: number;
	onSelect: (index: number) => void;
	onProject?: (
		projections: OrbitalCrystalProjection[],
		center: { x: number; y: number; tagY: number },
		tetherPoints: string,
		dims: { width: number; height: number },
	) => void;
}

const CRYSTAL_VS = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPos;

uniform mat4 uMvp;
uniform mat4 uModel;

out vec3 vWorldPos;
out vec3 vLocalPos;

void main() {
	vec4 world = uModel * vec4(aPos, 1.0);
	vWorldPos = world.xyz;
	vLocalPos = aPos;
	gl_Position = uMvp * vec4(aPos, 1.0);
}
`;

const CRYSTAL_FS = `#version 300 es
precision highp float;

in vec3 vWorldPos;
in vec3 vLocalPos;

out vec4 fragColor;

uniform vec3 uCamPos;
uniform float uTime;
uniform int uMode;    // 0 = central ruby, 1 = active prismatic quartz, 2 = dormant silver-graphite quartz
uniform float uHover;
uniform float uDark;  // 0.0 = porcelain light, 1.0 = obsidian dark

void main() {
	vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
	vec3 v = normalize(uCamPos - vWorldPos);
	vec3 l1 = normalize(vec3(2.4, 3.6, 4.0));
	vec3 l2 = normalize(vec3(-3.2, -1.0, 2.4));

	float ndl1 = max(dot(n, l1), 0.0);
	float ndl2 = max(dot(n, l2), 0.0);
	float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.1);
	vec3 h1 = normalize(l1 + v);
	float spec = pow(max(dot(n, h1), 0.0), 28.0);

	vec3 col;

	if (uMode == 0) {
		// Deep cut Ruby Crimson with rich wine shadows & bright carmine facets
		vec3 deepRuby   = mix(vec3(0.30, 0.02, 0.08), vec3(0.38, 0.03, 0.11), uDark);
		vec3 midRuby    = mix(vec3(0.74, 0.06, 0.21), vec3(0.86, 0.11, 0.27), uDark);
		vec3 brightRuby = vec3(0.99, 0.32, 0.48);
		col = mix(deepRuby, midRuby, ndl1 * 0.78 + 0.22);
		col += brightRuby * (ndl2 * 0.38 + fresnel * mix(0.52, 0.72, uDark));
		col += vec3(1.0, 0.94, 0.84) * spec * 1.15;
	} else if (uMode == 1) {
		// Active Iridescent Quartz: luminous ice-blue + rose-pink chromatic dispersion
		vec3 ice   = vec3(0.64, 0.88, 0.99);
		vec3 rose  = vec3(0.96, 0.72, 0.86);
		vec3 slate = mix(vec3(0.56, 0.60, 0.70), vec3(0.24, 0.28, 0.40), uDark);
		float disp = sin(vLocalPos.y * 4.2 + uTime * 1.4 + n.x * 2.8) * 0.5 + 0.5;
		vec3 prismTint = mix(ice, rose, disp);
		col = mix(slate, vec3(0.98, 0.99, 1.0), ndl1 * 0.72 + 0.28);
		col = mix(col, prismTint, 0.58 + fresnel * 0.38);
		col += vec3(1.0) * spec * 1.15;
	} else {
		// Dormant Architectural Silver-Quartz (light) <-> Smoked Obsidian-Silver Quartz (dark)
		vec3 shadow = mix(vec3(0.62, 0.63, 0.69), vec3(0.14, 0.15, 0.21), uDark);
		vec3 mid    = mix(vec3(0.84, 0.85, 0.89), vec3(0.32, 0.34, 0.44), uDark);
		vec3 lit    = mix(vec3(0.97, 0.98, 1.0),  vec3(0.76, 0.80, 0.90), uDark);
		col = mix(shadow, mid, smoothstep(0.0, 0.55, ndl1));
		col = mix(col, lit, smoothstep(0.55, 1.0, ndl1));
		col += vec3(0.74, 0.89, 0.99) * (ndl2 * mix(0.18, 0.34, uDark) + uHover * 0.44);
		col += vec3(0.96, 0.74, 0.86) * (uHover * fresnel * 0.48 + uDark * fresnel * 0.24);
		col += vec3(1.0) * spec * (0.55 + uHover * 0.6);
	}

	fragColor = vec4(clamp(col, 0.0, 1.0), 0.97);
}
`;

const LINE_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
uniform mat4 uMvp;
void main() {
	gl_Position = uMvp * vec4(aPos, 1.0);
}
`;

const LINE_FS = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 fragColor;
void main() {
	fragColor = uColor;
}
`;

interface SpireSpec {
	ox: number;
	oy: number;
	oz: number;
	rotX: number;
	rotZ: number;
	topLen: number;
	botLen: number;
	radius: number;
	sides: number;
}

/** Builds BOTH triangle facets and crisp ridge edge line segments for a compound crystal cluster */
function buildCrystalCluster(spires: SpireSpec[]): {
	triVerts: Float32Array;
	edgeVerts: Float32Array;
} {
	const tris: number[] = [];
	const edges: number[] = [];

	const transformPt = (p: number[], sp: SpireSpec): number[] => {
		const cx = Math.cos(sp.rotX);
		const sx = Math.sin(sp.rotX);
		const cz = Math.cos(sp.rotZ);
		const sz = Math.sin(sp.rotZ);
		// Rotate around X then Z, then translate
		const y1 = p[1] * cx - p[2] * sx;
		const z1 = p[1] * sx + p[2] * cx;
		const x2 = p[0] * cz - y1 * sz;
		const y2 = p[0] * sz + y1 * cz;
		return [x2 + sp.ox, y2 + sp.oy, z1 + sp.oz];
	};

	const pushTri = (a: number[], b: number[], c: number[]) => {
		tris.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
	};
	const pushEdge = (a: number[], b: number[]) => {
		edges.push(a[0], a[1], a[2], b[0], b[1], b[2]);
	};

	for (const sp of spires) {
		const topTip = transformPt([0, sp.topLen, 0], sp);
		const botTip = transformPt([0, -sp.botLen, 0], sp);
		const upper: number[][] = [];
		const lower: number[][] = [];

		for (let i = 0; i < sp.sides; i++) {
			const a = (i / sp.sides) * Math.PI * 2;
			const r = sp.radius * (i % 2 === 0 ? 1.0 : 0.82);
			upper.push(
				transformPt([Math.cos(a) * r, sp.topLen * 0.34, Math.sin(a) * r], sp),
			);
			lower.push(
				transformPt(
					[
						Math.cos(a + 0.14) * r * 0.84,
						-sp.botLen * 0.28,
						Math.sin(a + 0.14) * r * 0.84,
					],
					sp,
				),
			);
		}

		for (let i = 0; i < sp.sides; i++) {
			const next = (i + 1) % sp.sides;
			pushTri(topTip, upper[next], upper[i]);
			pushTri(upper[i], upper[next], lower[next]);
			pushTri(upper[i], lower[next], lower[i]);
			pushTri(botTip, lower[i], lower[next]);

			// Crisp architectural ridge edges
			pushEdge(topTip, upper[i]);
			pushEdge(upper[i], upper[next]);
			pushEdge(upper[i], lower[i]);
			pushEdge(lower[i], lower[next]);
			pushEdge(lower[i], botTip);
		}
	}

	return {
		triVerts: new Float32Array(tris),
		edgeVerts: new Float32Array(edges),
	};
}

function buildRingGeometry(
	rx: number,
	rz: number,
	segments = 104,
): Float32Array {
	const pts: number[] = [];
	for (let i = 0; i <= segments; i++) {
		const a = (i / segments) * Math.PI * 2;
		pts.push(Math.cos(a) * rx, 0, Math.sin(a) * rz);
	}
	return new Float32Array(pts);
}

type Mat4 = Float32Array;

function mat4Perspective(
	fovRad: number,
	aspect: number,
	near: number,
	far: number,
): Mat4 {
	const f = 1.0 / Math.tan(fovRad / 2);
	const nf = 1 / (near - far);
	return new Float32Array([
		f / aspect,
		0,
		0,
		0,
		0,
		f,
		0,
		0,
		0,
		0,
		(far + near) * nf,
		-1,
		0,
		0,
		2 * far * near * nf,
		0,
	]);
}

function mat4LookAt(eye: number[], target: number[], up: number[]): Mat4 {
	const zx = eye[0] - target[0];
	const zy = eye[1] - target[1];
	const zz = eye[2] - target[2];
	const zLen = Math.hypot(zx, zy, zz) || 1;
	const z0 = zx / zLen;
	const z1 = zy / zLen;
	const z2 = zz / zLen;

	const xx = up[1] * z2 - up[2] * z1;
	const xy = up[2] * z0 - up[0] * z2;
	const xz = up[0] * z1 - up[1] * z0;
	const xLen = Math.hypot(xx, xy, xz) || 1;
	const x0 = xx / xLen;
	const x1 = xy / xLen;
	const x2 = xz / xLen;

	const y0 = z1 * x2 - z2 * x1;
	const y1 = z2 * x0 - z0 * x2;
	const y2 = z0 * x1 - z1 * x0;

	return new Float32Array([
		x0,
		y0,
		z0,
		0,
		x1,
		y1,
		z1,
		0,
		x2,
		y2,
		z2,
		0,
		-(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]),
		-(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]),
		-(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]),
		1,
	]);
}

function mat4Mul(a: Mat4, b: Mat4): Mat4 {
	const out = new Float32Array(16);
	for (let c = 0; c < 4; c++) {
		for (let r = 0; r < 4; r++) {
			out[c * 4 + r] =
				a[0 * 4 + r] * b[c * 4 + 0] +
				a[1 * 4 + r] * b[c * 4 + 1] +
				a[2 * 4 + r] * b[c * 4 + 2] +
				a[3 * 4 + r] * b[c * 4 + 3];
		}
	}
	return out;
}

function mat4Transform(
	tx: number,
	ty: number,
	tz: number,
	rx: number,
	ry: number,
	rz: number,
	sx: number,
	sy: number,
	sz: number,
): Mat4 {
	const cx = Math.cos(rx);
	const sxr = Math.sin(rx);
	const cy = Math.cos(ry);
	const syr = Math.sin(ry);
	const cz = Math.cos(rz);
	const szr = Math.sin(rz);

	const m00 = cy * cz * sx;
	const m01 = cy * szr * sx;
	const m02 = -syr * sx;

	const m10 = (sxr * syr * cz - cx * szr) * sy;
	const m11 = (sxr * syr * szr + cx * cz) * sy;
	const m12 = sxr * cy * sy;

	const m20 = (cx * syr * cz + sxr * szr) * sz;
	const m21 = (cx * syr * szr - sxr * cz) * sz;
	const m22 = cx * cy * sz;

	return new Float32Array([
		m00,
		m01,
		m02,
		0,
		m10,
		m11,
		m12,
		0,
		m20,
		m21,
		m22,
		0,
		tx,
		ty,
		tz,
		1,
	]);
}

function projectPoint(
	vp: Mat4,
	x: number,
	y: number,
	z: number,
	w: number,
	h: number,
): { x: number; y: number; scale: number } {
	const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
	const cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13];
	const cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
	const invW = cw !== 0 ? 1 / cw : 1;
	return {
		x: (cx * invW * 0.5 + 0.5) * w,
		y: (1 - (cy * invW * 0.5 + 0.5)) * h,
		scale: Math.max(0.74, Math.min(1.18, 7.6 / Math.max(cw, 2.5))),
	};
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
	const s = gl.createShader(type);
	if (!s) return null;
	gl.shaderSource(s, src);
	gl.compileShader(s);
	if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
		gl.deleteShader(s);
		return null;
	}
	return s;
}

function link(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string) {
	const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
	const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
	if (!vs || !fs) return null;
	const p = gl.createProgram();
	if (!p) return null;
	gl.attachShader(p, vs);
	gl.attachShader(p, fs);
	gl.linkProgram(p);
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
		gl.deleteProgram(p);
		return null;
	}
	return p;
}

export function mountPrismOrbital(options: OrbitalEngineOptions) {
	const { canvas, count, initialIndex = 0, onSelect, onProject } = options;
	const rawGl = canvas.getContext("webgl2", {
		alpha: true,
		antialias: true,
		depth: true,
		powerPreference: "high-performance",
	});
	if (!rawGl) {
		return { select: (_idx: number) => {}, destroy: () => {} };
	}
	const gl: WebGL2RenderingContext = rawGl;

	const crystalProg = link(gl, CRYSTAL_VS, CRYSTAL_FS);
	const lineProg = link(gl, LINE_VS, LINE_FS);
	if (!crystalProg || !lineProg) {
		return { select: (_idx: number) => {}, destroy: () => {} };
	}

	// Compound multi-spire ruby core + 3-spire quartz crystal cluster
	const rubyCluster = buildCrystalCluster([
		{
			ox: 0,
			oy: 0,
			oz: 0,
			rotX: 0,
			rotZ: 0,
			topLen: 1.05,
			botLen: 0.96,
			radius: 0.4,
			sides: 6,
		},
		{
			ox: -0.22,
			oy: -0.1,
			oz: 0.08,
			rotX: 0.14,
			rotZ: 0.28,
			topLen: 0.56,
			botLen: 0.42,
			radius: 0.16,
			sides: 5,
		},
		{
			ox: 0.22,
			oy: 0.08,
			oz: -0.06,
			rotX: -0.12,
			rotZ: -0.26,
			topLen: 0.52,
			botLen: 0.36,
			radius: 0.15,
			sides: 5,
		},
	]);
	const quartzCluster = buildCrystalCluster([
		{
			ox: 0,
			oy: 0,
			oz: 0,
			rotX: 0,
			rotZ: 0,
			topLen: 0.92,
			botLen: 0.72,
			radius: 0.26,
			sides: 5,
		},
		{
			ox: -0.2,
			oy: -0.06,
			oz: 0.08,
			rotX: 0.12,
			rotZ: 0.34,
			topLen: 0.58,
			botLen: 0.36,
			radius: 0.14,
			sides: 5,
		},
		{
			ox: 0.19,
			oy: -0.14,
			oz: -0.06,
			rotX: -0.16,
			rotZ: -0.32,
			topLen: 0.46,
			botLen: 0.3,
			radius: 0.12,
			sides: 4,
		},
	]);

	const outerRingVerts = buildRingGeometry(2.68, 1.82, 112);
	const innerRingVerts = buildRingGeometry(1.78, 1.2, 84);
	const goldHaloVerts = buildRingGeometry(0.74, 0.74, 72);

	const makeVao = (data: Float32Array) => {
		const vao = gl.createVertexArray();
		const buf = gl.createBuffer();
		gl.bindVertexArray(vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
		gl.bindVertexArray(null);
		return { vao, buf, count: data.length / 3 };
	};

	const rubyTris = makeVao(rubyCluster.triVerts);
	const rubyEdges = makeVao(rubyCluster.edgeVerts);
	const quartzTris = makeVao(quartzCluster.triVerts);
	const quartzEdges = makeVao(quartzCluster.edgeVerts);
	const outerRing = makeVao(outerRingVerts);
	const innerRing = makeVao(innerRingVerts);
	const goldHalo = makeVao(goldHaloVerts);

	const uCrysMvp = gl.getUniformLocation(crystalProg, "uMvp");
	const uCrysModel = gl.getUniformLocation(crystalProg, "uModel");
	const uCrysCam = gl.getUniformLocation(crystalProg, "uCamPos");
	const uCrysTime = gl.getUniformLocation(crystalProg, "uTime");
	const uCrysMode = gl.getUniformLocation(crystalProg, "uMode");
	const uCrysHover = gl.getUniformLocation(crystalProg, "uHover");
	const uCrysDark = gl.getUniformLocation(crystalProg, "uDark");
	let darkMix = document.documentElement.classList.contains("dark") ? 1 : 0;

	const uLineMvp = gl.getUniformLocation(lineProg, "uMvp");
	const uLineColor = gl.getUniformLocation(lineProg, "uColor");

	const reduced = matchMedia("(prefers-reduced-motion: reduce)");
	const events = new AbortController();
	const { signal } = events;

	let width = canvas.clientWidth || 560;
	let height = canvas.clientHeight || 480;
	let dpr = Math.min(window.devicePixelRatio || 1, 2);

	function resize() {
		width = canvas.clientWidth || 560;
		height = canvas.clientHeight || 480;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.max(1, Math.floor(width * dpr));
		canvas.height = Math.max(1, Math.floor(height * dpr));
		gl.viewport(0, 0, canvas.width, canvas.height);
	}
	resize();

	const FOCUS_ANGLE = 2.38;
	const stepAngle = (Math.PI * 2) / Math.max(count, 1);

	let activeIndex = ((initialIndex % count) + count) % count;
	let orbitAngle = FOCUS_ANGLE - activeIndex * stepAngle;
	let targetOrbitAngle = orbitAngle;
	let orbitVel = 0;

	let pointerNx = 0;
	let pointerNy = 0;
	let tiltX = 0;
	let tiltY = 0;
	let hoveredIdx = -1;
	let isDragging = false;
	let dragStartX = 0;
	let dragMoved = false;

	const lastProjected: OrbitalCrystalProjection[] = [];

	function select(idx: number, notify = false) {
		const next = ((idx % count) + count) % count;
		activeIndex = next;
		const desired = FOCUS_ANGLE - next * stepAngle;
		const delta =
			((((desired - orbitAngle) % (Math.PI * 2)) + Math.PI * 3) %
				(Math.PI * 2)) -
			Math.PI;
		targetOrbitAngle = orbitAngle + delta;
		if (notify) onSelect(next);
	}

	canvas.addEventListener(
		"pointerdown",
		(e) => {
			isDragging = true;
			dragStartX = e.clientX;
			dragMoved = false;
			canvas.setPointerCapture(e.pointerId);
		},
		{ signal },
	);

	canvas.addEventListener(
		"pointermove",
		(e) => {
			const rect = canvas.getBoundingClientRect();
			const lx = e.clientX - rect.left;
			const ly = e.clientY - rect.top;
			pointerNx = (lx / rect.width) * 2 - 1;
			pointerNy = (ly / rect.height) * 2 - 1;

			if (isDragging) {
				const dx = e.clientX - dragStartX;
				if (Math.abs(dx) > 6) dragMoved = true;
				dragStartX = e.clientX;
				targetOrbitAngle += dx * 0.0085;
				orbitAngle += dx * 0.004;
				return;
			}

			let best = -1;
			let bestDist = 52;
			for (const p of lastProjected) {
				const d = Math.hypot(lx - p.x, ly - p.y);
				if (d < bestDist) {
					bestDist = d;
					best = p.index;
				}
			}
			hoveredIdx = best;
			canvas.style.cursor = best >= 0 ? "pointer" : "grab";
		},
		{ signal },
	);

	canvas.addEventListener(
		"pointerup",
		(e) => {
			if (!isDragging) return;
			isDragging = false;
			canvas.releasePointerCapture(e.pointerId);
			if (dragMoved) {
				const rawIndex = Math.round(
					(FOCUS_ANGLE - targetOrbitAngle) / stepAngle,
				);
				select(rawIndex, true);
			} else if (hoveredIdx >= 0) {
				select(hoveredIdx, true);
			}
		},
		{ signal },
	);

	canvas.addEventListener(
		"pointerleave",
		() => {
			pointerNx = 0;
			pointerNy = 0;
			hoveredIdx = -1;
		},
		{ signal },
	);

	window.addEventListener("resize", resize, { signal });

	let raf = 0;
	let lastTs = 0;
	let elapsed = 0;

	function buildTetherSvgPath(
		cx: number,
		cy: number,
		tx: number,
		ty: number,
		time: number,
	): string {
		const dx = tx - cx;
		const dy = ty - cy;
		const len = Math.hypot(dx, dy) || 1;
		const nx = -dy / len;
		const ny = dx / len;
		const segments = 24;
		let d = `M ${cx.toFixed(1)} ${cy.toFixed(1)}`;
		for (let i = 1; i < segments; i++) {
			const t = i / segments;
			const env = Math.sin(t * Math.PI);
			const amp =
				(Math.sin(t * 28 - time * 9.0) * 6.5 +
					Math.sin(t * 53 + time * 13.5) * 3.0) *
				env;
			const px = cx + dx * t + nx * amp;
			const py = cy + dy * t + ny * amp;
			d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
		}
		d += ` L ${tx.toFixed(1)} ${ty.toFixed(1)}`;
		return d;
	}

	function frame(ts: number) {
		raf = requestAnimationFrame(frame);
		const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
		lastTs = ts;
		elapsed += reduced.matches ? 0 : dt;

		const k = 38.0;
		const c = 8.8;
		const acc = (targetOrbitAngle - orbitAngle) * k - orbitVel * c;
		orbitVel += acc * dt;
		orbitAngle += orbitVel * dt;

		tiltX += (pointerNy * 0.13 - tiltX) * Math.min(1, dt * 6);
		tiltY += (pointerNx * 0.17 - tiltY) * Math.min(1, dt * 6);

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		const aspect = width / Math.max(height, 1);
		const proj = mat4Perspective((37 * Math.PI) / 180, aspect, 0.1, 40);
		const camPos = [tiltY * 1.25, 2.85 - tiltX * 0.95, 8.2];
		const view = mat4LookAt(camPos, [0, -0.05, 0], [0, 1, 0]);
		const vp = mat4Mul(proj, view);

		const orbitTilt = mat4Transform(0, 0, 0, 0.22, 0, -0.14, 1, 1, 1);

		const drawLine = (
			mesh: { vao: WebGLVertexArrayObject | null; count: number },
			mode: number,
			model: Mat4,
			color: [number, number, number, number],
		) => {
			gl.useProgram(lineProg);
			gl.uniformMatrix4fv(uLineMvp, false, mat4Mul(vp, model));
			gl.uniform4f(uLineColor, color[0], color[1], color[2], color[3]);
			gl.bindVertexArray(mesh.vao);
			gl.drawArrays(mode, 0, mesh.count);
		};

		const targetDark = document.documentElement.classList.contains("dark")
			? 1
			: 0;
		darkMix += (targetDark - darkMix) * Math.min(1, dt * 8.0);
		const mix4 = (
			a: [number, number, number, number],
			b: [number, number, number, number],
		): [number, number, number, number] => [
			a[0] + (b[0] - a[0]) * darkMix,
			a[1] + (b[1] - a[1]) * darkMix,
			a[2] + (b[2] - a[2]) * darkMix,
			a[3] + (b[3] - a[3]) * darkMix,
		];

		// 1. Delicate architectural orbital ellipses (graphite in light, silver-ice in dark)
		drawLine(
			outerRing,
			gl.LINE_STRIP,
			orbitTilt,
			mix4([0.16, 0.15, 0.2, 0.34], [0.76, 0.8, 0.92, 0.32]),
		);
		drawLine(
			innerRing,
			gl.LINE_STRIP,
			orbitTilt,
			mix4([0.16, 0.15, 0.2, 0.17], [0.76, 0.8, 0.92, 0.16]),
		);

		// 2. Central Ruby Core + Gold Filigree Hoops
		const bobY = Math.sin(elapsed * 1.3) * 0.07;
		const haloA = mat4Transform(
			0,
			bobY,
			0,
			0.92 + Math.sin(elapsed * 0.7) * 0.1,
			elapsed * 0.42,
			0.38,
			0.88,
			1.24,
			0.88,
		);
		const haloB = mat4Transform(
			0,
			bobY,
			0,
			-0.78,
			-elapsed * 0.32,
			0.88,
			0.78,
			1.06,
			0.78,
		);
		drawLine(goldHalo, gl.LINE_STRIP, haloA, [0.76, 0.61, 0.33, 0.92]);
		drawLine(goldHalo, gl.LINE_STRIP, haloB, [0.76, 0.61, 0.33, 0.65]);

		const rubyModel = mat4Transform(
			0,
			bobY,
			0,
			0.06 + tiltX * 0.25,
			elapsed * 0.38 + tiltY * 0.55,
			0.04,
			0.86,
			0.94,
			0.86,
		);

		gl.enable(gl.POLYGON_OFFSET_FILL);
		gl.polygonOffset(1.0, 1.0);
		gl.useProgram(crystalProg);
		gl.uniform3f(uCrysCam, camPos[0], camPos[1], camPos[2]);
		gl.uniform1f(uCrysTime, elapsed);
		gl.uniformMatrix4fv(uCrysModel, false, rubyModel);
		gl.uniformMatrix4fv(uCrysMvp, false, mat4Mul(vp, rubyModel));
		gl.uniform1i(uCrysMode, 0);
		gl.uniform1f(uCrysHover, 0);
		gl.uniform1f(uCrysDark, darkMix);
		gl.bindVertexArray(rubyTris.vao);
		gl.drawArrays(gl.TRIANGLES, 0, rubyTris.count);
		gl.disable(gl.POLYGON_OFFSET_FILL);

		// Crisp antique-gold & wine facet edges on central ruby
		drawLine(
			rubyEdges,
			gl.LINES,
			rubyModel,
			mix4([0.78, 0.62, 0.34, 0.68], [0.92, 0.76, 0.44, 0.82]),
		);

		// 3. Orbiting Multi-Spire Quartz Crystal Clusters + Sharp Ink Wireframe Outlines
		lastProjected.length = 0;
		const centerProj = projectPoint(vp, 0, bobY, 0, width, height);
		const centerBotProj = projectPoint(vp, 0, bobY - 1.18, 0, width, height);
		let activeProj = centerProj;

		for (let i = 0; i < count; i++) {
			const a = orbitAngle + i * stepAngle;
			const lx = Math.cos(a) * 2.68;
			const lz = Math.sin(a) * 1.82;
			const ly = Math.sin(elapsed * 1.45 + i * 1.3) * 0.08;

			const wx = orbitTilt[0] * lx + orbitTilt[4] * ly + orbitTilt[8] * lz;
			const wy = orbitTilt[1] * lx + orbitTilt[5] * ly + orbitTilt[9] * lz;
			const wz = orbitTilt[2] * lx + orbitTilt[6] * ly + orbitTilt[10] * lz;

			const isActive = i === activeIndex;
			const isHover = i === hoveredIdx;
			const s = isActive ? 0.96 : isHover ? 0.84 : 0.74;
			const spin =
				elapsed * (isActive ? 0.85 : isHover ? 1.35 : 0.34) + i * 1.15;

			const model = mat4Transform(
				wx,
				wy,
				wz,
				0.14 + Math.sin(i * 2.1) * 0.18,
				spin,
				Math.cos(i * 1.7) * 0.2,
				s,
				s * (isActive ? 1.1 : 1.0),
				s,
			);

			gl.enable(gl.POLYGON_OFFSET_FILL);
			gl.polygonOffset(1.0, 1.0);
			gl.useProgram(crystalProg);
			gl.uniform3f(uCrysCam, camPos[0], camPos[1], camPos[2]);
			gl.uniform1f(uCrysTime, elapsed);
			gl.uniformMatrix4fv(uCrysModel, false, model);
			gl.uniformMatrix4fv(uCrysMvp, false, mat4Mul(vp, model));
			gl.uniform1i(uCrysMode, isActive ? 1 : 2);
			gl.uniform1f(uCrysHover, isHover ? 1.0 : 0.0);
			gl.uniform1f(uCrysDark, darkMix);
			gl.bindVertexArray(quartzTris.vao);
			gl.drawArrays(gl.TRIANGLES, 0, quartzTris.count);
			gl.disable(gl.POLYGON_OFFSET_FILL);

			// Razor-sharp ink-graphite edges in light mode, glowing silver-ice edges in dark mode
			const edgeColor: [number, number, number, number] = isActive
				? mix4([0.14, 0.13, 0.18, 0.86], [0.88, 0.94, 1.0, 0.88])
				: isHover
					? mix4([0.69, 0.09, 0.22, 0.72], [0.95, 0.3, 0.46, 0.85])
					: mix4([0.22, 0.21, 0.27, 0.64], [0.74, 0.8, 0.92, 0.62]);
			drawLine(quartzEdges, gl.LINES, model, edgeColor);

			const p = projectPoint(vp, wx, wy, wz, width, height);
			// Push label strictly OUTWARD along radial vector from orbital center -> zero crystal overlap!
			const rdx = p.x - centerProj.x;
			const rdy = p.y - centerProj.y;
			const rLen = Math.hypot(rdx, rdy) || 1;
			const outX = rdx / rLen;
			const outY = rdy / rLen;
			const padX = isActive ? 50 : 42;
			const padY = isActive ? 36 : 30;
			const labelX = Math.max(36, Math.min(width - 36, p.x + outX * padX));
			const labelY = Math.max(24, Math.min(height - 28, p.y + outY * padY));

			lastProjected.push({
				index: i,
				x: p.x,
				y: p.y,
				labelX,
				labelY,
				scale: p.scale,
				active: isActive,
			});
			if (isActive) activeProj = p;
		}
		gl.bindVertexArray(null);

		if (onProject) {
			const tether = buildTetherSvgPath(
				centerProj.x,
				centerProj.y,
				activeProj.x,
				activeProj.y,
				elapsed,
			);
			onProject(
				lastProjected,
				{
					x: centerProj.x,
					y: centerProj.y,
					tagY: Math.min(height - 24, centerBotProj.y + 18),
				},
				tether,
				{ width, height },
			);
		}
	}

	raf = requestAnimationFrame(frame);

	return {
		select: (idx: number) => select(idx, false),
		destroy: () => {
			cancelAnimationFrame(raf);
			events.abort();
			[
				rubyTris,
				rubyEdges,
				quartzTris,
				quartzEdges,
				outerRing,
				innerRing,
				goldHalo,
			].forEach((m) => {
				gl.deleteVertexArray(m.vao);
				gl.deleteBuffer(m.buf);
			});
			gl.deleteProgram(crystalProg);
			gl.deleteProgram(lineProg);
		},
	};
}
