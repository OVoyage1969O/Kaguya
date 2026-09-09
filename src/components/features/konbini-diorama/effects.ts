// 动效运行时：降雨、滴水、涟漪、招牌灯箱闪烁、自动门开合、信号灯变化、玻璃雨痕
import * as THREE from "three";
import type { Diorama } from "./buildDiorama";

export function createEffects(diorama: Diorama, reducedMotion = false) {
	const { signLights, lampHalos, puddles, rain, drips, autoDoor, signal, glassRim } = diorama.animatables;

	// 降雨粒子原始数据
	const rainGeo = rain.geometry as THREE.BufferGeometry;
	const rainPos = rainGeo.attributes.position as THREE.BufferAttribute;

	const dripsGeo = drips.geometry as THREE.BufferGeometry;
	const dripsPos = dripsGeo.attributes.position as THREE.BufferAttribute;

	// 自动门状态机
	let doorOpen = false;
	let doorTimer = 0;
	let doorPhase = 0; // 0 关,1 开,2 关回

	// 涟漪数据
	const puddleScaleBase: number[] = puddles.map((p) => p.scale.x);

	// 招牌灯闪烁基础（每盏相位不同）
	const signPhases = signLights.map(() => Math.random() * 20);

	return {
		update(t: number, delta: number) {
			if (reducedMotion) return;

			// 降雨下落（y 轴循环）
			const n = rainPos.count;
			for (let i = 0; i < n; i++) {
				let y = rainPos.getY(i) - delta * 3.5;
				if (y < 0) y = 8;
				rainPos.setY(i, y);
			}
			rainPos.needsUpdate = true;

			// 滴水（近地面短线段下落 + 消失重生成）
			const dn = dripsPos.count;
			for (let i = 0; i < dn; i++) {
				let y = dripsPos.getY(i) - delta * 2.2;
				if (y < 0.02) {
					y = 0.6 + Math.random() * 0.3;
					dripsPos.setX(i, (Math.random() - 0.5) * 26);
					dripsPos.setZ(i, (Math.random() - 0.5) * 26);
				}
				dripsPos.setY(i, y);
			}
			dripsPos.needsUpdate = true;

			// 积水涟漪：脉动缩放
			puddles.forEach((p, idx) => {
				const pulse = 1 + Math.sin(t * 2.0 + idx * 1.7) * 0.12;
				const s = puddleScaleBase[idx] * pulse;
				p.scale.set(s, 1, s);
			});

			// 招牌灯箱轻微闪烁
			signLights.forEach((l, i) => {
				const phase = signPhases[i];
				const v = 0.86 + Math.sin(t * 6 + phase) * 0.14;
				const m = (l as THREE.Mesh).material as THREE.MeshBasicMaterial;
				if (m) m.opacity = v;
			});

			// 路灯泛光呼吸
			lampHalos.forEach((h, i) => {
				const v = 0.45 + Math.sin(t * 2.4 + i * 2) * 0.18;
				const m = (h as THREE.Mesh).material as THREE.MeshBasicMaterial;
				if (m) m.opacity = v;
			});

			// 自动门：约 8~14 秒开合一次
			if (autoDoor) {
				doorTimer += delta;
				if (!doorOpen && doorTimer > 9 + Math.random() * 3) {
					doorOpen = true;
					doorPhase = 1;
					doorTimer = 0;
				}
				if (doorOpen) {
					if (doorPhase === 1) {
						// 开门滑动（向外平移到一侧）
						const nx = THREE.MathUtils.lerp(autoDoor.position.x, 5.2, Math.min(1, delta * 4));
						autoDoor.position.x = nx;
						if (Math.abs(autoDoor.position.x - 5.2) < 0.02) {
							doorPhase = 2;
							doorTimer = 0;
						}
					} else if (doorPhase === 2) {
						if (doorTimer > 1.6) {
							const nx = THREE.MathUtils.lerp(autoDoor.position.x, 4.3, Math.min(1, delta * 3));
							autoDoor.position.x = nx;
							if (Math.abs(autoDoor.position.x - 4.3) < 0.03) {
								doorOpen = false;
								doorPhase = 0;
								doorTimer = 0;
							}
						}
					}
				}
			}

			// 信号灯切换（红 6s → 绿 6s 循环）
			const signalMat = (obj: THREE.Object3D | null): THREE.MeshBasicMaterial | null => {
				if (!obj) return null;
				return (obj as THREE.Mesh).material as THREE.MeshBasicMaterial;
			};
			const redM = signalMat(signal.red);
			const greenM = signalMat(signal.green);
			const yellowM = signalMat(signal.blue);
			if (redM && greenM && yellowM) {
				const cyc = t % 12;
				const onRed = cyc < 5.6;
				const onGreen = cyc >= 6.0 && cyc < 11.4;
				const onYellow = !onRed && !onGreen;
				redM.color.setHex(onRed ? 0xff4444 : 0x2a2a2e);
				greenM.color.setHex(onGreen ? 0x44ff66 : 0x2a2a2e);
				yellowM.color.setHex(onYellow ? 0xffd24a : 0x2a2a2e);
			}

			// 玻璃雨痕（沿玻璃缓慢下滑的透明光带，y 循环）
			if (glassRim) {
				let y = glassRim.position.y - delta * 0.5;
				if (y < 0.8) y = 3.6;
				glassRim.position.y = y;
			}
		},

		dispose() {
			// 无额外资源
		},
	};
}
