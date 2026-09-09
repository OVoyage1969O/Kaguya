// 雨夜便利店街角 · 三渲二材质与调色工具
// 统一的二次元夜景调色板 + 卡通(toon)材质工厂 + Canvas 贴图工具。
import * as THREE from "three";

// 夜景统一调色板（暖内冷外）
export const PALETTE = {
	// 夜空与远景
	nightSky: 0x0a1230,
	fog: 0x0a1230,
	// 路面 / 人行道
	asphalt: 0x232a3a,
	sidewalk: 0x3a4356,
	roadLine: 0xcbd4e6,
	zebra: 0xd7deeb,
	gutter: 0x1b212e,
	puddle: 0x1a2c52,
	// 建筑外立面
	wallCream: 0xfff3df,
	wallWarm: 0xf7e3c4,
	roof: 0x2a2f3d,
	trim: 0xcfd6e4,
	// 便利店招牌 / 店内
	storeGreen: 0x1f7a4d,
	storeGreenDark: 0x165636,
	storeSignGlow: 0x6fffb0,
	interiorWarm: 0xfff2c8,
	interiorLight: 0xffe9b0,
	// 玻璃
	glassCool: 0xbfe3ff,
	glassWarm: 0xffe7c0,
	// 霓虹点缀
	neonRed: 0xff4f6d,
	neonBlue: 0x5ac8ff,
	neonOrange: 0xffa24d,
	// 杂项
	white: 0xffffff,
	black: 0x0a0a0a,
	metalDark: 0x2c3038,
	metalLight: 0x6a7280,
	bikeFrame: 0xff8a4d,
	bikeWheel: 0x20242c,
} as const;

/** 便捷取色 */
export function C(hex: number): THREE.Color {
	return new THREE.Color(hex);
}

/** 卡通分阶渐变贴图：MeshToonMaterial.gradientMap 用，制造柔和 3 阶卡通明暗 */
function createGradientMap(): THREE.Texture {
	const size = 8;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d")!;
	const grad = ctx.createLinearGradient(0, 0, size, size);
	grad.addColorStop(0.0, "#ffffff");
	grad.addColorStop(0.45, "#d9e0ec");
	grad.addColorStop(0.75, "#a9b4c6");
	grad.addColorStop(1.0, "#737f95");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, size, size);
	const tex = new THREE.CanvasTexture(canvas);
	tex.minFilter = THREE.NearestFilter;
	tex.magFilter = THREE.NearestFilter;
	tex.needsUpdate = true;
	return tex;
}

let cachedGradient: THREE.Texture | null = null;
function gradientMap(): THREE.Texture {
	if (!cachedGradient) cachedGradient = createGradientMap();
	return cachedGradient;
}

/**
 * 卡通 toon 材质（受光面用 gradientMap 分阶，适合三渲二日系卡通）
 */
export function toon(color: number, opts: { emissive?: number; emissiveIntensity?: number } = {}): THREE.MeshToonMaterial {
	return new THREE.MeshToonMaterial({
		color: new THREE.Color(color),
		gradientMap: gradientMap(),
		emissive: new THREE.Color(opts.emissive ?? 0x000000),
		emissiveIntensity: opts.emissiveIntensity ?? 1,
	});
}

/**
 * 自发光材质（招牌、霓虹、灯箱等，不受光）
 */
export function glow(color: number, opts: { transparent?: boolean; opacity?: number; toneMapped?: boolean } = {}): THREE.MeshBasicMaterial {
	return new THREE.MeshBasicMaterial({
		color: new THREE.Color(color),
		transparent: opts.transparent ?? false,
		opacity: opts.opacity ?? 1,
		toneMapped: opts.toneMapped ?? false,
	});
}

/** 简单纯色（用于玻璃半透明等） */
export function flat(color: number, opts: { transparent?: boolean; opacity?: number; side?: THREE.Side; metalness?: number; roughness?: number } = {}): THREE.MeshStandardMaterial {
	return new THREE.MeshStandardMaterial({
		color: new THREE.Color(color),
		transparent: opts.transparent ?? false,
		opacity: opts.opacity ?? 1,
		side: opts.side ?? THREE.FrontSide,
		metalness: opts.metalness ?? 0,
		roughness: opts.roughness ?? 0.85,
	});
}

/** 画文字/图案到 Canvas 并返回纹理，用于招牌、海报等 */
export function makeTextTexture(
	text: string,
	opts: {
		width?: number;
		height?: number;
		bg?: string;
		color?: string;
		fontSize?: number;
		sub?: string;
	} = {},
): THREE.CanvasTexture {
	const w = opts.width ?? 256;
	const h = opts.height ?? 96;
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d")!;
	ctx.clearRect(0, 0, w, h);
	if (opts.bg) {
		ctx.fillStyle = opts.bg;
		ctx.fillRect(0, 0, w, h);
	}
	ctx.fillStyle = opts.color ?? "#ffffff";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	if (opts.sub) {
		const mainSize = opts.fontSize ?? Math.floor(h * 0.42);
		ctx.font = `900 ${mainSize}px sans-serif`;
		ctx.fillText(text, w / 2, h * 0.36);
		ctx.font = `700 ${Math.floor(h * 0.2)}px sans-serif`;
		ctx.globalAlpha = 0.9;
		ctx.fillText(opts.sub, w / 2, h * 0.78);
	} else {
		const size = opts.fontSize ?? Math.floor(h * 0.55);
		ctx.font = `900 ${size}px sans-serif`;
		ctx.fillText(text, w / 2, h / 2);
	}
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.needsUpdate = true;
	return tex;
}

/** 生成平滑轮廓（卡通描边）用的背面放大壳材质 */
export function outlineMaterial(color = 0x14161d, opacity = 1): THREE.MeshBasicMaterial {
	return new THREE.MeshBasicMaterial({
		color: new THREE.Color(color),
		side: THREE.BackSide,
		transparent: opacity < 1,
		opacity,
	});
}
