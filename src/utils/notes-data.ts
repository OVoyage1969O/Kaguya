import { type CollectionEntry, getCollection } from "astro:content";
import { getPostUrlBySlug, removeFileExtension, url } from "./url-utils";

export const NOTE_SUBJECTS = [
	{
		id: "linear-algebra",
		name: "线性代数",
		description: "从线性方程组、行列式到线性空间与矩阵。",
	},
	{
		id: "probability",
		name: "概率论",
		description: "从概率空间、条件概率到随机变量与极限定理。",
	},
] as const;

export type MathNote = {
	id: string;
	title: string;
	number: string;
	description: string;
	href: string;
	originalHref: string;
	subjectId: string;
	subjectName: string;
	stub: boolean;
	entry: CollectionEntry<"posts">;
};

export async function getMathematicsNotebook() {
	const posts = await getCollection(
		"posts",
		({ data }) => !data.draft && !data.password,
	);
	return NOTE_SUBJECTS.map((subject) => ({
		...subject,
		chapters: posts
			.filter((entry) => entry.data.category === subject.name)
			.sort(
				(a, b) =>
					Number.parseFloat(a.data.title) - Number.parseFloat(b.data.title) ||
					a.data.title.localeCompare(b.data.title, "zh-CN", { numeric: true }),
			)
			.map((entry): MathNote => {
				const number = entry.data.title.match(/^\d+(?:\.\d+)?/)?.[0] || "";
				const id = `${subject.id}/${removeFileExtension(entry.id)}`;
				return {
					id,
					number,
					title: entry.data.title.replace(/^\d+(?:\.\d+)?[.．、\s]*/, ""),
					description: entry.data.description,
					href: url(`/notes/${id}/`),
					originalHref: getPostUrlBySlug(entry.id),
					subjectId: subject.id,
					subjectName: subject.name,
					stub: (entry.body || "").trim().length < 40,
					entry,
				};
			}),
	}));
}

export type MathematicsNotebook = Awaited<
	ReturnType<typeof getMathematicsNotebook>
>;
