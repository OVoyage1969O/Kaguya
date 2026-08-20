import type { BookshelfConfig } from "../types/config";

/**
 * 永远百科 配置。
 * 词条详情页、搜索等后续逐步扩展，这里先定义主页所需的分类与词条。
 */
export const bookshelfConfig: BookshelfConfig = {
	// 站点名
	name: "永远百科",

	// 简介
	description:
		"收录「永远邸」及其所承载的世界观、角色与设定 —— 型月、东方、月姬、魔法与更广的幻想。就像一座等待翻阅的书架。",

	// 分类（书架上的"书"）
	categories: [
		{
			id: "typemoon",
			name: "型月世界",
			icon: "material-symbols:auto-awesome-mosaic",
			summary: "月之圣杯、魔术与英灵",
			entries: [
				{ id: "magic-circuit", title: "魔术回路", summary: "魔术师体内天生的回路，用于行使魔术。" },
				{ id: "holy-grail-war", title: "圣杯战争", summary: "围绕万能的许愿机展开的魔术战争。" },
				{ id: "true-magic", title: "魔法·根源", summary: "抵达根源的五大魔法，与魔术的界限。" },
			],
			// 子分组：型月人物（原"角色志"）
			subgroups: [
				{
					name: "型月人物",
					entries: [
						{ id: "alice", title: "久远寺有珠", summary: "魔女之家的少女，永远邸的女主人。" },
						{ id: "aoko", title: "苍崎青子", summary: "继承第五魔法的女性魔术师。" },
						{ id: "shiki", title: "两仪式", summary: "同时看到死亡的两仪之体。" },
					],
				},
			],
		},
		{
			id: "touhou",
			name: "东方project",
			icon: "material-symbols:auto-awesome",
			summary: "幻想乡的异变与弹幕",
			entries: [
				{ id: "gensokyo", title: "幻想乡", summary: "被结界与世界隔绝的幻想乐园。" },
				{ id: "incident", title: "异变", summary: "破坏幻想乡平衡的异常事象。" },
				{ id: "spell-card", title: "符卡规则", summary: "让战斗成为华丽表演的规则。" },
			],
		},
		{
			id: "magic",
			name: "魔法与魔术",
			icon: "material-symbols:auto-fix",
			summary: "魔术、魔法与神秘",
			entries: [
				{ id: "magecraft", title: "魔术", summary: "凭人力可达成的技术。" },
				{ id: "sorcery", title: "魔法", summary: "人类领域之外的奇迹。" },
				{ id: "mystic-code", title: "魔术礼装", summary: "预存魔术、便于使用的道具。" },
			],
		},
		{
			id: "places",
			name: "地点",
			icon: "material-symbols:location-home-rounded",
			summary: "舞台与场所",
			entries: [
				{ id: "eternal-mansion", title: "永远邸", summary: "永远亭与久远寺邸的结合，本站的精神居所。" },
				{ id: "misaki", title: "三咲町", summary: "月姬与魔法使之夜所发生的城市。" },
				{ id: "kaminogi", title: "神野市", summary: "魔法使之夜的舞台。" },
			],
		},
		{
			id: "trivia",
			name: "特里维亚",
			icon: "material-symbols:auto-awesome-motion",
			summary: "零散的趣闻与杂项",
			entries: [],
			// 子分组：人物（先放维塔·萨普里、迪普·桑姆博）
			subgroups: [
				{
					name: "人物",
					entries: [
						{ id: "vita-sapri", title: "维塔·萨普里", summary: "" },
						{ id: "deep-sambo", title: "迪普·桑姆博", summary: "" },
					],
				},
			],
		},
	],

	// 特色词条（首页重点展示）
	featured: ["true-magic", "gensokyo", "alice", "eternal-mansion"],
};
