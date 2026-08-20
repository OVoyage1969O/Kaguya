import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),
		comment: z.boolean().optional().default(true),
		password: z.string().optional().default(""),
		passwordHint: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

const specCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
	schema: z.object({}),
});

/**
 * 动态/Moments 内容集合。
 * 每个 Markdown 文件对应一条动态，文件内容为动态正文（支持 Markdown 语法）。
 * frontmatter：
 * - published: 发布时间（必需）
 * - pinned: 是否置顶（可选，默认 false）
 * - location: 位置信息（可选）
 * - images: 附加图片列表（可选，用于渲染图片网格并接入 Fancybox 灯箱）
 */
const dynamicCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/dynamic" }),
	schema: z.object({
		// 使用 coerce：兼容 "2026-07-15 02:11:27" 这类字符串日期
		published: z.coerce.date(),
		pinned: z.boolean().optional().default(false),
		location: z.string().optional().default(""),
		images: z.array(z.string()).optional().default([]),
	}),
});

/**
 * 永远百科 · 词条内容集合。
 * 每个 Markdown 文件对应一篇词条，按分类分文件夹存放。
 * frontmatter 存结构化数据，正文用 Markdown（## 标题分节）。
 */
const bookshelfCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/bookshelf" }),
	schema: z.object({
		title: z.string(), // 词条名
		categoryId: z.string(), // 所属分类 id
		categoryName: z.string(), // 所属分类名
		summary: z.string().optional().default(""), // 简介
		// 顶部说明栏
		notices: z
			.array(
				z.object({
					icon: z.string().optional(),
					text: z.string(),
					color: z.string().optional(),
				}),
			)
			.optional()
			.default([]),
		// 右侧信息栏
		infobox: z
			.object({
				title: z.string(),
				image: z.string().optional(),
				imageAlt: z.string().optional(),
				groups: z.array(
					z.object({
						title: z.string().optional(),
						fields: z
							.array(
								z.object({
									label: z.string(),
									value: z.string(),
								}),
							)
							.optional()
							.default([]),
					}),
				),
			})
			.optional(),
		// 背景图
		background: z
			.object({
				image: z.string(),
				opacity: z.number().optional(),
			})
			.optional(),
		// 正文插图
		gallery: z.array(z.string()).optional().default([]),
	}),
});

export const collections = {
	posts: postsCollection,
	spec: specCollection,
	dynamic: dynamicCollection,
	bookshelf: bookshelfCollection,
};
