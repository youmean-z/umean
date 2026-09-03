# umean

**English** | [简体中文](./README.zh-CN.md)

A TipTap v3 WYSIWYG **editor core** for personal notes — Web, Electron, and TenTap (React Native).

- **Storage**: TipTap `JSONContent`
- **Convert on demand**: HTML / Markdown
- **Headless core**: optional styles; shared schema across platforms

Feature history: [CHANGELOG.md](./CHANGELOG.md)

Usage (Chinese): [docs/usage.zh-CN.md](./docs/usage.zh-CN.md)

Public API (Chinese): [docs/api.zh-CN.md](./docs/api.zh-CN.md)

## Install

```bash
npm install umean
```

TenTap also needs:

```bash
npm install @10play/tentap-editor @tiptap/core @tiptap/pm
```

## Package exports

| Export | Description |
|--------|-------------|
| `umean` | core + web |
| `umean/core` | extensions, types, headless transforms |
| `umean/web` | `EditorCore` / `createEditor` |
| `umean/tentap` | TenTap bridges |
| `umean/tentap/editor-html` | bundled WebView HTML |
| `umean/styles/rich.css` | reference theme |
| `umean/styles/rich-minimal.css` | minimal layout styles |

## Quick start (Web)

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
    // persist JSON
  },
});

core.getJSON();
core.setJSON({ type: 'doc', content: [] });
core.getMarkdown();
core.setMarkdown('# Hello');

core.destroy();
```

Put `class="umean-editor"` on the container. Styles target `.umean-editor .ProseMirror`.

### Common `EditorCore` APIs

```ts
core.insertTemplate({ type: 'paragraph', content: [{ type: 'text', text: '…' }] });
core.getWordCount();
core.getCharCount({ excludeWhitespace: true });
core.setEditable(false); // readonly / preview
core.getShortcutList(); // keybindings + i18n labels
core.isDirty();
core.markClean();
core.getHeadings();
core.scrollToHeading(pos);
core.run('toggleBold');

// find / replace (commands)
core.editor.commands.setFindQuery('foo');
core.editor.commands.findNext();
```

Configure defaults via `extensionOptions` (locale, slash, upload, headingPolicy, …). Usage notes (Chinese): [docs/usage.zh-CN.md](./docs/usage.zh-CN.md). API: [docs/api.zh-CN.md](./docs/api.zh-CN.md). Release notes: [CHANGELOG](./CHANGELOG.md).

## Headless transforms

```ts
import { markdownToJSON, jsonToHTML, jsonToMarkdown } from 'umean/core';

const json = markdownToJSON('# Hello');
const html = jsonToHTML(json);
```

## Styles

```ts
import 'umean/styles/rich.css';
// or: import 'umean/styles/rich-minimal.css';
```

## TenTap (React Native)

```bash
npm run editor:build
```

```tsx
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
import { editorHtml } from 'umean/tentap/editor-html';
import { createTenTapBridges } from 'umean/tentap';

const editor = useEditorBridge({
  customSource: editorHtml,
  bridgeExtensions: createTenTapBridges(),
  autofocus: false,
  avoidIosKeyboard: true,
});

<RichText editor={editor} />
<Toolbar editor={editor} />
```

Simulator / device smoke demo: [`examples/tentap-demo`](./examples/tentap-demo) (`npm run demo:tentap`).

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm run test:dev   # http://localhost:5173/test/
npm run demo:tentap  # Expo TenTap demo (needs editor:build)
```

## License

MIT
