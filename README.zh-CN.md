# umean

[English](./README.md) | **简体中文**

基于 [TipTap v3](https://tiptap.dev) 的所见即所得编辑器 npm 包，支持 Web、Electron 与 TenTap (React Native)。

- **存库格式**：JSON（TipTap `JSONContent`）
- **按需转换**：HTML / Markdown
- **核心无 UI**：样式可选引入，三端共用扩展与 JSON 格式

## 安装

```bash
npm install umean
```

TenTap 集成需额外安装 peer dependency：

```bash
npm install @10play/tentap-editor @tiptap/core @tiptap/pm
```

## 包入口

| 入口 | 说明 |
|------|------|
| `umean` | core + web 全量导出 |
| `umean/core` | 扩展、类型、无头转换 |
| `umean/web` | `EditorCore` / `createEditor` |
| `umean/tentap` | TenTap Bridge 与 WebView 扩展 |
| `umean/tentap/editor-html` | 打包后的 WebView HTML 字符串 |
| `umean/styles/rich.css` | 富文本参考主题样式 |
| `umean/styles/rich-minimal.css` | 富文本最小功能性样式 |

## 快速开始（Web）

```html
<link rel="stylesheet" href="node_modules/umean/styles/rich.css" />
<link rel="stylesheet" href="node_modules/highlight.js/styles/github-dark.min.css" />
<div id="editor" class="umean-editor"></div>
```

```ts
import { createEditor, demoDoc } from 'umean/web';

const core = createEditor({
  element: document.querySelector('#editor')!,
  content: demoDoc,
  onUpdate: ({ json, html, markdown }) => {
    // json 为主存格式
    console.log(json);
  },
  editorProps: {
    attributes: {
      class: 'editor-content',
      spellcheck: 'false', // 可选：关闭浏览器拼写检查波浪线
    },
  },
});

// 读取 / 写入
core.getJSON();
core.setJSON({ type: 'doc', content: [] });
core.getHTML();
core.getMarkdown();
core.setMarkdown('# Hello');

// 销毁
core.destroy();
```

编辑器容器需添加 `class="umean-editor"`，样式作用域为 `.umean-editor .ProseMirror`。

## 无头转换（core）

不挂载 DOM，用于服务端或批量转换（`jsonToHTML` 在 Node 环境需要 DOM，浏览器/Electron 中可用）：

```ts
import {
  jsonToHTML,
  jsonToMarkdown,
  markdownToJSON,
  createHeadlessEditor,
} from 'umean/core';

const json = markdownToJSON('# Hello\n\n- item');

const html = jsonToHTML(json);
const md = jsonToMarkdown(json);
```

## 默认扩展

`createDefaultExtensions()` 包含：

| 模块 | 说明 |
|------|------|
| StarterKit | 标题、列表、粗体等（关闭内置 codeBlock） |
| Rich | Image、TaskList、Table、CodeBlockLowlight |
| Markdown | JSON ↔ Markdown 序列化 |
| MarkdownClipboard | 粘贴 Markdown 自动解析 |

可按需关闭或配置：

```ts
import { createEditor } from 'umean/web';

createEditor({
  element: el,
  extensionOptions: {
    rich: {
      image: { allowBase64: true },
      table: { table: { resizable: true } },
      codeBlockLowlight: { defaultLanguage: 'javascript' },
    },
    // rich: false,       // 关闭全部富文本扩展
    // starterKit: false, // 关闭 StarterKit
  },
});
```

也可完全自定义扩展列表：

```ts
createEditor({
  element: el,
  extensions: myExtensions,
});
```

## 样式

核心库**不包含**样式，按需引入：

```ts
// 参考主题（含边框、背景等）
import 'umean/styles/rich.css';

// 或仅功能性布局，主题自行编写
import 'umean/styles/rich-minimal.css';

// 代码高亮需单独引入 highlight.js 主题
import 'highlight.js/styles/github-dark.min.css';
```

## TenTap（React Native）

RN 侧通过 Bridge 控制 WebView 内的 TipTap 编辑器。

**1. 构建 WebView bundle**

```bash
npm run editor:build
```

**2. RN 中使用**

```tsx
import { RichText } from '@10play/tentap-editor';
import { editorHtml } from 'umean/tentap/editor-html';
import { createTenTapBridges } from 'umean/tentap';

<RichText
  editorHtml={editorHtml}
  bridgeExtensions={createTenTapBridges()}
/>
```

Bridge 说明：

| Bridge | 来源 | 能力 |
|--------|------|------|
| TenTapStartKit | `@10play/tentap-editor` | Image、TaskList 等 |
| TableBridge | umean | 插入表格 |
| CodeBlockBridge | umean | 切换代码块 |

WebView 侧扩展通过 `createTenTapTiptapOptions()` 提供 Markdown 与剪贴板支持。

## 项目结构

```
src/
├── core/           # 扩展、类型、无头转换
├── web/            # EditorCore / createEditor
└── tentap/         # TenTap Bridge 适配

styles/             # 可选 CSS
test/               # Web 测试页
tentap/editor-web/  # TenTap WebView 源码
```

## 开发

```bash
# 安装依赖
npm install

# 编译库（rolldown + tsc 类型）
npm run build

# Web 测试页（http://localhost:5173）
npm run test:dev

# TenTap WebView 开发
npm run editor:dev

# 打包 TenTap WebView
npm run editor:build
```

## License

MIT
