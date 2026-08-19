import type { FriendLink, FriendsPageConfig } from "../types/config";

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "友链",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "有点空是怎么回事呢",

	// 是否显示评论区，需要先在commentConfig.ts启用评论系统
	showComment: true,

	// 是否开启随机排序配置，如果开启，就会忽略权重，构建时进行一次随机排序
	randomizeSort: false,

	// 友链申请链接，填写后会在友链页面显示申请按钮
	// 使用模板参数直接跳转到友链申请模板
	applyLink:
		"https://github.com/OVoyage1969O/Kaguya/issues/new?template=friend-link.yml",

	// 本站信息，用于友链申请指南弹窗中的站点信息展示
	siteInfo: {
		name: "永远邸",
		desc: "在山上的大屋中，有魔女居住着",
		url: "https://ovoyage1969o.github.io/Kaguya",
		avatar: "https://thwiki.cc/%E8%93%AC%E8%8E%B1%E5%B1%B1%E8%BE%89%E5%A4%9C#/media/%E6%96%87%E4%BB%B6:%E8%93%AC%E8%8E%B1%E5%B1%B1%E8%BE%89%E5%A4%9C%EF%BC%88%E6%B0%B8%E5%A4%9C%E6%8A%84%E7%AB%8B%E7%BB%98%EF%BC%89.png",
		email: "784774835@qq.com",
	},

	// 注意事项，用于友链申请指南弹窗中的注意事项展示
	notes: [
		{
			title: "互换原则",
			content: "请先将本站添加到您的友链页面，确认后会添加您的友链",
		},
		{
			title: "链接维护",
			content: "友链网站长期无法访问或内容违规，将会被移除",
		},
		{
			title: "内容要求",
			content: "内容积极向上，不含有任何含色情/反动/暴力等违法违规内容",
		},
		{
			title: "站点要求",
			content: "支持 HTTPS，以原创内容为主，能够正常访问且有持续更新",
		},
	],
};

// 友链配置
export const friendsConfig: FriendLink[] = [
	{
		title: "Firefly Docs",
		imgurl: "https://docs-firefly.cuteleaf.cn/logo.png",
		desc: "我就是没朋友怎么了",
		siteurl: "https://docs-firefly.cuteleaf.cn",
		tags: ["Docs"],
		weight: 5,
		enabled: true,
	},
];

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	// 权重降序；同权重时保留配置列表中的原始顺序
	return friends
		.map((friend, index) => ({ friend, index }))
		.sort((a, b) => b.friend.weight - a.friend.weight || a.index - b.index)
		.map(({ friend }) => friend);
};
