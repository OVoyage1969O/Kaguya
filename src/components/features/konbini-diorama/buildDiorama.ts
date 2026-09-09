// 场景装配：把底座、便利店、街角元素组装成紧凑的微缩模型
import * as THREE from "three";
import { PALETTE, C, toon, glow, flat } from "./materials";
import { BASE, buildGround } from "./buildGround";
import { buildStore } from "./buildStore";
import {
	buildVendingMachine,
	buildBicycle,
	buildStreetLamp,
	buildUtilityPole,
	buildSign,
	buildUmbrellaStand,
	buildTrashBin,
	buildGuardrail,
	buildNoticeBoard,
} from "./buildStreetElements";

export interface Diorama {
	group: THREE.Group;
	/** 需要参与逐帧动效的引用 */
	animatables: {
		signLights: THREE.Object3D[];
		lampHalos: THREE.Object3D[];
		puddles: THREE.Object3D[];
		rain: THREE.Points;
		drips: THREE.Points;
		autoDoor: THREE.Object3D | null;
		signal: { red: THREE.Object3D | null; green: THREE.Object3D | null; blue: THREE.Object3D | null };
		glassRim: THREE.Object3D | null;
	};
}

/**
 * 生成整个微缩景观。
 * 坐标系：正方形底座中心在 (0,0)，路面在 -x / -z 侧呈 L 形街角，
 * 便利店位于角点内侧（+x/+z 区）。
 */
