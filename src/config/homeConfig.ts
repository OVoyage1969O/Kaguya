import type { HomeConfig } from "../types/config";

export const homeConfig: HomeConfig = {
	// 头像
	// 图片路径支持三种格式：
	// 1. public 目录（以 "/" 开头，不优化）："/assets/images/avatar.webp"
	// 2. src 目录（不以 "/" 开头，自动优化但会增加构建时间，推荐）："assets/images/avatar.webp"
	// 3. 远程 URL："https://example.com/avatar.jpg"
	avatar: "assets/images/Alice.jpg",

	// 名字
	name: "永远邸",

	// 首页展示名字（留空则使用 name）
	displayName: "永远邸",

	// 职业/身份标签
	occupation: "坂の上のお屋敷には、魔女が住んでいる",

	// 个人签名（支持多条，会循环打字+删除效果）
	bio: ["海月の虚空に秋涼し時鳥"],

	// 关于页 3D 文字球贴图（public 目录路径）
	aboutCanvasTexture: "/Kaguya/assets/images/Alice.jpg",

	hero: {
		backgroundImage: "/Kaguya/assets/images/home/LW.jpg",
		backgroundImageMobile: "/Kaguya/assets/images/home/home-mobile.avif",
		mosaic: {
			rows: 4,
			columns: 6,
			idleVisible: 6,
			idleInterval: 900,
			seed: 20260814,
			scrub: 0.45,
			desktopScrollDistance: 6500,
			mobileScrollDistance: 4600,
			desktopMinViewports: 8.1,
			mobileMinViewports: 6.1,
			interactionHold: 0.17,
		},
		quickActions: [
			{
				id: "articles",
				kind: "link",
				label: "文章",
				icon: "material-symbols:article-outline-rounded",
				href: "/Kaguya/archive/",
			},
			{
				id: "music",
				kind: "music",
				label: "颂乐",
				icon: "material-symbols:music-note-rounded",
				fallbackHref: "/Kaguya/music/",
			},
			{
				id: "guestbook",
				kind: "link",
				label: "留言",
				icon: "mingcute:comment-line",
				href: "/Kaguya/guestbook/",
			},
		],
		contact: {
			platform: "B站",
			handle: "姆Q丶",
		},
		sticker: {
			image: "/Kaguya/assets/images/home/Alice.png",
			alt: "黑猫角色贴纸",
			eye: {
				xPercent: 41.1,
				yPercent: 48.2,
				travelXPercent: 1.4,
				travelYPercent: 1,
			},
			rightEye: {
				xPercent: 64.1,
				yPercent: 44.7,
			},
			mouth: {
				xPercent: 53.4,
				yPercent: 50.7,
				widthPercent: 7.2,
				heightPercent: 1.9,
				rotation: -6,
				travelScale: 0.45,
			},
		},
		// galgame 对话框（写死暗黑主题）。内容全部由此驱动，可自由增删
		dialogue: {
			enabled: true,
			speakers: {
				host: "Alice",
				visitor: "来客",
			},
			menuTitle: "想聊点什么？",
			typingSpeed: 45,
			autoDelay: 1600,
			// 默认逐句播放的简介，末句后弹出话题菜单
			intro: [
				{ speaker: "host", text: "欢迎来到永远邸" },
				{ speaker: "host", text: "我是久远寺有珠" },
				{ speaker: "visitor", text: "那个...你的脸..." },
				{
					speaker: "host",
					text: "我的脸吗？眼睛和嘴巴不小心被青子乱学的魔法搞坏了，不要在意。",
				},
				{ speaker: "host", text: "我晚点会找她好好算账的" },
				{
					speaker: "host",
					text: "不管怎么说。永远邸，顾名思义，是永远亭和久远寺邸的结合",
				},
				{
					speaker: "host",
					text: "本意是对这个网页主人影响最深的两个系列作品。",
				},
				{ speaker: "host", text: "也就是型月和东方。" },
				{
					speaker: "host",
					text: "总而言之，这就是铸币大头蓬莱山的博客。",
				},
				{
					speaker: "host",
					text: "如果你想学什么魔术，我看情况可以教你一点基础的PLOY",
				},
			],
			// 话题菜单：点击进入逐句对话，末句后返回菜单
			topics: [
				{
					title: "真名解放",
					lines: [
						{ speaker: "visitor", text: "铸币大头蓬莱山？那是谁？" },
						{
							speaker: "host",
							text: "嘛……算个计算机科学爱好者，外加一个不务正业的人罢了。",
						},
						{
							speaker: "host",
							text: "他是那种什么都想干，但是都做不好的那种人。",
						},
						{
							speaker: "host",
							text: "可以说完全没有“完美”的概念呢。",
						},
						{ speaker: "visitor", text: "听起来很忙的样子。" },
						{
							speaker: "host",
							text: "大概吧，那种形式的科学怎么不算是一种魔法呢，虽然我不太懂。",
						},
					],
				},
				{
					title: "博客的作用",
					lines: [
						{ speaker: "visitor", text: "有什么具体的作用吗？" },
						{
							speaker: "host",
							text: "嗯...怎么说呢",
						},
						{
							speaker: "host",
							text: "这里有他平时学习的笔记，也有他和他的朋友们的日常和动态",
						},
						{
							speaker: "host",
							text: "当然，也有我，青子和草十郎的生活",
						},
						{
							speaker: "host",
							text: "不知道为什么，某一天晚上在书阁复习魔法的时候发生了一些意外",
						},
						{
							speaker: "host",
							text: "导致我们三个突然出现在这种地方",
						},
						{
							speaker: "host",
							text: "现在只能暂时居住在这里了",
						},
						{ speaker: "host", text: "嗯？魔夜二吗，那个还是秘密。" },
					],
				},
			],
		},
		// 玻璃雨珠 + 撞击水花（移动端自动降低密度，尊重 prefers-reduced-motion）
		rain: {
			enabled: true,
			intensity: 0.6,
			// 留空则随主题自动取色（暗色→白 / 浅色→深灰）；也可填 "#7fb0ff" 或 "127,176,255"
			color: "#ffffff",
		},
	},

	dataLayer: {
		visitImage: "/Kaguya/assets/images/home/BA灵梦.png",
		archiveImage: "/Kaguya/assets/images/home/goodg.png",
		contactImage: "/Kaguya/assets/images/home/2.jpg",
	},

	// 展示层：垂直线 → 长柱 → 字体显隐 → 柱子扩全屏 → 衔接百叶窗
	displayLayer: {
		enabled: true,
		kicker: "作品展示",
		title: "CRYSTALLIZE GALLERY",
		description: "In solitude, where we are least alone.",
		scrollDistance: 4000,
		pillarFinalWidth: "18vw",
		emitterImage: "/Kaguya/assets/images/home-truncated/QAL.webp",
	},

	portfolioShutter: {
		enabled: true,
		kicker: "The End",
		title: "“幸福地生活吧!”",
		description: "——Ludwig Josef Johann Wittgenstein",
		scrollDistance: 3000,
		finalImage: {
			midgroundImage: "/Kaguya/assets/images/home-truncated/AokoBG.png",
			backgroundVideo: "/Kaguya/assets/images/home-truncated/utl-back2.mp4",
			foregroundImage: "/Kaguya/assets/images/home-truncated/AO.webp",
			alt: "2026年 加油！",
		},
		interlude: {
			foreground: "/Kaguya/assets/images/home-truncated/QWE.webp",
			stripLeft: "/Kaguya/assets/images/home-truncated/HENG1.jpg",
			stripRight: "/Kaguya/assets/images/home-truncated/HENG3.jpg",
			copyLeft: "类型",
			copyRight: "月亮",
		},
		panels: [
			{
				title: "Github站点",
				english: "PROJECTS",
				description: "永远宅邸 · 工具导航",
				image: "/Kaguya/assets/images/home-truncated/Aoko.png",
				alt: "外部站点",
			},
			{
				title: "术业专攻",
				english: "SPECIALITIES",
				description: "AI学习 · 技术架构 · 踩坑记录",
				image: "/Kaguya/assets/images/home-truncated/Shiki.png",
				alt: "术业专攻",
			},
			{
				title: "博客特色",
				english: "BLOG FEATURES",
				description: "逻辑破碎 · 无病呻吟 · 神人发电",
				image: "/Kaguya/assets/images/home-truncated/Ceter.png",
				alt: "博客特色",
			},
			{
				title: "站点技术",
				english: "STACK",
				description: "Astro · SSG静态生成 · 纯AI零手工",
				image: "/Kaguya/assets/images/home-truncated/Alteria.png",
				alt: "站点技术",
			},
			{
				title: "相册收录",
				english: "PHOTO ALBUM",
				description: "AI 生图 · API 接入",
				image: "/Kaguya/assets/images/home-truncated/Arcuid.png",
				alt: "相册收录",
			},
		],
	},

	// 首页技能图标
	skills: [
		{ name: "Astro", icon: "simple-icons:astro", group: "Frontend" },
		{ name: "Svelte", icon: "simple-icons:svelte", group: "Frontend" },
		{ name: "TypeScript", icon: "simple-icons:typescript", group: "Language" },
		{ name: "React", icon: "simple-icons:react", group: "Frontend" },
		{ name: "Tailwind", icon: "simple-icons:tailwindcss", group: "Style" },
		{ name: "Java", icon: "mdi:language-java", group: "Backend" },
		{ name: "Python", icon: "simple-icons:python", group: "Language" },
		{ name: "Spring", icon: "simple-icons:spring", group: "Backend" },
		{ name: "Redis", icon: "simple-icons:redis", group: "Storage" },
		{ name: "MySQL", icon: "simple-icons:mysql", group: "Storage" },
		{ name: "MongoDB", icon: "simple-icons:mongodb", group: "Storage" },
		{ name: "RabbitMQ", icon: "simple-icons:rabbitmq", group: "Backend" },
		{ name: "Docker", icon: "simple-icons:docker", group: "DevOps" },
		{ name: "Linux", icon: "simple-icons:linux", group: "DevOps" },
		{ name: "Nginx", icon: "simple-icons:nginx", group: "DevOps" },
	],

	// 链接配置
	// 已经预装的图标集：fa7-brands，fa7-regular，fa7-solid，material-symbols，simple-icons
	// 访问https://icones.js.org/ 获取图标代码，
	// 如果想使用尚未包含相应的图标集，则需要安装它
	// `pnpm add @iconify-json/<icon-set-name>`
	// showName: true 时显示图标和名称，false 时只显示图标
	links: [
		{
			name: "qq",
			icon: "fa7-brands:qq",
			url: "https://qun.qq.com/universal-share/share?ac=1&authKey=yGSwkEERKUo1gyW6LJu6RRXX8Z9xaC1KFQeDNyiqdXgqueKy7BbJ0JSzZrJyrAZV&busi_data=eyJncm91cENvZGUiOiIxMDk4MTgwMTI2IiwidG9rZW4iOiIvMTkxbS9MYUJIWHkxRjB4OTYzVktwaHhyaGx5WGZKdlRLb0MwbnNHbmVJNDBaSFFkdEIwbW9XL1lTMGFCc2wzIiwidWluIjoiNTc1ODIwNTAzIn0%3D&data=j8-RpjeXSTpW1q03zGN_KXEYyMyewUadEpFk4gjEEEVVKNBAf1M53rGTF7n7Av6KlFiZTq3-DpNZooai193IDA&svctype=4&tempid=h5_group_info",
			showName: false,
		},
		{
			name: "B站",
			icon: "fa7-brands:bilibili",
			url: "https://space.bilibili.com/196192573",
			showName: false,
		},
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/OVoyage1969O",
			showName: false,
		},
		{
			name: "站内留言",
			icon: "material-symbols:chat-rounded",
			url: "/guestbook/",
			showName: false,
		},
		{
			name: "RSS",
			icon: "fa7-solid:rss",
			url: "/rss/",
			showName: false,
		},
	],
};
