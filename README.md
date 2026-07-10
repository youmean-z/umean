# umean

**English** | [简体中文](./README.zh-CN.md)

A WYSIWYG editor npm package built on [TipTap v3](https://tiptap.dev), for Web, Electron, and TenTap (React Native).

- **Storage format**: JSON (TipTap `JSONContent`)
- **On-demand conversion**: HTML / Markdown
- **Headless core**: optional styles; shared extensions and JSON format across platforms

## Install

```bash
npm install umean
```

For TenTap integration, also install peer dependencies:

```bash
npm install @10play/tentap-editor @tiptap/core @tiptap/pm
```

## Package exports

| Export | Description |
|--------|-------------|
| `umean` | Full export (core + web) |
| `umean/core` | Extensions, types, headless transforms |
| `umean/web` | `EditorCore` / `createEditor` |
| `umean/tentap` | TenTap bridges and WebView extensions |
| `umean/tentap/editor-html` | Bundled WebView HTML string |
| `umean/styles/rich.css` | Rich-text reference theme |
| `umean/styles/rich-minimal.css` | Rich-text minimal layout styles |

## Quick start (Web)

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
    // JSON is the primary storage format
    console.log(json);
  },
  editorProps: {
    attributes: {
      class: 'editor-content',
      spellcheck: 'false', // optional: disable browser spell-check underlines
    },
  },
});

// Read / write
core.getJSON();
core.setJSON({ type: 'doc', content: [] });
core.getHTML();
core.getMarkdown();
core.setMarkdown('# Hello');

// Cleanup
core.destroy();
```

Add `class="umean-editor"` to the editor container. Styles are scoped to `.umean-editor .ProseMirror`.

## Headless transforms (core)

No DOM mount — useful for batch conversion (`jsonToHTML` requires DOM in Node; works in browser/Electron):

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

## Default extensions

`createDefaultExtensions()` includes:

| Module | Description |
|--------|-------------|
| StarterKit | Headings, lists, bold, etc. (built-in codeBlock disabled) |
| Rich | Image, TaskList, Table, CodeBlockLowlight |
| Markdown | JSON ↔ Markdown serialization |
| MarkdownClipboard | Parse pasted Markdown automatically |

Configure or disable as needed:

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
    // rich: false,       // disable all rich extensions
    // starterKit: false, // disable StarterKit
  },
});
```

Or provide a fully custom extension list:

```ts
createEditor({
  element: el,
  extensions: myExtensions,
});
```

## Styles

The core library **does not ship styles**. Import optionally:

```ts
// Reference theme (borders, backgrounds, etc.)
import 'umean/styles/rich.css';

// Or minimal layout only — bring your own theme
import 'umean/styles/rich-minimal.css';

// Syntax highlighting requires a separate highlight.js theme
import 'highlight.js/styles/github-dark.min.css';
```

## TenTap (React Native)

The RN side controls the TipTap editor inside a WebView via bridges.

**1. Build the WebView bundle**

```bash
npm run editor:build
```

**2. Use in RN**

```tsx
import { RichText } from '@10play/tentap-editor';
import { editorHtml } from 'umean/tentap/editor-html';
import { createTenTapBridges } from 'umean/tentap';

<RichText
  editorHtml={editorHtml}
  bridgeExtensions={createTenTapBridges()}
/>
```

Bridges:

| Bridge | Source | Capability |
|--------|--------|------------|
| TenTapStartKit | `@10play/tentap-editor` | Image, TaskList, etc. |
| TableBridge | umean | Insert table |
| CodeBlockBridge | umean | Toggle code block |

WebView-side extensions are provided by `createTenTapTiptapOptions()` (Markdown + clipboard).

## Project structure

```
src/
├── core/           # Extensions, types, headless transforms
├── web/            # EditorCore / createEditor
└── tentap/         # TenTap bridge adapters

styles/             # Optional CSS
test/               # Web demo page
tentap/editor-web/  # TenTap WebView source
```

## Development

```bash
# Install dependencies
npm install

# Build library (rolldown + tsc declarations)
npm run build

# Web demo (http://localhost:5173)
npm run test:dev

# TenTap WebView dev server
npm run editor:dev

# Bundle TenTap WebView
npm run editor:build
```

## License

MIT