export function buildDiorama(): Diorama {
	const root = new THREE.Group();
	root.name = "diorama";

	// 承接动效引用的容器
	const signLights: THREE.Object3D[] = [];
	const lampHalos: THREE.Object3D[] = [];
	const puddles: THREE.Object3D[] = [];
	let autoDoor: THREE.Object3D | null = null;
	let glassRim: THREE.Object3D | null = null;
	const signal = { red: null as THREE.Object3D | null, green: null as THREE.Object3D | null, blue: null as THREE.Object3D | null };

	// ---- 底座与路面 ----
	const ground = buildGround();
	root.add(ground);

	// ---- 便利店（街角内侧 +x/+z）----
	const store = buildStore();
	// 建筑两个带玻璃的面（+x/+z）朝向街角交口，制造"角店"感。
	store.rotation.y = Math.PI / 4;
	store.position.set(1.6, 0, 1.6);
	root.add(store);

	// 收集招牌灯
	store.traverse((o) => {
		if (o.name === "store.signLight") signLights.push(o);
	});

	// ---- 自动门（玻璃自动门，位于建筑 L 角外侧指向街道）----
	const doorGroup = new THREE.Group();
	doorGroup.name = "autodoor";
	const doorGlass = new THREE.Mesh(
		new THREE.BoxGeometry(1.5, 2.5, 0.05),
		flat(PALETTE.glassWarm, { transparent: true, opacity: 0.5, side: THREE.DoubleSide, roughness: 0.2 }),
	);
	doorGlass.position.y = 1.25;
	doorGroup.add(doorGlass);
	const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 0.08), toon(0xe4d6bd));
	doorFrame.position.y = 2.6;
	doorGroup.add(doorFrame);
	doorGroup.position.set(4.3, 0, 1.4);
	doorGroup.rotation.y = Math.PI / 4 + 0.2;
	root.add(doorGroup);
	autoDoor = doorGroup;

	// ---- 自动贩卖机（街角人行道边）----
	root.add(buildVendingMachine(-3.0, 1.2, 0.5));
	root.add(buildVendingMachine(1.4, -4.0, -Math.PI / 2 + 0.3));

	// ---- 玻璃橱窗外自行车 ----
	root.add(buildBicycle(4.6, 4.6, 0.3));

	// ---- 雨伞架 + 垃圾桶（店门口）----
	root.add(buildUmbrellaStand(6.0, 1.6, -0.6));
	root.add(buildTrashBin(6.6, 4.0, 0.4));

	// ---- 路灯 ----
	const lamp1 = buildStreetLamp(-6.0, -4.6, 0.6);
	root.add(lamp1);
	const lamp2 = buildStreetLamp(5.6, -5.6, -1.0);
	root.add(lamp2);
	lamp1.traverse((o) => { if (o.name === "lamp.halo") lampHalos.push(o); });
	lamp2.traverse((o) => { if (o.name === "lamp.halo") lampHalos.push(o); });

	// ---- 电线杆 + 电线 ----
	root.add(buildUtilityPole(-6.6, 1.6, -4.0, 5.4));
	root.add(buildUtilityPole(5.8, 1.8, 3.0, 6.4));

	// ---- 路牌 / 护栏 ----
	root.add(buildSign(-1.2, -6.2, 0.0));
	root.add(buildGuardrail(-6.6, -2.4, 0.3, 2.4));
	root.add(buildGuardrail(2.6, -6.6, Math.PI / 2 - 0.2, 2.2));

	// ---- 公告栏 ----
	root.add(buildNoticeBoard(-5.6, 4.4, -0.8));

	// ---- 巷口（建筑另一侧留出通道 + 空调外机在店门侧墙）----
	// 用一堵矮墙 + 巷内灯示意小巷入口
	const alleyWall = new THREE.Mesh(
		new THREE.BoxGeometry(2.2, 1.4, 0.2),
		toon(0x6a7a8a),
	);
	alleyWall.position.set(-4.0, 0.7, 5.8);
	alleyWall.rotation.y = 0.4;
	root.add(alleyWall);
	const alleyLight = new THREE.Mesh(
		new THREE.SphereGeometry(0.1, 10, 8),
		glow(0xffe6a0, { toneMapped: false }),
	);
	alleyLight.position.set(-5.0, 2.0, 6.2);
	alleyLight.name = "alley.light";
	root.add(alleyLight);

	// ---- 外壁空调外机（挂在建筑侧墙外侧）----
	const wallAc = new THREE.Mesh(
		new THREE.BoxGeometry(0.6, 0.5, 1.1),
		flat(PALETTE.metalLight, { metalness: 0.3, roughness: 0.6 }),
	);
	wallAc.position.set(5.2, 2.2, 2.6);
	root.add(wallAc);
	const wallAcGrille = new THREE.Mesh(
		new THREE.PlaneGeometry(0.5, 0.4),
		new THREE.MeshBasicMaterial({ color: 0x333a45, toneMapped: true }),
	);
	wallAcGrille.rotation.y = Math.PI / 2;
	wallAcGrille.position.set(5.5, 2.2, 2.6);
	root.add(wallAcGrille);

	// ---- 店门口地垫 ----
	const doormat = new THREE.Mesh(
		new THREE.BoxGeometry(1.8, 0.04, 1.1),
		flat(0x9b5c3e, { roughness: 0.9 }),
	);
	doormat.position.set(2.2, 0.03, 2.6);
	root.add(doormat);

	// ---- 停车位标线（横路边，白色框线）----
	const parkLineMat = glow(PALETTE.roadLine, { transparent: true, opacity: 0.8 });
	for (let i = 0; i < 3; i++) {
		const gx = -0.5 + i * 2.6;
		const top = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.1), parkLineMat);
		top.rotation.x = -Math.PI / 2;
		top.position.set(gx, 0.14, -6.0);
		root.add(top);
		const bot = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.1), parkLineMat);
		bot.rotation.x = -Math.PI / 2;
		bot.position.set(gx, 0.14, -7.0);
		root.add(bot);
	}

	// ---- 积水反光斑 / 反光斑马线（路面上 放若干闪亮平面）----
	const puddleMat = new THREE.MeshBasicMaterial({
		color: new THREE.Color(PALETTE.puddle),
		transparent: true,
		opacity: 0.55,
		// 用顶点色难以做高级反光，这里用自发光法线作水面高光；
		// 简单起见以深蓝半透明平面 + 明暗材质近似
	});
	const puddlePositions: [number, number][] = [
		[-4.2, -3.6],
		[3.4, -4.6],
		[-1.8, -5.4],
		[-6.2, -3.4],
		[0.4, -4.4],
		[-4.8, -1.2],
	];
	for (const [px, pz] of puddlePositions) {
		const r = 0.5 + Math.random() * 0.5;
		const puddle = new THREE.Mesh(new THREE.CircleGeometry(r, 20), puddleMat);
		puddle.rotation.x = -Math.PI / 2;
		puddle.position.set(px, 0.16, pz);
		puddle.scale.y = 1;
		puddles.push(puddle);
		root.add(puddle);
		// 中心高光
		const hi = new THREE.Mesh(
			new THREE.CircleGeometry(r * 0.5, 16),
			new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbfe3ff), transparent: true, opacity: 0.5 }),
		);
		hi.rotation.x = -Math.PI / 2;
		hi.position.set(px, 0.18, pz);
		root.add(hi);
	}

	// ---- 斑马线反光(横路上) —— 加亮斑 ----
	const glintMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xdceaff), transparent: true, opacity: 0.6 });
	for (let i = 0; i < 6; i++) {
		const gx = -6 + i * 2.2;
		const gz = -4.2 + Math.sin(i * 3.1) * 0.6;
		const glint = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.18), glintMat);
		glint.rotation.x = -Math.PI / 2;
		glint.rotation.z = 0.4;
		glint.position.set(gx, 0.17, gz);
		glint.name = "road.glint";
		root.add(glint);
	}

	// ---- 玻璃沿雨水（半透明竖直细线贴在前玻璃上）—— 用一个透明长条动画 ----------
	// 放在店内前玻璃内侧，模拟雨水滑落高光
	const glassStream = new THREE.Mesh(
		new THREE.PlaneGeometry(0.05, 2.2),
		new THREE.MeshBasicMaterial({ color: new THREE.Color(0xbfe3ff), transparent: true, opacity: 0.25 }),
	);
	glassStream.position.set(0, 1.6, 5.6);
	glassRim = glassStream;
	root.add(glassStream);

	// ---- 远处信号灯（红/黄/绿）----
	const signalHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.5), flat(0x22262e, { roughness: 0.5 }));
	signalHead.position.set(-7.4, 3.4, -3.4);
	root.add(signalHead);
	const red = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), glow(0x3a3a3a, { toneMapped: false }));
	red.position.set(-7.4, 3.8, -3.1);
	root.add(red);
	const green = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), glow(0x3a3a3a, { toneMapped: false }));
	green.position.set(-7.4, 3.25, -3.1);
	root.add(green);
	const yellow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), glow(0x3a3a3a, { toneMapped: false }));
	yellow.position.set(-7.4, 3.5, -3.1);
	root.add(yellow);
	signal.red = red;
	signal.green = green;
	signal.blue = yellow; // 复用为黄
	const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 10), flat(PALETTE.metalDark, { metalness: 0.4 }));
	pole.position.set(-7.4, 1.5, -3.5);
	root.add(pole);

	return {
		group: root,
		animatables: {
			signLights,
			lampHalos,
			puddles,
			rain: createRain(),
			drips: createDrips(),
			autoDoor,
			signal,
			glassRim,
		},
	};
}

