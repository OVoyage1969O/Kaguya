/* 创建一条新的动态（Markdown 文件） */
import fs from "node:fs";
import path from "node:path";

function getDateTime() {
	const now = new Date();
	const pad = (n) => String(n).padStart(2, "0");
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

const args = process.argv.slice(2);
const content = args.join(" ").trim();

if (!content) {
	console.error(`Error: No content provided
Usage: pnpm new-d <动态内容>
Example: pnpm new-d 今天心情不错，出去吃了一顿火锅`);
	process.exit(1);
}

const targetDir = path.resolve("src/content/dynamic");
if (!fs.existsSync(targetDir)) {
	fs.mkdirSync(targetDir, { recursive: true });
}

const timestamp = new Date()
	.toISOString()
	.replace(/[-:]/g, "")
	.replace(/\..*$/, "")
	.replace("T", "-");
let fileName = `${timestamp}.md`;
let fullPath = path.join(targetDir, fileName);

// 避免同一秒创建重复文件
let counter = 1;
while (fs.existsSync(fullPath)) {
	const name = `${timestamp}-${counter}.md`;
	fullPath = path.join(targetDir, name);
	counter++;
}

const body = matterStringify(content, { published: getDateTime() });

fs.writeFileSync(fullPath, body, { encoding: "utf8", flag: "wx" });

console.log(`Dynamic ${fullPath} created`);

/* 与 gray-matter 兼容的简化序列化：生成 YAML frontmatter */
function matterStringify(content, data) {
	const lines = Object.entries(data).map(([k, v]) => {
		if (typeof v === "boolean") return `${k}: ${v}`;
		if (v === undefined || v === null) return `${k}: ""`;
		return `${k}: ${JSON.stringify(String(v))}`;
	});
	return `---\n${lines.join("\n")}\n---\n\n${content}\n`;
}
