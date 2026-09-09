// 便利店建筑本体（外立面 + 大面积玻璃 + 明亮充实店内）
import * as THREE from "three";
import { PALETTE, C, toon, glow, flat, makeTextTexture } from "./materials";

export const STORE = {
	w: 8.2, // 沿 x
	d: 6.0, // 沿 z
	h: 4.6, // 檐高
} as const;

/** 生成单个货架单元 */
function shelf(x: number, z: number): THREE.Group {
	const g = new THREE.Group();
	g.position.set(x, 0, z);
	const body = new THREE.Mesh(
		new THREE.BoxGeometry(1.5, 2.0, 0.5),
		flat(0xe9dcc2, { roughness: 0.7 }),
	);
	body.position.y = 1.0;
	g.add(body);
	// 货架层板（亮色商品剪影）
	const plankMat = flat(0xffffff, { roughness: 0.5 });
	for (let i = 0; i < 4; i++) {
		const y = 0.28 + i * 0.45;
		const plank = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.4), plankMat);
		plank.position.y = y;
		g.add(plank);
		// 商品小盒
		const itemMat = flat([0xd95d43, 0x4a90d9, 0xf2c14d, 0x9b7ed8][i % 4], { roughness: 0.6 });
		for (let k = 0; k < 3; k++) {
			const item = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.28), itemMat);
			item.position.set(-0.4 + k * 0.42, y + 0.14, 0);
			g.add(item);
		}
	}
	return g;
}

/**
 * 构建便利店（含店内陈设），返回 Group。
 * 建筑以角点为 pivot，位置与朝向由调用方设置（正立 = 面向 +z/-x 街角）。
 */
