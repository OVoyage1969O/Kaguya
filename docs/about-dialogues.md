# 关于页对话框

在 `src/config/aboutDialogueConfig.ts` 配置头像、名字、正文、左右方向及名字颜色。

```ts
welcome: {
  avatar: "/Kaguya/assets/images/Alice.jpg",
  name: "Alice",
  content: "第一句话。\n第二句话。",
  side: "left", // 可改为 right
  color: "#00d5dd",
},
```

在 `src/content/spec/about.md` 任意两个段落之间插入下面的标记，前后各空一行：

```md
<!-- dialogue:welcome -->
```

移动标记即可调整位置，删除标记即可隐藏该对话框。复制配置项并改成不同的名称（例如 `alice2`），再插入 `<!-- dialogue:alice2 -->`，即可添加更多对话框；同一个标记也可以重复使用。名称使用英文字母、数字、下划线或短横线。

头像使用 public 内的图片路径（包含当前站点的 `/Kaguya/` 前缀）或完整 HTTPS 图片地址。正文是纯文本，换行使用 `\n`；长文本会自动换行、撑高对话框。默认示例使用现有 Alice 头像，可随时替换。
