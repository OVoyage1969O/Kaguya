import { marked } from "marked";
import type { DynamicConfig, DynamicMemosSource } from "@/types/config";

/** 归一化后的单条动态 */
export type MomentEntry = {
	published: Date;
	pinned: boolean;
	location?: string;
	images: string[];
	/** 正文 HTML（由调用方渲染） */
	body?: string;
	/** 本地动态经 Astro render() 得到的 Content 组件 */
	Content?: any;
	/** 来源标识 */
	source: "local" | "memos";
	/** 原始 Memos 数据（便于调试） */
	raw?: unknown;
};

export type MemosMemo = {
	id: number;
	createdTs: number;
	pinned: boolean;
	content: string;
	location?: string;
	resources?: Array<{
		name?: string;
		external_link?: string;
		type?: string;
		width?: number;
		height?: number;
	}>;
};

/**
 * 从 Memos API 拉取公开动态。
 * Memos 提供 `GET /api/v1/memos?status=PUBLIC&creatorId=...` 或
 * `GET /api/memo?status=PUBLIC&limit=...`（v0.x 与 v1.x 略有差异）。
 * 这里尝试 v1 的 `creatorName` 查询参数，失败时降级为无参数拉取。
 */
export async function fetchMemosMemos(
	source: DynamicMemosSource,
): Promise<MomentEntry[]> {
	const base = source.apiUrl.replace(/\/+$/, "");
	const limit = source.limit ?? 30;

	const urls = [
		`${base}/api/v1/memos?limit=${limit}&status=PUBLIC&creatorName=${encodeURIComponent(source.username)}`,
		`${base}/api/v1/memos?limit=${limit}&status=PUBLIC`,
	];

	let data: MemosMemo[] = [];
	let fetched = false;
	for (const url of urls) {
		try {
			const res = await fetch(url, {
				headers: { Accept: "application/json" },
			});
			if (!res.ok) continue;
			const json = (await res.json()) as unknown;
			// v1 返回 { memos: [...] }
			const list = Array.isArray(json)
				? json
				: ((json as { memos?: MemosMemo[] })?.memos ?? []);
			data = list as MemosMemo[];
			if (data.length > 0) {
				fetched = true;
				break;
			}
		} catch {
			// 尝试下一个地址
		}
	}

	if (!fetched) return [];

	return data.map((memo) => {
		const images = (memo.resources ?? [])
			.filter((r) => (r.type ?? "").startsWith("image"))
			.map((r) => r.external_link || r.name || "")
			.filter(Boolean);

		return {
			published: new Date(memo.createdTs * 1000),
			pinned: !!memo.pinned,
			location: memo.location || "",
			images,
			body: memo.content || "",
			source: "memos",
			raw: memo,
		};
	});
}

/**
 * 从动态正文 Markdown 中提取图片，并返回去除图片后的 Markdown 文本。
 *
 * 动态正文常用连续 `![alt](src)` 插入图片，渲染出的图片会占据整行大图。
 * 这里用 marked 解析正文，把图片节点全部抽离（存入返回的 images），
 * 正文只保留文字部分，随后由页面用九宫格网格渲染图片。
 */
export function extractImagesFromMarkdown(body: string): {
	text: string;
	images: string[];
} {
	const images: string[] = [];
	const tokens = marked.lexer(body);
	const text = extractText(tokens, images);
	return { text, images };
}

/** 递归解析 marked 的 token 树，收集图片并重建不含图片的 Markdown 文本 */
function extractText(tokens: any, images: string[]): string {
	if (Array.isArray(tokens)) {
		return tokens.map((t) => extractText(t, images)).join("\n");
	}
	if (!tokens || typeof tokens !== "object") return "";
	switch (tokens.type) {
		case "image":
			if (tokens.href) images.push(tokens.href);
			return ""; // 移除图片
		case "paragraph":
			return extractText(tokens.tokens ?? [], images);
		case "space":
			return "";
		case "text":
			return tokens.text ?? "";
		case "code":
			return tokens.text ?? "";
		case "html":
			return tokens.text ?? "";
		case "heading": {
			const inner = extractText(tokens.tokens ?? [], images);
			return `${"#".repeat(tokens.depth ?? 1)} ${inner}`;
		}
		case "list": {
			const items = (tokens.items ?? []).map((it: any) =>
				extractText(it.tokens ?? [], images),
			);
			return items.join("\n");
		}
		case "list_item":
			return `- ${extractText(tokens.tokens ?? [], images)}`;
		case "blockquote":
			return `> ${extractText(tokens.tokens ?? [], images)}`;
		case "link": {
			const inner = extractText(tokens.tokens ?? [], images);
			return `[${inner}](${tokens.href ?? ""})`;
		}
		case "strong":
			return `**${extractText(tokens.tokens ?? [], images)}**`;
		case "em":
			return `*${extractText(tokens.tokens ?? [], images)}*`;
		case "del":
			return `~~${extractText(tokens.tokens ?? [], images)}~~`;
		case "codespan":
			return `\`${tokens.text ?? ""}\``;
		case "br":
			return "";
		default:
			// 未知类型：尝试取其子 token
			if (tokens.tokens) return extractText(tokens.tokens, images);
			return tokens.raw ?? "";
	}
}

/** 用 marked 渲染一段纯 Markdown 为 HTML（用于动态正文文字部分） */
export function renderMarkdownToHtml(md: string): string {
	return marked.parse(md, { async: false }) as string;
}

/**
 * 合并所有已启用数据源并排序：
 * 置顶优先，其次按发布时间倒序。
 */
export async function getAllMoments(
	config: DynamicConfig,
): Promise<MomentEntry[]> {
	const sources = config.sources ?? [{ type: "local" as const }];
	const entries: MomentEntry[] = [];

	for (const source of sources) {
		if (source.type === "memos") {
			entries.push(...(await fetchMemosMemos(source)));
		}
		// local 由 Astro 内容集合在页面中另行加载，
		// 以避免在纯工具模块中依赖 astro:content。
	}

	// 本地动态在页面内通过 getCollection 获取后追加到 entries。
	return entries.sort((a, b) => {
		if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
		return b.published.getTime() - a.published.getTime();
	});
}
