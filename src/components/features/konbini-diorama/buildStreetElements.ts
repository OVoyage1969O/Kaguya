// 街角杂项元素：自动贩卖机、自行车、路灯、电线杆与电线、路牌、
// 护栏、雨伞架、垃圾桶、公告栏、巷口。
import * as THREE from "three";
import { PALETTE, C, toon, glow, flat, makeTextTexture } from "./materials";

/** 自动贩卖机（带发光灯箱） */
export function buildVendingMachine(x: number, z: number, rotY = 0): THREE.Group {
	const g = new THREE.Group();
	g.position.set(x, 0, z);
	g.rotation.y = rotY;

	const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.1, 0.9), toon(0xe45a4a));
	body.position.y = 1.05;
	g.add(body);
	const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.25, 0.9), toon(0xffffff));
	top.position.y = 2.25;
	g.add(top);

	// 展示窗（发光商品）
	const windowTex = makeTextTexture("Drink", { width: 256, height: 320, bg: "1a1a22", color: "#6be7ff", fontSize: 60 });
	const windowPlane = new THREE.Mesh(
		new THREE.PlaneGeometry(0.9, 2.0),
		new THREE.MeshBasicMaterial({ map: windowTex, toneMapped: false, transparent: true }),
	);
	windowPlane.position.set(0, 1.4, 0.46);
	g.add(windowPlane);

	// 底部
	const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 1.0), flat(0x2c3038));
	base.position.y = 0.1;
	g.add(base);

	return g;
}

/** 自行车（斜靠在路边/橱窗前） */
export function buildBicycle(x: number, z: number, rotY = 0): THREE.Group {
	const g = new THREE.Group();
	g.position.set(x, 0, z);
	g.rotation.y = rotY;

	const frameMat = flat(PALETTE.bikeFrame, { metalness: 0.2, roughness: 0.5 });
	const darkMat = flat(0x20242c, { roughness: 0.6 });

	// 两轮
	for (const side of [-1, 1]) {
		const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 20), darkMat);
		wheel.rotation.z = Math.PI / 2;
		wheel.rotation.x = Math.PI / 2;
		wheel.position.set(side * 0.6, 0.34, 0);
		g.add(wheel);
	}
	// 车架（斜杆）
	const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8), frameMat);
	seatTube.rotation.x = Math.PI / 2 - 0.5;
	seatTube.position.set(0.05, 0.55, 0);
	g.add(seatTube);
	const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8), frameMat);
	topTube.rotation.x = Math.PI / 2;
	topTube.position.set(-0.1, 0.68, 0);
	g.add(topTube);
	// 座垫
	const seat = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.1), flat(0x15171c));
	seat.position.set(-0.1, 0.76, 0);
	g.add(seat);
	// 车把
	const handle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.03), darkMat);
	handle.position.set(0.55, 0.72, 0);
	g.add(handle);
	const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), frameMat);
	fork.rotation.x = Math.PI / 2 - 0.2;
	fork.position.set(0.6, 0.55, 0);
	g.add(fork);

	return g;
}

/** 路灯 */
export function buildStreetLamp(x: number, z: number, headDir = 0): THREE.Group {
	const g = new THREE.Group();
	g.position.set(x, 0, z);
	g.rotation.y = headDir;

	const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 4.2, 12), flat(PALETTE.metalDark, { metalness: 0.4, roughness: 0.4 }));
	pole.position.y = 2.1;
	g.add(pole);
	const headArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.8), flat(PALETTE.metalDark, { metalness: 0.4, roughness: 0.4 }));
	headArm.position.set(0, 4.15, 0.35);
	g.add(headArm);
	const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), glow(0xfff3c0, { toneMapped: false }));
	lamp.position.set(0, 4.0, 0.7);
	g.add(lamp);

	// 泛光（供动画调节强度）
	const halo = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), glow(0xffe6a0, { transparent: true, opacity: 0.5, toneMapped: false }));
	halo.position.set(0, 4.0, 0.7);
	halo.name = "lamp.halo";
	g.add(halo);

	return g;
}

