// remark 插件：把 Obsidian 的 `![[图片名.png|选项]]` 内嵌图片语法转换为标准 mdast 图片节点。
//
// 用法（Obsidian 内嵌语法）：
//   ![[Pasted image 2026.png]]
//   ![[屏幕截图 2026.png|300]]      // |数字 表示宽度 px
//   ![[Alice.jpg|这张图是 Alice]]
//   ![[Alice.jpg|300|图注/alt]]
//
// 图片默认从 public/assets/images/ 目录读取，URL 为 <base>assets/images/<文件名>，
// 因此文件名需与该目录下的文件完全一致（含空格、扩展名）。
// <base> 由调用方传入（astro.config.mjs 用 import.meta.env.BASE_URL，即 "/Kaguya/"），
// 因为纯 .js 插件在 remark 运行环境拿不到 import.meta.env。
import { visit } from "unist-util-visit";

// 匹配 ![[...]] 形式（允许内容含空格，但不跨行）
const WIKI_RE = /!\[\[([^\]\n]+)\]\]/g;

/**
 * 解析 `![[xxx.png|300|alt]]` 的各个参数。
 * @param {string} content `[[...]]` 内部内容
 * @returns {{ src: string; alt: string; width: string | null } | null}
 */
function parseEmbed(content) {
	if (!content) return null;
	const parts = content.split("|").map((p) => p.trim());
	const src = parts[0] || "";
	if (!src) return null;

	let width = null;
	let alt = src;

	for (let i = 1; i < parts.length; i++) {
		const part = parts[i];
		if (/^\d+$/.test(part)) {
			width = part;
		} else if (part) {
			alt = part;
		}
	}

	return { src, alt, width };
}

/**
 * 把一个 text 节点中出现的 `![[...]]` 拆分为普通文本与 image 节点。
 * @param {string} value
 * @param {string} base
 * @returns {import('mdast').RootContent[]}
 */
function splitImageText(value, base) {
	if (!value || !value.includes("[[")) {
		return [{ type: "text", value }];
	}

	const nodes = [];
	let lastIndex = 0;
	let match;

	while ((match = WIKI_RE.exec(value)) !== null) {
		const embed = parseEmbed(match[1]);

		if (match.index > lastIndex) {
			nodes.push({ type: "text", value: value.slice(lastIndex, match.index) });
		}

		if (embed) {
			const url = `${base}assets/images/${encodeURIComponent(embed.src)}`;
			const imgNode = {
				type: "image",
				url,
				alt: embed.alt,
				title: embed.alt || null,
			};
			if (embed.width) {
				imgNode.data = {
					hProperties: {
						style: `width: ${embed.width}px;`,
					},
				};
			}
			nodes.push(imgNode);
		} else {
			// 解析失败则原样保留
			nodes.push({ type: "text", value: match[0] });
		}
		lastIndex = WIKI_RE.lastIndex;
	}

	if (lastIndex < value.length) {
		nodes.push({ type: "text", value: value.slice(lastIndex) });
	}

	return nodes;
}

/**
 * @param {{ base?: string }} [options] base 为站点根路径（如 "/Kaguya/"），默认 "/"
 */
export function remarkObsidianImage(options = {}) {
	const base = options.base ?? "/";
	return (tree) => {
		visit(tree, (node, index, parent) => {
			// 只处理文本节点
			if (node.type !== "text" || !node.value || !node.value.includes("[[")) {
				return;
			}
			if (!parent || typeof index !== "number") return;

			const pieces = splitImageText(node.value, base);
			if (pieces.length === 1 && pieces[0] === node) return;
			parent.children.splice(index, 1, ...pieces);
		});
	};
}