/** 降雨粒子系统（Points） */
function createRain(): THREE.Points {
	const COUNT = 900;
	const positions = new Float32Array(COUNT * 3);
	const area = BASE.half * 2;
	for (let i = 0; i < COUNT; i++) {
		positions[i * 3] = (Math.random() - 0.5) * area * 2;
		positions[i * 3 + 1] = Math.random() * 8;
		positions[i * 3 + 2] = (Math.random() - 0.5) * area * 2;
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	const mat = new THREE.PointsMaterial({
		color: 0xbcd6ff,
		size: 0.08,
		transparent: true,
		opacity: 0.55,
		sizeAttenuation: true,
		depthWrite: false,
	});
	const points = new THREE.Points(geo, mat);
	points.name = "rain";
	points.frustumCulled = false;
	return points;
}

/** 屋檐滴水（短竖线） */
function createDrips(): THREE.Points {
	const COUNT = 120;
	const positions = new Float32Array(COUNT * 3);
	const area = BASE.half * 2;
	for (let i = 0; i < COUNT; i++) {
		positions[i * 3] = (Math.random() - 0.5) * area * 2;
		positions[i * 3 + 1] = Math.random() * 0.8;
		positions[i * 3 + 2] = (Math.random() - 0.5) * area * 2;
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	const mat = new THREE.PointsMaterial({
		color: 0x9fd0ff,
		size: 0.04,
		transparent: true,
		opacity: 0.6,
		sizeAttenuation: true,
		depthWrite: false,
	});
	const points = new THREE.Points(geo, mat);
	points.name = "drips";
	points.frustumCulled = false;
	return points;
}
