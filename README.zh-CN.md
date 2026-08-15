# umean

[English](./README.md) | **简体中文**

基于 TipTap v3 的个人笔记 **编辑器核心**，支持 Web、Electron 与 TenTap（React Native）。

- **存库**：TipTap `JSONContent`
- **按需转换**：HTML / Markdown
- **无 UI 核心**：样式可选；三端共用扩展与 JSON

功能变更见：[CHANGELOG.zh-CN.md](./CHANGELOG.zh-CN.md)

写笔记、接主题 / Slash / 上传等见：[使用说明](./docs/usage.zh-CN.md)

`createEditor` / `EditorCore` 方法、动作 ID、`extensionOptions` 见：[公开接口](./docs/api.zh-CN.md)

## 安装

```bash
npm install umean
```

TenTap 另需：

```bash
npm install @10play/tentap-editor @tiptap/core @tiptap/pm
```

## 包入口

| 入口 | 说明 |
|------|------|
| `umean` | core + web |
| `umean/core` | 扩展、类型、无头转换 |
| `umean/web` | `EditorCore` / `createEditor` |
| `umean/tentap` | TenTap Bridge |
| `umean/tentap/editor-html` | WebView HTML 字符串 |
| `umean/styles/rich.css` | 参考主题 |
| `umean/styles/rich-minimal.css` | 最小布局样式 |

## 快速开始（Web）

```html
<link rel="stylesheet" href="node_modules/umean/styles/rich.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
<link rel="stylesheet" href="node_modules/highlight.js/styles/github-dark.min.css" />
<div id="editor" class="umean-editor"></div>
```

```ts
import { createEditor } from 'umean/web';

const core = createEditor({
  element: document.querySelector('#editor')!,
  onUpdate: ({ json }) => {
    // 持久化 JSON
  },
});

core.getJSON();
core.setJSON({ type: 'doc', content: [] });
core.getMarkdown();
core.setMarkdown('# Hello');

core.destroy();
```

容器需加 `class="umean-editor"`，样式作用域为 `.umean-editor .ProseMirror`。

### 常用 `EditorCore` API

完整方法、动作 ID、`extensionOptions` 见 [公开接口](./docs/api.zh-CN.md)。常用：

```ts
core.insertTemplate({ type: 'paragraph', content: [{ type: 'text', text: '…' }] });
core.getWordCount();
core.getCharCount({ excludeWhitespace: true });
core.setEditable(false); // 只读 / 预览
core.getShortcutList(); // 绑键 + i18n 文案
core.isDirty();
core.markClean();
core.getHeadings();
core.scrollToHeading(pos);
core.run('toggleBold');

// 查找替换（commands）
core.editor.commands.setFindQuery('foo');
core.editor.commands.findNext();
```

默认能力通过 `extensionOptions` 配置（locale、slash、upload、headingPolicy 等）。使用约定见 [使用说明](./docs/usage.zh-CN.md)，接口见 [公开接口](./docs/api.zh-CN.md)，功能列表见 [更新日志](./CHANGELOG.zh-CN.md)。

## 无头转换

```ts
import { markdownToJSON, jsonToHTML, jsonToMarkdown } from 'umean/core';

const json = markdownToJSON('# Hello');
const html = jsonToHTML(json);
```

## 样式

```ts
import 'umean/styles/rich.css';
// 或：import 'umean/styles/rich-minimal.css';
```

## TenTap（React Native）

```bash
npm run editor:build
```

```tsx
import { RichText } from '@10play/tentap-editor';
import { editorHtml } from 'umean/tentap/editor-html';
import { createTenTapBridges } from 'umean/tentap';

<RichText editorHtml={editorHtml} bridgeExtensions={createTenTapBridges()} />
```

## 开发

```bash
npm install
npm run typecheck
npm test
npm run build
npm run test:dev   # http://localhost:5173/test/
```

## License

MIT
