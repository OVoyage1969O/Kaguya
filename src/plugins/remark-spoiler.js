/**
 * remark 插件：把 `[黑幕]内容[/黑幕]` 转换为黑幕（spoiler）元素。
 *
 * 用法：在 Markdown 正文中写 `[黑幕]被遮挡的内容[/黑幕]`，
 * 渲染后内容默认被黑幕遮挡，鼠标移上去才显示。
 * 暗色模式下黑幕自动变为白幕（由 CSS 处理）。
 *
 * 支持中文"黑幕"，也支持 "spoiler" 别名：`[spoiler]内容[/spoiler]`。
 */

// 匹配标签：黑幕 或 spoiler
const TAG = "黑幕|spoiler";

function splitSpoiler(value) {
	if (!value) return [{ type: "text", value }];
	// 若没有开始标签，原样返回
	if (!value.includes("[黑幕]") && !value.includes("[spoiler]")) {
		return [{ type: "text", value }];
	}

	const regex = new RegExp(`\\[(${TAG})\\]([\\s\\S]*?)\\[/\\1\\]`, "g");
	const nodes = [];
	let lastIndex = 0;
	let match;

	while ((match = regex.exec(value)) !== null) {
		// 标签前的普通文本
		if (match.index > lastIndex) {
			nodes.push({ type: "text", value: value.slice(lastIndex, match.index) });
		}
		// 黑幕内容 → 自定义节点，由 rehype 处理
		nodes.push({
			type: "html",
			value: `<span class="spoiler"><span class="spoiler__text">${match[2]}</span></span>`,
		});
		lastIndex = regex.lastIndex;
	}

	if (lastIndex < value.length) {
		nodes.push({ type: "text", value: value.slice(lastIndex) });
	}

	return nodes;
}

export function remarkSpoiler() {
	return (tree) => {
		function visit(node) {
			if (node.children && Array.isArray(node.children)) {
				const newChildren = [];
				for (const child of node.children) {
					if (
						child.type === "text" &&
						child.value &&
						(child.value.includes("[黑幕]") || child.value.includes("[spoiler]"))
					) {
						newChildren.push(...splitSpoiler(child.value));
					} else {
						if (child.children) visit(child);
						newChildren.push(child);
					}
				}
				node.children = newChildren;
			}
		}
		visit(tree);
	};
}
