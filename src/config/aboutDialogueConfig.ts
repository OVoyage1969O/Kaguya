export interface AboutDialogue {
	avatar: string;
	name: string;
	content: string;
	/** 头像放在左侧或右侧。 */
	side?: "left" | "right";
	/** 名字颜色，例如 #00d5dd。 */
	color?: string;
}

/** 在 about.md 中写 <!-- dialogue:welcome --> 即可插入对应对话框。 */
export const aboutDialogues: Record<string, AboutDialogue> = {
	welcome: {
		avatar: "/Kaguya/assets/images/Alice.jpg",
		name: "Alice",
		content: "欢迎来到永远邸。关于这里的故事，就从下面开始吧。",
		side: "left",
		color: "#00d5dd",
	},
};