export function buildStore(): THREE.Group {
	const root = new THREE.Group();
	root.name = "store";

	// ---------- 外轮廓 ----------
	// 地板
	const floor = new THREE.Mesh(new THREE.BoxGeometry(STORE.w, 0.1, STORE.d), flat(0xd9c9a5, { roughness: 0.9 }));
	floor.position.y = 0.05;
	root.add(floor);

	// 后墙 + 侧墙内衬（便于从玻璃外看到）为亮色
	// 这里外部墙面用简洁色块，玻璃开口处镂空留给玻璃。

	// ---- 框架柱（四角）----
	const frameMat = toon(0xf5efe2);
	const columnMat = toon(0xe9dcc6);
	const colGeo = new THREE.BoxGeometry(0.3, STORE.h, 0.3);
	const cols: [number, number][] = [
		[-STORE.w / 2, -STORE.d / 2],
		[STORE.w / 2, -STORE.d / 2],
		[-STORE.w / 2, STORE.d / 2],
		[STORE.w / 2, STORE.d / 2],
	];
	for (const [cx, cz] of cols) {
		const col = new THREE.Mesh(colGeo, columnMat);
		col.position.set(cx, STORE.h / 2, cz);
		root.add(col);
	}

	// ---- 后墙（-z 面，实墙）----
	const backWall = new THREE.Mesh(new THREE.BoxGeometry(STORE.w, STORE.h, 0.16), toon(0xf3e9d5));
	backWall.position.set(0, STORE.h / 2, -STORE.d / 2 - 0.05);
	root.add(backWall);

	// ---- 左墙（-x 面，实墙，可做小巷侧）----
	const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, STORE.h, STORE.d), toon(0xf3e9d5));
	sideWall.position.set(-STORE.w / 2 - 0.05, STORE.h / 2, 0);
	root.add(sideWall);

	// ---- 屋檐横梁（玻璃顶部）----
	const beam = new THREE.Mesh(new THREE.BoxGeometry(STORE.w + 0.3, 0.4, 0.4), toon(0xe4d6bd));
	beam.position.set(0, STORE.h - 0.2, STORE.d / 2 - 0.2);
	root.add(beam);

	// 玻璃上方雨棚（沿 +z 玻璃面）—— 供屋檐滴水
	const canopyMat = toon(PALETTE.storeGreenDark);
	const canopyZ = new THREE.Mesh(new THREE.BoxGeometry(STORE.w - 0.2, 0.14, 1.0), canopyMat);
	canopyZ.position.set(0, 1.5, STORE.d / 2 + 0.1);
	root.add(canopyZ);
	const canopyX = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.14, STORE.d - 0.2), canopyMat);
	canopyX.position.set(STORE.w / 2 + 0.1, 1.5, 0);
	root.add(canopyX);

	// 屋顶板（带内沿，从玻璃外看像天花板反光）
	const roof = new THREE.Mesh(new THREE.BoxGeometry(STORE.w + 0.4, 0.2, STORE.d + 0.3), toon(0x2c3140));
	roof.position.set(0, STORE.h + 0.1, 0);
	root.add(roof);

	// ---- 空调外机（屋顶侧后方）----
	const ac = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.8), flat(PALETTE.metalLight, { metalness: 0.3, roughness: 0.6 }));
	ac.position.set(STORE.w / 2 - 0.9, STORE.h + 0.3, STORE.d / 2 - 0.8);
	root.add(ac);
	const acFan = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 24), glow(0x22262e, { toneMapped: true }));
	acFan.rotation.x = Math.PI / 2;
	acFan.position.set(STORE.w / 2 - 0.9, STORE.h + 0.3, STORE.d / 2 - 0.45);
	root.add(acFan);

	// ---------- 玻璃橱窗（前 +x、右 +z 两面，便于透过看店内）----------
	const glassMat = flat(PALETTE.glassCool, { transparent: true, opacity: 0.24, side: THREE.DoubleSide, roughness: 0.12, metalness: 0.08 });
	const glassHeight = 2.6;
	const glassTop = 1.3;

	// 正对街角的玻璃(斜角) —— 用一个斜向玻璃面板切出街角感
	// 先在 +z 面 + +x 面放玻璃
	const windowZ = new THREE.Mesh(new THREE.BoxGeometry(STORE.w - 1.2, glassHeight, 0.06), glassMat);
	windowZ.position.set(0, glassTop + glassHeight / 2, STORE.d / 2 - 0.08);
	root.add(windowZ);

	const windowX = new THREE.Mesh(new THREE.BoxGeometry(0.06, glassHeight, STORE.d - 1.2), glassMat);
	windowX.position.set(STORE.w / 2 - 0.08, glassTop + glassHeight / 2, 0);
	root.add(windowX);

	// 玻璃窗框（纵向细条 + 横向）
	const frameLine = flat(0xd6dbe6, { metalness: 0.2, roughness: 0.4 });
	for (let i = 0; i < 3; i++) {
		const mz = new THREE.Mesh(new THREE.BoxGeometry(STORE.w - 1.2, 0.04, 0.04), frameLine);
		mz.position.set(0, 1.2 + glassTop + i * (glassHeight / 2), STORE.d / 2 - 0.08);
		root.add(mz);
	}

	// ---------- 招牌 ----------
	const signH = 1.1;
	const signW = 4.6;
	const signBoard = new THREE.Mesh(new THREE.BoxGeometry(signW, signH, 0.1), toon(PALETTE.storeGreen));
	signBoard.position.set(-0.6, STORE.h + 0.25, STORE.d / 2 - 0.12);
	root.add(signBoard);

	const texSign = makeTextTexture("24h", {
		width: 512,
		height: 96,
		bg: PALETTE.storeGreenDark.toString(16).padStart(6, "0"),
		color: "#8dffc4",
		fontSize: 88,
		sub: "便利屋",
	});
	const signFace = new THREE.Mesh(
		new THREE.PlaneGeometry(signW - 0.4, signH - 0.3),
		new THREE.MeshBasicMaterial({ map: texSign, toneMapped: false, transparent: true }),
	);
	signFace.position.set(-0.6, STORE.h + 0.25, STORE.d / 2 - 0.04);
	root.add(signFace);

	// 招牌灯（微光，供闪烁动效引用）
	const signLight = new THREE.Mesh(
		new THREE.BoxGeometry(signW, signH * 0.12, 0.04),
		glow(0x9dffd0, { toneMapped: false }),
	);
	signLight.position.set(-0.6, STORE.h + 0.85, STORE.d / 2 - 0.05);
	signLight.name = "store.signLight";
	root.add(signLight);

	// ---------- 店内陈设 ----------
	// 明亮店内光
	const interiorLight = new THREE.PointLight(0xffe9b0, 30, 12);
	interiorLight.position.set(0, 3.4, 0.6);
	root.add(interiorLight);

	// 收银台（靠前 +x/+z 角，柜台朝店内）
	const counter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 0.8), toon(0xe8c98a));
	counter.position.set(1.7, 0.5, -1.6);
	root.add(counter);
	// 收银机
	const register = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), flat(0x3a3f4b, { roughness: 0.4, metalness: 0.3 }));
	register.position.set(1.7, 1.15, -1.6);
	root.add(register);
	// 柜台屏发光
	const regScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), glow(0xaef7ff, { toneMapped: false }));
	regScreen.rotation.y = Math.PI / 2;
	regScreen.position.set(1.95, 1.25, -1.6);
	root.add(regScreen);

	// 咖啡机（柜台后角）
	const coffee = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.6), flat(0x5a5f6b, { roughness: 0.5, metalness: 0.3 }));
	coffee.position.set(1.7, 0.7, -2.6);
	root.add(coffee);
	const coffeeScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.2), glow(0xffd9a0, { toneMapped: false }));
	coffeeScreen.rotation.y = Math.PI / 2;
	coffeeScreen.position.set(2.06, 1.3, -2.6);
	root.add(coffeeScreen);

	// 关东煮柜台
	const oden = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.7), flat(0xd99c6a, { roughness: 0.7 }));
	oden.position.set(2.2, 0.45, 0.9);
	root.add(oden);
	const odenPot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.25, 20), flat(0x6a4b3a, { roughness: 0.5 }));
	odenPot.position.set(2.2, 0.95, 0.9);
	root.add(odenPot);
	const odenGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.26, 20), glow(0xffa24d, { toneMapped: false }));
	odenGlow.position.set(2.2, 0.95, 0.9);
	root.add(odenGlow);

	// 冰柜（透明门立柜）
	const freezer = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 0.7), flat(0x9db4d6, { transparent: true, opacity: 0.6, metalness: 0.3, roughness: 0.3 }));
	freezer.position.set(0.4, 1.0, -2.7);
	root.add(freezer);
	const freezerLight = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.8), glow(0xcfeeff, { toneMapped: false, transparent: true, opacity: 0.9 }));
	freezerLight.position.set(0.4, 1.0, -2.4);
	freezerLight.rotation.y = Math.PI / 2;
	root.add(freezerLight);

	// 饮料柜（玻璃门饮料冷柜，明亮发光，内摆饮料瓶）
	const drinkFridge = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.1, 0.7), flat(0x9dc4e8, { transparent: true, opacity: 0.5, metalness: 0.25, roughness: 0.3 }));
	drinkFridge.position.set(3.0, 1.05, -1.2);
	root.add(drinkFridge);
	const drinkGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.9), glow(0xd6f0ff, { toneMapped: false, transparent: true, opacity: 0.85 }));
	drinkGlow.rotation.y = Math.PI / 2;
	drinkGlow.position.set(3.64, 1.05, -1.2);
	root.add(drinkGlow);
	// 柜内瓶身
	for (let row = 0; row < 3; row++) {
		for (let col = 0; col < 4; col++) {
			const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 10), flat([0xffd75f, 0x7fd8ff, 0xff8fb0, 0x9ce58a][col % 4], { roughness: 0.3 }));
			bottle.position.set(3.0, 0.35 + row * 0.6, -0.7 + col * 0.3);
			root.add(bottle);
		}
	}

	// 店门口饮料货篮
	const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.5), flat(0xd4a94f, { roughness: 0.6 }));
	crate.position.set(2.6, 0.15, 1.7);
	root.add(crate);
	for (let i = 0; i < 3; i++) {
		const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 10), flat([0x8fd8ff, 0xff9f80, 0xb7ff9e][i % 3], { roughness: 0.3 }));
		bottle.position.set(2.4 + i * 0.3, 0.42, 1.7);
		root.add(bottle);
	}

	// 杂志架 + 海报
	const rackMat = toon(0xdfe6ef);
	const magRack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.5), rackMat);
	magRack.position.set(-2.6, 0.85, -2.0);
	root.add(magRack);
	// 杂志封面小色块
	for (let i = 0; i < 3; i++) {
		const mag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), flat([0xff6b7a, 0x66d0f2, 0xffc46b][i % 3], { roughness: 0.6 }));
		mag.rotation.y = Math.PI / 2;
		mag.position.set(-2.18, 1.3 - i * 0.4, -2.0 + (i % 2) * 0.2);
		root.add(mag);
	}

	// 店内灯箱（天花）
	const lightbox = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 2.2), glow(0xfff6dc, { toneMapped: false }));
	lightbox.position.set(-0.4, STORE.h - 0.25, 0.6);
	root.add(lightbox);

	// 货架两排
	const shelfA = shelf(0.6, 1.6);
	root.add(shelfA);
	const shelfB = shelf(0.6, -0.6);
	root.add(shelfB);
	const shelfC = shelf(-1.4, -0.8);
	root.add(shelfC);
	const shelfD = shelf(-1.4, 1.2);
	root.add(shelfD);

	// 地面导视箭头
	const guideTex = makeTextTexture("→", { width: 128, height: 128, color: "#fff2c8", fontSize: 110 });
	const guide = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: guideTex, transparent: true, depthWrite: false }));
	guide.rotation.x = -Math.PI / 2;
	guide.position.y = 0.12;
	guide.position.set(0.2, 0.12, 0.2);
	root.add(guide);

	// 后场门（储物区小门）
	const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.1, 0.08), toon(0xcfd6e2));
	door.position.set(-3.2, 1.05, -STORE.d / 2 + 0.02);
	root.add(door);
	const doorHandle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), flat(PALETTE.metalLight, { metalness: 0.6 }));
	doorHandle.position.set(-2.6, 1.05, -STORE.d / 2 + 0.05);
	root.add(doorHandle);

	return root;
}
