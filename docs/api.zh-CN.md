# umean 公开接口

宿主应优先使用 `createEditor` 返回的 `EditorCore`。需要无头转换或自组扩展时再用 `umean/core`。底层 TipTap 实例在 `core.editor`，能用但不是稳定封装面。

操作约定（Slash、引用出处、主题）见 [使用说明](./usage.zh-CN.md)。

## 包入口

| 入口 | 用途 |
|------|------|
| `umean` / `umean/web` | `createEditor`、`EditorCore` |
| `umean/core` | 无头转换、扩展、动作 ID、类型 |
| `umean/tentap` | `createTenTapBridges` |
| `umean/tentap/editor-html` | WebView HTML 字符串 |
| `umean/styles/rich.css` | 参考主题（含亮/暗变量） |
| `umean/styles/rich-minimal.css` | 仅布局，无主题色 |

```ts
import { createEditor } from 'umean/web';
import { markdownToJSON, jsonToMarkdown } from 'umean/core';
```

## `createEditor(options): EditorCore`

```ts
const core = createEditor({
  element: document.querySelector('#editor')!,
  content: '# Hello',
  contentType: 'markdown', // 默认 'json'
  extensionOptions: { locale: 'zh-CN' },
  onUpdate: ({ json, html, markdown, editor }) => {},
  onSelectionUpdate: ({ from, to, empty, isActive, can }) => {},
  onDestroy: () => {},
});
```

| 选项 | 说明 |
|------|------|
| `element` | 挂载节点（必填，构造时传入；没有 `mount()`） |
| `content` | 初始内容，默认空 `doc` |
| `contentType` | `'json'` \| `'markdown'` \| `'html'` |
| `extensionOptions` | 默认扩展配置，见下文 |
| `extensions` | 完全自定义扩展列表；传入后**忽略** `extensionOptions` |
| `shortcuts` | 与 `extensionOptions.shortcuts` 合并，顶层优先；`false` 关闭 umean 快捷键表 |
| `onUpdate` | 文档变更；payload 含 `json` / `html` / `markdown` |
| `onSelectionUpdate` | 选区变更，供工具栏 / Bubble |
| `onDestroy` | `destroy()` 时先于内部销毁调用 |
| 其余 | 透传 TipTap `EditorOptions`（不含 `extensions` / `content` / `onUpdate`） |

## `EditorCore`

### 内容

| 方法 | 说明 |
|------|------|
| `getJSON()` / `setJSON(json)` | 读写 TipTap JSON。`set*` 后自动 `markClean()` |
| `getHTML()` / `setHTML(html)` | HTML |
| `getMarkdown()` / `setMarkdown(md)` | Markdown |
| `insertTemplate(content)` | 在选区插入 JSON 节点，或 `doc` 的 `content` |

存库用 JSON。Markdown 适合导入导出。

### 状态与统计

| 方法 | 说明 |
|------|------|
| `isDirty()` / `markClean()` | 未保存变更。`setJSON` 等会 markClean；保存成功后再调一次 |
| `setEditable(false)` / `isEditable()` | 只读 / 预览 |
| `getWordCount()` | 全文词数（CJK 按字，拉丁按词） |
| `getCharCount({ excludeWhitespace? })` | 全文字符数 |
| `getSelectedWordCount()` / `getSelectedCharCount()` | 选区；空选区为 0 |
| `getHeadings()` | 标题树：`{ id, level, text, pos, children }`。`id` 如 `h-{pos}`，**不写入文档** |
| `scrollToHeading(pos)` | 跳到标题位置 |
| `getShortcutList()` | `{ keys, action, label, disabled, custom }[]`，供渲染快捷键表 |
| `focus()` / `destroy()` | 聚焦；销毁（会调 `onDestroy`） |

`mount()` / `unmount()` 已废弃，调用会抛错。

### 动作（工具栏）

Slash、快捷键、宿主按钮共用同一套 ID：

```ts
core.run('toggleBold');
core.run('insertTable', { rows: 3, cols: 3, withHeaderRow: true });
core.run('insertCallout', { type: 'warning' });
core.run('insertImage', { src: 'https://…', alt: '图' });
core.run('setLink', { href: 'https://example.com' });

core.can('toggleBold');
core.isActive('toggleBold');
```

