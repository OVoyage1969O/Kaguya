import { getCollection } from "astro:content";
import { bookshelfConfig } from "@/config";
import { getSubgroupEntries } from "./bookshelf-config-utils";
import { url } from "./url-utils";

export const VOLUME_NUMERALS = [
	"一",
	"二",
	"三",
	"四",
	"五",
	"六",
	"七",
	"八",
	"九",
	"十",
];

export const VOLUME_ROMAN = [
	"I",
	"II",
	"III",
	"IV",
	"V",
	"VI",
	"VII",
	"VIII",
	"IX",
	"X",
];

export const HERO_SANCTUARY_IMAGE =
	"/assets/images/encyclopedia/hero-sanctuary.webp";

export const VOLUME_ARTWORK: Record<string, string> = {
	typemoon: "/assets/images/encyclopedia/vol-typemoon.webp",
	touhou: "/assets/images/encyclopedia/vol-touhou.webp",
	magic: "/assets/images/encyclopedia/vol-magic.webp",
	places: "/assets/images/encyclopedia/vol-places.webp",
	trivia: "/assets/images/encyclopedia/vol-trivia.webp",
};

export const VOLUME_ENGLISH: Record<string, string> = {
	typemoon: "Type-Moon Codex",
	touhou: "Gensokyo Chronicles",
	magic: "Magecraft & True Magic",
	places: "Sanctuaries & Topographies",
	trivia: "Trivia Dossiers",
};

export const VOLUME_ERA: Record<string, string> = {
	typemoon: "SINCE 1998",
	touhou: "SINCE 1996",
	magic: "ARCANA V",
	places: "EST. 2026",
	trivia: "FOG DOSSIER",
};

export const VOLUME_LOCALE: Record<string, string> = {
	typemoon: "三咲山丘 · 久远寺洋馆",
	touhou: "迷途竹林 · 博丽境界",
	magic: "根源书斋 · 五大魔法",
	places: "永远亭 × 久远寺邸",
	trivia: "浓雾旧镇 · 调查手记",
};

export const VOLUME_POETRY: Record<string, [string, string]> = {
	typemoon: ["山上的大屋中、有魔女居住着。", "月夜星盘下，翻阅神秘与传承。"],
	touhou: ["乐园想必、就在这片竹林深处。", "穿过博丽结界，赴一场绯红异变。"],
	magic: [
		"人力所及谓之魔术、奇迹谓之魔法。",
		"于烛影与棱镜之间，凝视根源微光。",
	],
	places: ["永远与久远、于此交汇为居所。", "西洋拱廊接壤竹庭，封存重叠记忆。"],
	trivia: [
		"拨开欧洲旧镇的浓雾、与往事同行。",
		"每一枚调查档案，都藏着未竟回响。",
	],
};

export const VOLUME_SYNOPSIS: Record<string, string> = {
	typemoon: "从魔术回路到圣杯战争，翻阅型月世界的法则、传承与夜色中的魔女。",
	touhou: "循着博丽大结界、异变与华丽符卡，步入幻想乡的另一种日常。",
	magic: "剖析人力可及的魔术、直抵根源的五大魔法，以及神秘消退的时代边界。",
	places: "故事驻足的城市、洋馆与竹林亭院，每一处空间都封存着重叠的记忆。",
	trivia: "穿过浓雾笼罩的欧洲旧镇，在调查员手记与人物档案里续写特里维亚。",
};

export interface EnrichedBookshelfItem {
	id: string;
	folio: string;
	title: string;
	summary: string;
	quote: string;
	quoteBy: string;
	href: string;
	categoryId: string;
	categoryName: string;
	volumeNumeral: string;
	volumeRoman: string;
	image: string;
	previewImage: string;
	person: boolean;
	groupLabel: string;
	hasStats: boolean;
}

export function resolveBookshelfAsset(src?: string): string {
	if (!src) return "";
	const base = import.meta.env.BASE_URL;
	if (src.startsWith(base) || src.startsWith("http")) return src;
	return url(src);
}

