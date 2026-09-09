// remark 插件：把 `==文本==` 高亮语法转换为 <mark> 元素
// 例：`==重要==` → `<mark>重要</mark>`
//     `==**加粗**==` → `<mark><strong>加粗</strong></mark>`
//     `**==加粗==**` → `<strong><mark>加粗</mark></strong>`
//
// 需要跨兄弟内联节点处理：当 `==...==` 与 `**加粗**` 组合时，
// remark-parse 会把 `**加粗**` 解析成独立的 strong 节点，`==` 标记
// 可能散落在 strong 两旁的 text 节点，也可能整个落在 strong 内部。
// 采用「深先序」遍历：先处理最内层容器里的 `==`，再逐层向上，
// 把容器内联子节点展平成一条虚拟字符串，定位 `==...==` 区间后按字符
// 回映射到原内联节点，用 data.hName 把命中区间输出为 <mark> 元素
//（remark-rehype 原生支持 data.hName，可在任意管线中生效）。

const INLINE_CONTAINERS = new Set([
	"paragraph",
	"heading",
	"strong",
	"emphasis",
	"link",
	"delete",
	"blockquote",
	"listItem",
	"tableCell",
	"definition",
	"footnoteDefinition",
]);

/**
 * 递归提取内联节点的纯文本（用于跨节点匹配 `==...==`）。
 * @param {import('mdast').Node} node
 * @returns {string}
 */
function getText(node) {
	if (!node) return "";
	if (node.type === "text") return node.value || "";
	if (node.type === "image" && node.alt) return node.alt;
	let out = "";
	if (node.children) {
		for (const child of node.children) out += getText(child);
	}
	return out;
}

/**
 * 将某容器的一组内联子节点转换为以 <mark> 高亮后的新子节点数组。
 * @param {import('mdast').RootContent[]} children
 * @returns {import('mdast').RootContent[]}
 */
function processInlineChildren(children) {
	if (!children || children.length === 0) return children;

	// 1. 展平：虚拟字符串 + 每个字符所属的原子索引（原子=一个原始子节点）
	const atoms = [];
	let combined = "";
	for (const child of children) {
		const text = child.type === "text" ? child.value || "" : getText(child);
		atoms.push({ child, text });
		combined += text;
	}
	const atomStart = [];
	{
		let acc = 0;
		for (const atom of atoms) {
			atomStart.push(acc);
			acc += atom.text.length;
		}
	}
	const combinedLen = combined.length;

	const result = [];
	let lastEmit = 0;

	/**
	 * 输出 [from, to) 区间的原子片段。
	 * @param {number} from
	 * @param {number} to
	 * @param {boolean} wrapMark
	 */
	function emitRange(from, to, wrapMark) {
		if (from >= to) return [];
		const inner = [];
		let pos = from;
		while (pos < to) {
			// 找到 pos 所在原子
			let atomIdx = 0;
			while (
				atomIdx < atoms.length - 1 &&
				pos >= atomStart[atomIdx] + atoms[atomIdx].text.length
			) {
				atomIdx++;
			}
			const atom = atoms[atomIdx];
			const segStart = atomStart[atomIdx];
			const segEnd = segStart + atom.text.length;
			const localFrom = pos - segStart;
			const localTo = Math.min(to, segEnd) - segStart;

			if (localTo > localFrom) {
				if (atom.child.type === "text") {
					inner.push({
						type: "text",
						value: atom.child.value.slice(localFrom, localTo),
					});
				} else {
					inner.push(atom.child);
				}
			}
			pos = Math.min(to, segEnd);
		}

		if (wrapMark && inner.length) {
			return [
				{
					type: "highlight",
					data: { hName: "mark", hProperties: {} },
					children: inner,
				},
			];
		}
		return inner;
	}

	// 2. 在虚拟字符串中找 `==...==`
	const regex = /==([^=\n]+)==/g;
	let match;
	while ((match = regex.exec(combined)) !== null) {
		const start = match.index;
		const contentStart = start + 2;
		const contentEnd = match.index + match[0].length - 2;
		const end = match.index + match[0].length;

		result.push(...emitRange(lastEmit, start, false));
		result.push(...emitRange(contentStart, contentEnd, true));
		lastEmit = end;
	}
	// 3. 收尾
	if (lastEmit < combinedLen) {
		result.push(...emitRange(lastEmit, combinedLen, false));
	}

	return result;
}

export function remarkHighlight() {
	return (tree) => {
		// 深先序（后序）：先处理子容器的 `==`，再处理本容器，保证嵌套顺序正确
		function apply(node) {
			if (!node.children || !Array.isArray(node.children)) return;

			// 先递归子容器
			for (const child of node.children) {
				if (child.type === "highlight") continue;
				if (child.children && Array.isArray(child.children)) apply(child);
			}

			// 再处理本容器的内联子节点
			if (INLINE_CONTAINERS.has(node.type)) {
				node.children = processInlineChildren(node.children);
			}
		}

		apply(tree);
	};
}
