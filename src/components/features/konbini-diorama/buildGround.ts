// 正方形底座：微缩模型的"展示基座" + 街角路面布局
// 坐标系：y 向上，底座上表面 y=0。街道呈 L 形在角点交汇。
import * as THREE from "three";
import { PALETTE, C, toon, flat, glow } from "./materials";

export const BASE = {
	// 底座外廓半宽
	half: 14,
	// 底座厚度（从模型悬空底到 y=0 上表面）
	plinth: 0.6,
} as const;

/**
 * 生成整块正方形底座与地面（路基、人行道、街角转折）。
 * 返回包含底座、路面、路沿、人行道等结构的 Group。
 */
export function buildGround(): THREE.Group {
	const g = new THREE.Group();
	g.name = "ground";

	// ---- 展示底座（厚重基座，突出"微缩模型"感）----
	const baseTop = 0;
	const plinthGeo = new THREE.BoxGeometry(BASE.half * 2, BASE.plinth, BASE.half * 2);
	const plinthMat = flat(0x151a26, { roughness: 0.6 });
	const plinth = new THREE.Mesh(plinthGeo, plinthMat);
	plinth.position.y = -BASE.plinth / 2;
	g.add(plinth);

	// 底座顶面大略分区：
	// 将整个顶面视为人行道基础，再在上面叠路面。

	// ---- 车道（L 形主路，两条路在近中心街角交汇）----
	// 横路沿 X（z≈-5.2），纵路沿 Z（x≈-5.2），在下/左向构成 L 街角，
	// 便利店位于 +x/+z 的角点内侧。
	const roadW = 6.4;
	const roadCenter = -5.2;
	// 路面上表面高度（坐落在 y=0 底座顶上）
	const roadTop = 0.07;
	// 路面盒中心（厚 0.12）
	const roadMid = 0.06;

	const roadX = new THREE.Mesh(
		new THREE.BoxGeometry(BASE.half * 2, 0.12, roadW),
		flat(PALETTE.asphalt, { roughness: 0.95 }),
	);
	roadX.position.set(0, roadMid, roadCenter);
	g.add(roadX);

	const roadZ = new THREE.Mesh(
		new THREE.BoxGeometry(roadW, 0.12, BASE.half * 2),
		flat(PALETTE.asphalt, { roughness: 0.95 }),
	);
	roadZ.position.set(roadCenter, roadMid, 0);
	g.add(roadZ);

	// 马路中间线（横路）
	const lineMat = glow(PALETTE.roadLine, { toneMapped: true });
	const lineX = new THREE.Mesh(new THREE.BoxGeometry(BASE.half * 2 - 0.5, 0.02, 0.12), lineMat);
	lineX.position.set(0, roadTop, roadX.position.z);
	g.add(lineX);
	const lineZ = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, BASE.half * 2 - 0.5), lineMat);
	lineZ.position.set(roadZ.position.x, roadTop, 0);
	g.add(lineZ);

	// ---- 斑马线（横路上，近街角）----
	const zebraMat = glow(PALETTE.zebra, { toneMapped: true });
	for (let i = 0; i < 5; i++) {
		const z = roadX.position.z + 1.0 + i * 0.6;
		const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.02, 0.34), zebraMat);
		stripe.position.set(-3.5 + (i % 2) * 0.0, roadTop + 0.01, z);
		g.add(stripe);
	}

	// ---- 排水沟（路缘内侧细线，沿路方向）----
	const gutterMat = flat(PALETTE.gutter, { roughness: 0.5 });
	const gutterGeo = new THREE.BoxGeometry(BASE.half * 2, 0.03, 0.3);
	const gutter1 = new THREE.Mesh(gutterGeo, gutterMat);
	gutter1.position.set(0, 0.02, roadX.position.z + roadW / 2 + 0.9);
	g.add(gutter1);
	const gutterGeo2 = new THREE.BoxGeometry(0.3, 0.03, BASE.half * 2);
	const gutter2 = new THREE.Mesh(gutterGeo2, gutterMat);
	gutter2.position.set(roadZ.position.x + roadW / 2 + 0.9, 0.02, 0);
	g.add(gutter2);

	return g;
}
