# umean 使用说明

面向宿主应用（Web / Electron）和写笔记时的操作约定。安装与包入口见 [README](../README.zh-CN.md)，方法与配置项见 [公开接口](./api.zh-CN.md)。

本地可跑 `npm run test:dev`，打开 `http://localhost:5173/test/` 对照本文。

## 接入

容器加 `class="umean-editor"`。参考主题要同时引入 KaTeX 与 highlight.js（代码块始终用暗色高亮主题即可）：

```html
<link rel="stylesheet" href="node_modules/umean/styles/rich.css" />
<link rel="stylesheet" href="node_modules/katex/dist/katex.min.css" />
<link rel="stylesheet" href="node_modules/highlight.js/styles/github-dark.min.css" />
<div id="editor" class="umean-editor"></div>
```

```ts
import { createEditor } from 'umean/web';

const core = createEditor({
  element: document.querySelector('#editor')!,
  content: '',
  contentType: 'markdown',
  extensionOptions: {
    locale: 'zh-CN',
    headingPolicy: { mode: 'free' },
  },
  onUpdate: ({ json }) => {
    // 持久化 JSON
  },
});
```

块拖拽手柄伸进容器左侧 padding，左右建议 ≥ `1.75rem`，正文才左右对称。

只要结构、自己配色时用 `umean/styles/rich-minimal.css`。

## 主题

在 `<html>` 上设 `data-theme="light"` 或 `"dark"`（默认亮色；不设 `data-theme` 也是亮色）。Slash 菜单 portal 到 `body`，不要只改编辑器容器。

```ts
document.documentElement.dataset.theme = 'dark';
```

| 跟着主题 | 始终暗色 |
|----------|----------|
| 正文、标题、链接、行内代码、引用、Callout、表格、Slash、查找高亮 | 代码块、Mermaid、块级公式 |

亮色下这三类面板仍是深底浅字；highlight.js 继续用 `github-dark`。Mermaid 主题在创建编辑器时配置，不跟 `data-theme` 热切换：

```ts
extensionOptions: {
  rich: { mermaid: { theme: 'neutral' } },
}
```

测试页用 `localStorage` 键 `umean-theme` 记住选择，可作宿主参考。

## 怎么写

空行输入 `/` 打开 Slash（中英文关键词都能搜）。也可直接敲 Markdown。

### 引用

卡片样式。最后一段且不是唯一段，视为出处（右对齐、略小）：

```markdown
> 这是摘录的原话。
>
> — 《某书》，作者
```

只有一段时不会被当成出处。

### 提示块（Callout）

Obsidian 风格，Slash 搜「提示」「警告」：

```markdown
> [!info]
> 说明

> [!tip]
> 建议

> [!warning]
> 注意

> [!danger]
> 危险
```

引用是别人的话；Callout 是自己的提示，不要混用。

### 高亮、公式、代码、图

| 能力 | 写法 |
|------|------|
| 高亮 | `==重点==`，快捷键 `Mod-Shift-h` |
| 行内公式 | `$E=mc^2$` 或 `Mod-m` |
| 块级公式 | `$$` 围栏或 `Mod-Shift-m`；工具栏可切源码 / 预览 |
| 代码块 | <code>```js</code>；顶栏可改语言、复制 |
| 流程图 | <code>```mermaid</code>；工具栏切图表 / 源码 |
| 图片 | 粘贴、拖入，或 Slash「图片」（需配置上传钩子） |
| 分割线 / 表格 | Slash「分割线」「表格」 |

`Mod` = macOS 上的 Cmd，Windows/Linux 上的 Ctrl。完整表：`core.getShortcutList()`。

### 链接

粘贴 URL 会成链。改完链接文字后，在链末按 `→` 继续写正文（不再带链）。

## 交互

- **Slash**：空行 `/`。`document` / `chunk` 标题策略下不出现一级标题。
- **块拖拽**：仅顶层兄弟换位，不会拖进引用或 Callout。`document` 模式下笔记标题（首行 H1）不显示手柄、不可拖，其它块也不能拖到标题前面。
- **只读**：`core.setEditable(false)`，隐藏光标、placeholder、手柄（布局不跳）。
- **查找替换**：核心只有命令和高亮，**没有面板**。宿主自己做输入条，例如：

