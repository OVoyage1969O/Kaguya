<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import * as THREE from "three";
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
	import { PALETTE, C } from "./materials";
	import { buildDiorama } from "./buildDiorama";
	import { createEffects } from "./effects";

	let container: HTMLDivElement;

	let renderer: THREE.WebGLRenderer;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let controls: OrbitControls;
	let clock: THREE.Clock;
	let animationId = 0;
	let onResize: () => void;
	let effectsHandle: ReturnType<typeof createEffects> | null = null;
	let sceneRoot: THREE.Group;
	let animatablesRef: import("./buildDiorama").Diorama["animatables"] | null = null;
	let motionUnlisten: (() => void) | null = null;

	// 三渲二关键光照
	// 夜景主光为冷色顶光/侧光，店内暖色点光，招牌自发光。
	function buildLighting() {
		const hemi = new THREE.HemisphereLight(0x8899cc, 0x141a28, 0.5);
		scene.add(hemi);

		const moon = new THREE.DirectionalLight(0x9fb4ff, 1.1);
		moon.position.set(-6, 10, -4);
		scene.add(moon);

		// 街角路灯暖光
		const warmFill = new THREE.DirectionalLight(0xffd9a0, 0.5);
		warmFill.position.set(4, 8, -3);
		scene.add(warmFill);

		// 环境内聚光
		const coolRim = new THREE.DirectionalLight(0x5ac8ff, 0.4);
		coolRim.position.set(6, 4, 6);
		scene.add(coolRim);

		// 店内泛光主光源（从玻璃内透出）
		const interior = new THREE.PointLight(0xffe3ad, 60, 16, 1.8);
		interior.position.set(1, 4.5, 2);
		scene.add(interior);

		// 招牌微光
		const signPoint = new THREE.PointLight(0x8dffc4, 30, 10, 2);
		signPoint.position.set(-1, 5.2, 2.6);
		scene.add(signPoint);
	}

	function init() {
		const w = container.clientWidth || window.innerWidth;
		const h = container.clientHeight || window.innerHeight;

		scene = new THREE.Scene();
		scene.background = C(PALETTE.nightSky);
		// 远雾拉开，保持模型主体与边缘清晰（微缩展品感）
		scene.fog = new THREE.Fog(PALETTE.fog, 34, 80);

		camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
		camera.position.set(12, 11, 13);
		camera.lookAt(0, 1.5, 0);

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(w, h);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.15;
		container.appendChild(renderer.domElement);

		controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(0, 1.6, 0);
		controls.enableDamping = true;
		controls.dampingFactor = 0.08;
		controls.minDistance = 4;
		controls.maxDistance = 30;
		controls.maxPolarAngle = Math.PI / 2 - 0.06; // 避免翻到地平线下
		controls.autoRotate = true; // 展示模型缓慢自转；用户拖拽时暂停
		controls.autoRotateSpeed = 1.1;
		controls.enablePan = true;
		controls.panSpeed = 0.4;
		const pauseAutoRotate = () => {
			controls.autoRotate = false;
		};
		controls.addEventListener("start", pauseAutoRotate);

		buildLighting();

		const { group, animatables } = buildDiorama();
		sceneRoot = group;
		scene.add(group);
		scene.add(animatables.rain);
		scene.add(animatables.drips);

		effectsHandle = createEffects({ group, animatables }, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
		animatablesRef = animatables;

		// 切换 reduced-motion 时即时更新效果开关
		const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const onMotionChange = () => {
			effectsHandle?.dispose();
			if (animatablesRef) {
				effectsHandle = createEffects({ group: sceneRoot, animatables: animatablesRef }, motionQuery.matches);
			}
		};
		motionQuery.addEventListener("change", onMotionChange);
		motionUnlisten = () => motionQuery.removeEventListener("change", onMotionChange);

		clock = new THREE.Clock();

		onResize = () => {
			if (!container || !camera || !renderer) return;
			const w2 = container.clientWidth || window.innerWidth;
			const h2 = container.clientHeight || window.innerHeight;
			camera.aspect = w2 / h2;
			camera.updateProjectionMatrix();
			renderer.setSize(w2, h2);
		};
		window.addEventListener("resize", onResize);
	}

	function animate() {
		animationId = requestAnimationFrame(animate);
		const delta = clock.getDelta();
		const t = clock.getElapsedTime();
		effectsHandle?.update(t, delta);
		controls.update();
		renderer.render(scene, camera);
	}

	function cleanup() {
		if (animationId) cancelAnimationFrame(animationId);
		if (onResize) window.removeEventListener("resize", onResize);
		motionUnlisten?.();
		motionUnlisten = null;
		effectsHandle?.dispose();
		effectsHandle = null;
		if (renderer) {
			renderer.dispose();
			if (container && renderer.domElement.parentNode === container) {
				container.removeChild(renderer.domElement);
			}
		}
		if (sceneRoot) {
			scene.traverse((o) => {
				const m = o as THREE.Mesh;
				if (m.geometry) m.geometry.dispose();
				if (m.material) {
					const mats = Array.isArray(m.material) ? m.material : [m.material];
					mats.forEach((mm) => {
						const anyM = mm as THREE.MeshBasicMaterial;
						if (anyM.map) anyM.map.dispose();
						mm.dispose();
					});
				}
			});
		}
		controls?.dispose();
	}

	onMount(() => {
		init();
		animate();
	});

	onDestroy(cleanup);
</script>

<div class="konbini-canvas" bind:this={container}></div>