/** 电线杆 + 两根下垂电线 */
export function buildUtilityPole(x: number, z: number, toX: number, toZ: number): THREE.Group {
	const g = new THREE.Group();
	g.position.set(x, 0, z);

	const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 6.2, 12), flat(0x4a463f, { roughness: 0.8 }));
	pole.position.y = 3.1;
	g.add(pole);

	// 横担
	const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.06), flat(0x4a463f));
	arm.position.y = 5.6;
	g.add(arm);
	const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), flat(0x4a463f));
	arm2.position.y = 4.9;
	g.add(arm2);

	// 绝缘子
	const insulatorMat = glow(0xffffff, { toneMapped: true });
	for (const ix of [-0.4, 0.4]) {
		const i1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.12, 8), insulatorMat);
		i1.position.set(ix, 5.66, 0);
		g.add(i1);
	}

	// 电线（CatmullRom 曲线，自建细管）
	const dx = toX - x;
	const dz = toZ - z;
	const len = Math.max(1, Math.hypot(dx, dz));
	const sag = 1.3;
	const points: THREE.Vector3[] = [];
	const steps = 12;
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const px = dx * t;
		const pz = dz * t;
		const py = 5.6 - Math.sin(Math.PI * t) * sag;
		points.push(new THREE.Vector3(px, py, pz));
	}
	const curve = new THREE.CatmullRomCurve3(points);
	const wireGeo = new THREE.TubeGeometry(curve, 24, 0.012, 6, false);
	const wire = new THREE.Mesh(wireGeo, flat(0x1c1d22, { roughness: 0.9 }));
	wire.position.x = x - x;
	wire.position.z = z - z;
	g.add(wire);

	return g;
}

/** 路牌（小型街角指示） */
export function buildSign(x: number, z: number, rotY = 0, text = "本町 2-4"): THREE.Group {
	const g = new THREE.Group();
	g.position.set(x, 0, z);
	g.rotation.y = rotY;
	const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.3, 10), flat(PALETTE.metalDark, { metalness: 0.4 }));
	pole.position.y = 1.15;
	g.add(pole);
	const board = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.9), toon(0x2c6fbb));
	board.position.y = 2.2;
	g.add(board);
	const tex = makeTextTexture(text, { width: 256, height: 96, color: "#ffffff", fontSize: 52 });
	const face = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.32), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: true }));
	face.rotation.y = Math.PI / 2;
	face.position.y = 2.2;
	face.position.x = 0.04;
	g.add(face);
	return g;
}

/** 雨伞架（橱窗边） */
export function buildUmbrellaStand(x: number, z: number, rotY = 0): THREE.Group {
	const g = new THREE.Group();
	g.position.set(x, 0, z);
	g.rotation.y = rotY;
	const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.22, 16), flat(PALETTE.metalDark, { metalness: 0.5 }));
	tray.position.y = 0.2;
	g.add(tray);
	const umbrellaMat = flat(0xd95d43, { roughness: 0.7 });
	for (let i = 0; i < 3; i++) {
		const angle = (i / 3) * Math.PI * 2;
		const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 6), flat(0x8a8f99));
		stick.position.set(Math.cos(angle) * 0.1, 0.8, Math.sin(angle) * 0.1);
		g.add(stick);
		const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.1, 12), umbrellaMat);
		canopy.position.set(Math.cos(angle) * 0.12, 1.25, Math.sin(angle) * 0.12);
		canopy.rotation.z = 0.3;
		g.add(canopy);
	}
	return g;
}

/** 垃圾桶 */
export function buildTrashBin(x: number, z: number, rotY = 0): THREE.Group {
	const g = new THREE.Group();
	g.position.set(x, 0, z);
	g.rotation.y = rotY;
	const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.7, 16), flat(0x4a5a52, { roughness: 0.7 }));
	bin.position.y = 0.35;
	g.add(bin);
	const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 16), flat(0x39463f));
	lid.position.y = 0.73;
	g.add(lid);
	return g;
}

/** 街角护栏 */
export function buildGuardrail(x: number, z: number, rotY = 0, len = 2.2): THREE.Group {
	const g = new THREE.Group();
	g.position.set(x, 0, z);
	g.rotation.y = rotY;
	const postMat = flat(PALETTE.metalDark, { metalness: 0.4 });
	const railMat = flat(0x8fd0c9, { metalness: 0.2, roughness: 0.6 });
	for (const px of [-len / 2, len / 2]) {
		const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), postMat);
		post.position.set(px, 0.35, 0);
		g.add(post);
	}
	const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.04), railMat);
	rail.position.y = 0.62;
	g.add(rail);
	return g;
}

/** 小型公告栏 / 海报栏 */
export function buildNoticeBoard(x: number, z: number, rotY = 0): THREE.Group {
	const g = new THREE.Group();
	g.position.set(x, 0, z);
	g.rotation.y = rotY;
	const legs = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.3), flat(PALETTE.metalDark, { metalness: 0.4 }));
	legs.position.y = 0.45;
	g.add(legs);
	const board = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 1.5), toon(0xb07a3c));
	board.position.y = 1.0;
	g.add(board);
	// 海报
	const posterMat = new THREE.MeshBasicMaterial({
		map: makeTextTexture("募集中", { width: 96, height: 128, color: "#2c6fbb", fontSize: 30, bg: "ffffff" }),
		transparent: true,
	});
	for (let i = 0; i < 2; i++) {
		const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.62), posterMat);
		poster.rotation.y = Math.PI / 2;
		poster.position.x = 0.03;
		poster.position.y = 1.0;
		poster.position.z = -0.35 + i * 0.72;
		g.add(poster);
	}
	return g;
}
