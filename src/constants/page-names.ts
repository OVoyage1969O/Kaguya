/**
 * 内容页的双语题签。中文为主标题，英文作为对照名以斜体衬线排在同一基线上。
 * 首页与沉浸式场景（入宅、书架、便利店）不使用这套题签。
 */
export interface PagePlateName {
	en: string;
	zh?: string;
}

export const PAGE_PLATE_NAMES: Record<string, PagePlateName> = {
	archive: { en: "Archive" },
	categories: { en: "Index" },
	list: { en: "Writings" },
	collections: { en: "Toolbox" },
	friends: { en: "Neighbours" },
	guestbook: { en: "Guestbook", zh: "留言板" },
	dynamic: { en: "Moments" },
	calendar: { en: "Calendar" },
	gallery: { en: "Gallery" },
	music: { en: "Playlist", zh: "歌单" },
	rss: { en: "Subscribe" },
	sponsor: { en: "Support" },
	search: { en: "Search", zh: "搜索" },
};

/** 由页面在自身内容中输出 H1 / 题签，不需要布局层再补一个。 */
export const ROUTES_WITH_OWN_TITLE = new Set([
	"archive",
	"notes",
	"categories",
	"list",
	"collections",
	"friends",
	"dynamic",
	"calendar",
	"gallery",
	"rss",
	"sponsor",
	"posts",
	"bookshelf",
	"guestbook",
	"konbini",
	"about",
	"404",
]);

export function getRouteKey(pathname: string, base: string): string {
	const normalizedBase = base.endsWith("/") ? base : `${base}/`;
	const trimmed = pathname.startsWith(normalizedBase)
		? pathname.slice(normalizedBase.length)
		: pathname.replace(/^\//, "");
	return trimmed.split("/")[0] ?? "";
}
