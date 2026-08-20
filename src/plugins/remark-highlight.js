// remark 插件：把 `==文本==` 高亮语法转换为 <mark> 元素
// 例：`==重要==` → `<mark>重要</mark>`
// 需要放在文本节点层面处理，将匹配到的片段拆分为独立节点。

/**
 * 将单个文本节点按 `==高亮==` 拆分为普通文本与 mark 节点的 mdast 节点数组。
 * @param {string} value 文本内容
 * @returns {import('mdast').RootContent[]}
 */
function splitHighlight(value) {
	if (!value || !value.includes("==")) {
		return [{ type: "text", value }];
	}

	// 匹配成对的 ==...== （内容不含 = 号，避免贪婪匹配跨段）
	const regex = /==([^=\n]+)==/g;
	const nodes = [];
	let lastIndex = 0;
	let match;

	while ((match = regex.exec(value)) !== null) {
		// 高亮前的普通文本
		if (match.index > lastIndex) {
			nodes.push({
				type: "text",
				value: value.slice(lastIndex, match.index),
			});
		}
		// 高亮文本 → html 节点包裹 <mark>
		nodes.push({
			type: "html",
			value: `<mark>${match[1]}</mark>`,
		});
		lastIndex = regex.lastIndex;
	}

	// 末尾剩余普通文本
	if (lastIndex < value.length) {
		nodes.push({ type: "text", value: value.slice(lastIndex) });
	}

	return nodes;
}

export function remarkHighlight() {
	return (tree) => {
		// 深度优先遍历所有节点，处理 text 子节点
		function visit(node) {
			if (node.children && Array.isArray(node.children)) {
				const newChildren = [];
				for (const child of node.children) {
					if (child.type === "text" && child.value && child.value.includes("==")) {
						newChildren.push(...splitHighlight(child.value));
					} else {
						// 保留原有节点；对嵌套节点继续递归
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