| ID | payload（可选） |
|----|-----------------|
| `undo` / `redo` | — |
| `toggleBold` / `toggleItalic` / `toggleStrike` / `toggleCode` / `toggleHighlight` | — |
| `setParagraph` | — |
| `toggleHeading1` … `toggleHeading6` | — |
| `toggleBulletList` / `toggleOrderedList` / `toggleTaskList` / `toggleBlockquote` | — |
| `insertCallout` | `{ type?: 'info' \| 'tip' \| 'warning' \| 'danger' }` |
| `toggleCodeBlock` / `setHorizontalRule` | — |
| `insertTable` | `{ rows?, cols?, withHeaderRow? }` |
| `insertImage` | `{ src, alt?, title? }`（无上传钩子时直接插 URL） |
| `insertInlineMath` / `insertBlockMath` | `{ latex? }` |
| `setLink` | `{ href, target?, rel?, class? }` |
| `unsetLink` / `exitLink` | — |

链接另有快捷方法：`setLink(href)`、`unsetLink()`、`exitLink()`、`isLinkActive()`、`getLinkHref()`。链末按 `→` 也会 `exitLink`。

`onSelectionUpdate` 里的 `isActive` / `can` 与上面相同。

## `extensionOptions`

`createEditor({ extensionOptions })` 或无头转换的第二参数。值为 `false` 表示关闭该项。

| 字段 | 默认 | 说明 |
|------|------|------|
| `locale` | `'zh-CN'` | `'zh-CN'` \| `'en'` \| 部分文案覆盖。切换需**重建**编辑器 |
| `headingPolicy` | `{ mode: 'free' }` | `free` / `document` / `chunk` |
| `slash` | 启用 | `false` 关闭；可自定义 `items` / `onRequest` |
| `upload` | 无 | `onImageUpload` / `onFileUpload`，见使用说明 |
| `shortcuts` | 启用默认表 | `false` 关闭；`bindings` 覆盖键 |
| `link` | 启用 | 自动 URL、粘贴成链、外链新窗口 |
| `findReplace` | 启用 | 仅命令 + 高亮，无面板 |
| `dirtyState` | 启用 | |
| `blockDragHandle` | 启用 | 仅顶层兄弟 |
| `rich` | 全开 | 见下表 |
| `starterKit` / `markdown` | 启用 | 透传 TipTap |

`rich`（均可 `false` 关闭）：

| 字段 | 说明 |
|------|------|
| `image` / `highlight` / `callout` / `taskList` / `table` | 对应块 |
| `math` | `{ katexOptions? }` |
| `mermaid` | `{ enabled?, theme? }`，`theme` 默认 `'dark'` |
| `codeBlockLanguages` | `'js'` 或 `{ id, grammar, aliases, label }` |
| `codeBlockToolbar` | 语言下拉 + 复制 |
| `codeBlockLowlight` | 透传 lowlight |

快捷键覆盖示例：

```ts
shortcuts: {
  bindings: {
    'Mod-k': ({ editor }) => {
      // 打开宿主链接面板
      return true;
    },
    'Mod-b': false, // 禁用加粗键
  },
}
```

## 查找替换

无 UI。宿主面板调用：

```ts
import { getFindReplaceState } from 'umean/web';

core.editor.commands.setFindQuery('foo', {
  caseSensitive: false,
  select: false, // 输入时只高亮，不抢焦点
  focus: false,
});
core.editor.commands.findNext();
core.editor.commands.findPrevious();
core.editor.commands.replaceCurrent('bar');
core.editor.commands.replaceAll('bar');
core.editor.commands.clearFind();

const state = getFindReplaceState(core.editor);
// state.query / matches / activeIndex
```

## 无头转换（`umean/core`）

不挂 DOM，用于导入导出或服务端：

```ts
import { markdownToJSON, jsonToMarkdown, jsonToHTML } from 'umean/core';

const json = markdownToJSON('# Hello');
const md = jsonToMarkdown(json);
const html = jsonToHTML(json);
```

可选第二参数 `{ extensionOptions, extensions }`，需与编辑器同一套扩展，Callout / 公式等才能往返。

`createHeadlessEditor()` 返回临时 TipTap `Editor`，用完请 `destroy()`。

## TenTap

```ts
import { createTenTapBridges } from 'umean/tentap';
import { editorHtml } from 'umean/tentap/editor-html';

createTenTapBridges({
  headingPolicy: { mode: 'free' },
  codeBlockLanguages: ['js', 'ts'],
});
```

WebView 侧用 `createTenTapTiptapOptions()`。能力少于 Web，见使用说明。

## 进阶

`umean/core` 还导出扩展类（`Callout`、`FindReplace`、`SlashCommand`…）和 `EDITOR_ACTION_IDS`、`DEFAULT_SHORTCUT_BINDINGS`。自组 `extensions` 时用这些；常规宿主不必直接引用。

`core.editor` 是 TipTap `Editor`，可调未封装的 commands（如表格对齐）。升级 TipTap 时这里最容易变。
