import type { DynamicConfig } from "../types/config";

/**
 * 动态 / Moments 配置。
 *
 * 数据源（sources）支持两种：
 * - local：本地 Markdown 内容集合，文件存放在 `src/content/dynamic/`，
 *   每条动态一个 .md 文件，正文使用 Markdown 语法。
 * - memos：对接 Memos 实例，实时拉取指定用户名下的公开动态。
 *
 * 你可以在 sources 中同时配置两者，页面会合并展示。
 */
export const dynamicConfig: DynamicConfig = {
	// 页面标题（留空则使用 i18n 翻译的"动态"）
	title: "",
	// 页面描述（留空则使用 i18n 翻译）
	description: "",

	// 数据源：默认仅使用本地 Markdown 内容集合
	sources: [
		{
			type: "local",
		},
		// 如需对接 Memos，取消注释并按需修改：
		// {
		// 	type: "memos",
		// 	apiUrl: "https://memos.example.com",
		// 	username: "your-name",
		// 	limit: 30,
		// 	includePinned: true,
		// },
	],

	// 每页展示的动态数量
	pageSize: 10,

	// 是否显示位置信息
	showLocation: true,
};
