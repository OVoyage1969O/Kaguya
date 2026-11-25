# 数学笔记区维护

入口是 `/Kaguya/notes/`。当前笔记区把已有的 9 篇线性代数、9 篇概率论文章组织为两册，原文章 Markdown 仍是唯一正文来源。

## 内容与路由

`src/utils/notes-data.ts` 从 `posts` 集合选择 category 为 `线性代数` 或 `概率论` 的文章，排除 draft 和带 password 的内容。标题开头的数字决定章节顺序，显示时移除该前缀；章节地址由科目 ID 与 Astro 内容条目的 `entry.id` 组成，现有文章使用 frontmatter 中的 slug（如 LIN1、PROB1）。新增章节时，在原文章集合中按既有格式增加内容、使用准确分类及数字标题，重新构建即可。改变条目 ID 会改变地址；同册上一篇/下一篇根据排序自动生成。

正文少于 40 个去除首尾空白后的字符会标记为待补充。不要为去掉提示而补写占位正文。新科目需在 `NOTE_SUBJECTS` 中明确加入 ID、中文分类名称及简介，随后检查生成路由和导航。

`src/pages/notes/[...slug].astro` 复用 Astro 的原正文渲染，将正文标题整体降低一级（最高 H6），保留章节锚点，为页面标题留出唯一 H1。原来的 H1/H2 因此进入本篇目录。公式沿用已有 KaTeX 管线。章节 canonical、Open Graph URL 和 Twitter URL 都指向原文章；笔记正文不重复进入 Pagefind 索引。笔记区搜索仅筛选章节名称、简介、科目与编号，不搜索正文。

## 实现位置

| 文件 | 维护内容 |
| --- | --- |
| `src/pages/notes/index.astro` | 阅读指引与两册章节总览 |
| `src/layouts/NotesLayout.astro` | 章节树、元信息、抽屉结构、来源及翻页 |
| `src/components/notes/NotesToc.astro` | 桌面与窄屏的本篇目录 |
| `src/styles/pages/notes.css` | 本区排版、三栏、1199px/880px 响应边界与溢出规则 |
| `src/utils/notes-reader.ts` | 搜索、主题、抽屉、目录当前位置与事件清理 |

主题沿用全站纸色、墨色、陶土色和字体变量。数学正文与标题局部使用无衬线，阅读列上限 46rem；不要因此改写全站衬线阅读规范。正文选择器有意覆盖现有 study-page 样式。手机抽屉只在脚本增强后启用；无脚本时章节树保留在文档流。Drawer 的模态语义、焦点循环、背景 inert 和滚动锁定必须随关闭或页面清理恢复。交叉观察器保留完整相交标题集合，不能仅根据单次回调的变化项选择目录高亮。

导航入口位于 `src/config/navBarConfig.ts`；标题自管登记在 `src/constants/page-names.ts`；canonical 经两个共享布局传递；`src/utils/persona-motion.ts` 跳过笔记区的路由遮幕。章节链接采用原生导航。本区用自己的简短页脚，隐藏共享悬浮工具及常规页脚。

## 检查与当前验收状态

修改后执行 `pnpm build`，随后运行 `outputs/notes/verify.py` 检查生成 HTML。该脚本检查章节数量、唯一 H1/canonical、目录锚点、内部链接及原文章公式数量的一致性。完整证据入口是 `outputs/notes/validation.md`。

本次构建通过：96 个页面；笔记验证通过：19 页、18 章、487 个 KaTeX 节点，无失败；预览总览、PROB1、LIN3 均为 HTTP 200。原文章 Markdown 无 Git diff。两个新增 TypeScript 模块通过 Biome。全仓类型检查仍有 69 个已有错误、0 个警告、14 条提示，新增笔记文件无诊断；全仓类型检查尚未通过。

视觉终审处置是 **recapture**，当前没有视觉发布批准。Windows Computer Use 因无法可靠核实活动浏览器 URL 停止，未使用替代浏览器自动化。后续需重新采集当前笔记区桌面和手机截图，检查真实章节的公式/表格横向滚动、明暗主题、抽屉打开状态及键盘、触控、读屏行为。源代码审阅已解决目录高亮状态、末篇占位提示、抽屉模态语义和背景隔离问题，不能替代这些现场验收。

方向与实施记录位于 `.impeccable/notes-surface.md`，登记副本位于 `.impeccable/surfaces/src-pages-notes-index-astro.md`。保留全局 `DESIGN.md`、设计 sidecar 与配置；已有 sidecar 过期提示不属于本功能修复范围。没有新增光栅素材。