/** One catalogue backed by published content, shared across marumado stage, shelf, volume, and entry pages. */
export async function getBookshelfCatalogue() {
	const content = await getCollection("bookshelf");
	let globalCounter = 0;

	return bookshelfConfig.categories.map((category, volIndex) => {
		const subgroupMeta = new Map<string, string>();
		for (const sub of category.subgroups ?? []) {
			for (const entry of sub.entries) {
				subgroupMeta.set(entry.title, sub.name);
			}
			for (const eg of sub.entryGroups ?? []) {
				for (const entry of eg.entries) {
					subgroupMeta.set(entry.title, eg.name || sub.name);
				}
			}
		}

		const characters = (category.subgroups ?? []).flatMap(getSubgroupEntries);
		const configured = [...category.entries, ...characters];
		const people = new Set(characters.map((entry) => entry.title));

		const volumeNumeral = `卷${VOLUME_NUMERALS[volIndex] ?? volIndex + 1}`;
		const volumeRoman = `VOL. ${VOLUME_ROMAN[volIndex] ?? volIndex + 1}`;
		const bespokeArtwork =
			VOLUME_ARTWORK[category.id] || category.cover || HERO_SANCTUARY_IMAGE;
		const coverResolved = resolveBookshelfAsset(bespokeArtwork);
		const defaultGroupLabel =
			category.id === "places"
				? "场所"
				: category.id === "magic"
					? "神秘学"
					: "设定";

		const rawItems = content
			.filter((entry) => entry.data.categoryId === category.id)
			.map((entry) => {
				const matchedConfig = configured.find(
					(item) => item.title === entry.data.title,
				);
				const person =
					entry.id.startsWith("characters/") || people.has(entry.data.title);
				const rawImage = entry.data.infobox?.image || "";
				const rawBg = entry.data.background?.image || "";
				const previewRaw = rawImage || rawBg || bespokeArtwork;

				return {
					id: matchedConfig?.id || entry.data.title,
					title: entry.data.title,
					summary:
						entry.data.summary ||
						matchedConfig?.summary ||
						"翻开档案，继续阅读详细设定。",
					quote: entry.data.quote || "",
					quoteBy: entry.data.quoteBy || "",
					href: url(
						`/bookshelf/entries/${category.id}/${encodeURIComponent(entry.data.title)}/`,
					),
					categoryId: category.id,
					categoryName: category.name,
					volumeNumeral,
					volumeRoman,
					image: resolveBookshelfAsset(rawImage),
					previewImage: resolveBookshelfAsset(previewRaw),
					person,
					groupLabel:
						subgroupMeta.get(entry.data.title) ||
						(person ? "人物" : defaultGroupLabel),
					hasStats: Boolean(
						entry.data.stats && entry.data.stats.values.length >= 3,
					),
				};
			})
			.sort((a, b) => {
				const order = (title: string) => {
					const index = configured.findIndex((entry) => entry.title === title);
					return index < 0 ? configured.length : index;
				};
				return (
					order(a.title) - order(b.title) ||
					a.title.localeCompare(b.title, "zh-CN")
				);
			});

		const items: EnrichedBookshelfItem[] = rawItems.map((item) => {
			globalCounter += 1;
			return {
				...item,
				folio: String(globalCounter).padStart(2, "0"),
			};
		});

		return {
			...category,
			coverResolved,
			volumeNumeral,
			volumeRoman,
			era: VOLUME_ERA[category.id] ?? `VOL. ${volIndex + 1}`,
			locale: VOLUME_LOCALE[category.id] ?? category.name,
			poetry: VOLUME_POETRY[category.id] ?? [
				category.summary,
				"永远在此，静候翻阅。",
			],
			english: VOLUME_ENGLISH[category.id] ?? category.summary,
			editorialSynopsis: VOLUME_SYNOPSIS[category.id] || category.summary,
			items,
			href: url(`/bookshelf/category/${category.id}/`),
		};
	});
}

export type EnrichedBookshelfVolume = Awaited<
	ReturnType<typeof getBookshelfCatalogue>
>[number];

export function getFeaturedBookshelfEntries(
	volumes: EnrichedBookshelfVolume[],
): EnrichedBookshelfItem[] {
	const allItems = volumes.flatMap((v) => v.items);
	const featuredIds = bookshelfConfig.featured ?? [];
	const picked = featuredIds
		.map((fid) =>
			allItems.find((item) => item.id === fid || item.title === fid),
		)
		.filter((item): item is EnrichedBookshelfItem => Boolean(item));
	return picked.length > 0 ? picked : allItems.slice(0, 4);
}