```ts
core.editor.commands.setFindQuery('foo', { caseSensitive: false });
core.editor.commands.findNext();
core.editor.commands.replaceCurrent('bar');
core.editor.commands.replaceAll('bar');
core.editor.commands.clearFind();
```

测试页用 `Ctrl/Cmd+F` 打开查找条，可对照 `test/index.html`。

## 持久化

- **存库用 JSON**（`onUpdate` 的 `json`，或 `core.getJSON()`）。
- Markdown 适合导入导出。Callout / 公式 / Mermaid / 出处约定可往返；复杂文档以 JSON 为准更稳。
- `setJSON` / `setMarkdown` / `setHTML` 会 `markClean()`。用户编辑后 `isDirty()` 为 true；保存成功再 `markClean()`。
- `getHeadings()` 的 id 是运行时生成的，**不写入文档**，不要当永久锚点。

## 宿主要接的

这些刻意不内置 UI：

| 能力 | 怎么接 |
|------|--------|
| 主题切换 | 改 `html[data-theme]` |
| 查找条 | 调 `setFindQuery` 等命令 |
| 图片/文件上传 | `extensionOptions.upload.onImageUpload` / `onFileUpload`，返回 URL |
| 工具栏 / 链接浮层 | `onSelectionUpdate` + `core.run('toggleBold')` 等 |
| 快捷键表 | `core.getShortcutList()` |
| 字数 | `getWordCount` / `getCharCount` |

上传示例：

```ts
extensionOptions: {
  upload: {
    onImageUpload: async ({ file }) => {
      const src = await uploadToCdn(file);
      return { src, alt: file.name };
    },
  },
}
```

未配 `onImageUpload` 时，粘贴图片可能落到 Image 的 base64（若允许）。

## 标题策略

`extensionOptions.headingPolicy.mode`：

| 模式 | 用途 |
|------|------|
| `free`（默认） | 标题随意，含 H1 |
| `document` | 笔记：首行 H1 由策略管，用户不能再插 H1 |
| `chunk` | 随记：不出现 H1 |

## TenTap

Schema / JSON / 参考样式尽量共用。手机操作应另做（底部栏、长按、系统相册），不要搬 Slash 和拖拽手柄。`createTenTapTiptapOptions()` / 补充扩展默认不挂手柄；表格列宽拖拽默认关闭。TenTap 目前能力少于 Web（Slash、查找等未全接）。

宿主侧用 `useEditorBridge({ customSource: editorHtml, bridgeExtensions: createTenTapBridges() })`，不要把 `editorHtml` 传给 `RichText`。建议 `autofocus: false`，点编辑区再弹键盘。插入块用键盘上方工具栏内切换（标题 / +），不要弹系统 ActionSheet，也不要在 WebView 里接 Slash。插图走主栏「拍 / 图」（`ImageBridge.setImage`），不要用 Slash。链接在 + 里填 URL，不要弹系统输入框；点链接时先记下选区再聚焦输入框，确定给选区加链，加完光标在链后（不再带链），「关」退回主栏。标题用栏内「正 / H2 / H3」（笔记标题为「题」），不要用过大的 A 图标。代码块语言也在栏内选。分割线用插入栏「线」（`HorizontalRuleBridge.setHorizontalRule`）。提示块用插入栏「示」（`CalloutBridge.insertCallout`），栏内切换类型，不要弹系统面板。公式用插入栏「行 / 块」（`MathBridge.applyMath`），栏内填 LaTeX，不要弹系统输入框；块级用多行输入，点已有公式会带出源码。流程图用插入栏「流」（`insertMermaid`），默认显示图表，栏上「图 / 码」切换预览与源码（`setMermaidPreview`），不要用 Web 顶栏按钮。图后内容删光后仍可继续输入和换行（文末会补空段落）。键盘弹出时让编辑区随键盘缩小（不要只给 WebView 加 padding），长笔记才不会被挡住。真机 / 模拟器冒烟见 [`examples/tentap-demo`](../examples/tentap-demo)。

## 相关

- 公开接口：[api.zh-CN.md](./api.zh-CN.md)
- 安装与包入口：[README.zh-CN.md](../README.zh-CN.md)
- 功能变更：[CHANGELOG.zh-CN.md](../CHANGELOG.zh-CN.md)
