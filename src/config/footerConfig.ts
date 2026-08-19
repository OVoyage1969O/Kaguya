import type { FooterConfig } from "../types/config";

export const footerConfig: FooterConfig = {
	// 社交链接（mailto:/tel: 开头的链接不会在新标签打开）
	socialLinks: [
		{
			label: "GitHub",
			href: "https://github.com/OVoyage1969O",
			icon: "fa7-brands:github",
		},
		{
			label: "QQ",
			href: "https://qun.qq.com/universal-share/share?ac=1&authKey=yGSwkEERKUo1gyW6LJu6RRXX8Z9xaC1KFQeDNyiqdXgqueKy7BbJ0JSzZrJyrAZV&busi_data=eyJncm91cENvZGUiOiIxMDk4MTgwMTI2IiwidG9rZW4iOiIvMTkxbS9MYUJIWHkxRjB4OTYzVktwaHhyaGx5WGZKdlRLb0MwbnNHbmVJNDBaSFFkdEIwbW9XL1lTMGFCc2wzIiwidWluIjoiNTc1ODIwNTAzIn0%3D&data=j8-RpjeXSTpW1q03zGN_KXEYyMyewUadEpFk4gjEEEVVKNBAf1M53rGTF7n7Av6KlFiZTq3-DpNZooai193IDA&svctype=4&tempid=h5_group_info",
			icon: "fa7-brands:qq",
		},
		{
			label: "B站",
			href: "https://space.bilibili.com/196192573",
			icon: "fa7-brands:bilibili",
		},
		{
			label: "邮箱",
			href: "mailto:sleimiliya97@gmail.com",
			icon: "material-symbols:mail",
		},
	],

	// 备案信息（icp/police 留空则不显示对应条目）
	beian: {
		icp: "",
		police: "",
		policeIcon: "/assets/images/备案图标.png",
		icpUrl: "https://beian.miit.gov.cn/#/Integrated/index",
		policeUrl: "https://beian.mps.gov.cn/#/query/webSearch?code=44060602003342",
	},

	// Powered by 信息
	poweredBy: [
		{ label: "框架", name: "Astro", href: "https://astro.build" },
		{
			label: "主题",
			name: "Firefly",
			href: "https://github.com/CuteLeaf/Firefly",
		},
	],
};
