# Changelog

## Unreleased

## 0.3.2

### Fixed

- TenTap: `createTenTapBridges({ headingPolicy, codeBlockLanguages })` is injected into the WebView via `umeanConfig`, so `document` actually locks the first-line H1 and custom code-block languages apply (previously RN-only)

## 0.3.1

### Changed

- Reference theme `rich.css` defaults to light (`:root` / `data-theme="light"`); set `data-theme="dark"` for dark

### Fixed

- `document` heading policy: the note title (first H1) has no drag handle and cannot be reordered; other blocks cannot drop above it

## 0.3.0

TenTap can actually take notes on a phone: keyboard accessory bar, camera/library, math, Mermaid preview, callout, and horizontal rule. Web schema and host APIs are unchanged from 0.2.0.

### Changed

- TenTap supplemental extensions no longer register the block drag handle by default (pass `blockDragHandle: {}` to enable)
- TenTap `TableBridge` uses `resizable: false` (column drag is not usable on touch)
- `tentap-demo`: focus the editor to show the keyboard; note-like chrome; Android `softwareKeyboardLayoutMode: resize`
- `tentap-demo`: keyboard accessory toolbar; heading and insert switch in-bar (no system sheets, so the keyboard stays up); main bar includes undo/redo
- `tentap-demo`: heading control is 「正 / H2 / H3」(note title shows 「题」); camera/library sit on the main bar; link and lists move under +
- TenTap WebView: `.ProseMirror` uses `box-sizing: border-box` so an empty note no longer overscrolls
- TenTap tables draw cell borders; in-table toolbar can add/delete rows and columns, delete the table, or align the current cell (left by default)

### Fixed

- `tentap-demo`: shrink the editor above the keyboard on iOS and Android Expo (edge-to-edge does not resize the window); format bar sits in layout instead of overlaying the WebView
- TenTap image insert leaves the caret in a paragraph below the image
- TenTap links: typing a URL no longer drops the selection (so confirm wraps text instead of inserting a new URL); the caret leaves the link after confirm; 「关」 closes the link bar
- After deleting everything below an image, typing and Enter still work: a trailing paragraph is restored; Enter / mobile `insertParagraph` after an image is handled; inserting an image no longer adds an extra blank line

### Added

- `tentap-demo`: 「拍 / 图」 on the main bar opens the camera or photo library and inserts via `ImageBridge.setImage` (data URI); a paragraph is added after the image so typing can continue
- TenTap: link URL is typed in the format bar (selection is snapshotted first, confirm wraps it; empty selection inserts linked text); in a code block the bar picks JS/TS/HTML/CSS/MD/plain
- TenTap: insert bar 「线」 inserts a horizontal rule and leaves the caret in the paragraph below; the rule stays 1px visually with a taller tap target, and vertical spacing matches the original 1.5rem
- TenTap: insert bar 「示」 inserts a callout; the bar switches info/tip/warning/danger; 「解」 unwraps
- TenTap: insert bar 「行 / 块」 types LaTeX in the format bar (block uses a taller multiline field); tap a formula to edit; 「流」 inserts Mermaid and shows a chart preview; native bar 「图 / 码」 switches preview and source

## 0.2.0

Personal-notes editor core: slash/callout/i18n, find-replace, dirty state, TOC, block drag handles, and host-facing helpers (template, word count, readonly, shortcut list).

### Added

- **Slash command** menu with default items; image/file upload hooks (`upload` / `onImageUpload`)
- **Callout** blocks (`info` / `tip` / `warning` / `danger`) via Slash
- **i18n** (`locale`: `zh-CN` | `en` | partial overrides); action labels via `getActionLabel` / shortcut `label`
- **Find & replace**: `setFindQuery` / `clearFind` / `findNext` / `findPrevious` / `replaceCurrent` / `replaceAll` (decoration highlights)
- **Dirty state**: `isDirty()` / `markClean()` (`setJSON` / `setHTML` / `setMarkdown` auto-mark clean)
- **TOC**: `getHeadings()` / `scrollToHeading(pos)` (runtime ids, not persisted)
- **Block drag handle**: top-level sibling reorder only; native drag disabled on math / code / Mermaid; custom drop indicator
- **`insertTemplate(content)`**: insert JSON fragment (or `doc.content`) at selection
- **Word count**: `getWordCount` / `getCharCount` / `getSelectedWordCount` (+ `getSelectedCharCount`)
- **Readonly**: `setEditable(false)` / `isEditable()`; hide caret, placeholder, drag handles (layout-stable)
- **`getShortcutList()`**: export bindings with i18n labels for host UI
- **Heading policy**: `document` / `chunk` / `free`; hide/block H1 in document/chunk
- Code-block language config, shared toolbars (code / Mermaid / block math)
- Demo page controls for template / readonly / shortcuts / stats

### Changed

- Slash scrollbar styling (cross-platform thin scrollbar)
- Drag-handle gutter: host left/right padding; handles sit in left padding via negative margin

### Fixed

- Block drag no longer nests into blockquote / callout
- Readonly toggle no longer shifts content (handles use `visibility: hidden`, not `display: none`)

## 0.1.0

### Added
- KaTeX math support via `@tiptap/extension-mathematics` (enabled by default; configurable via `math` option)
- Mermaid diagram support via `MermaidCodeBlock` NodeView (edit/preview toggle on blur/focus)
- Demo page sample content for math and Mermaid (`test/main.ts`)
- CNB CI pipeline (`.cnb.yml`)
- `headingPolicyUtils` and `tableUtils` exported from `core/index.ts`
- `EditorPlaceholderOptions` type exported from `core/index.ts`
- `createEditorPlaceholder` and `createTenTapSupplementalExtensions` re-exported from `web/index.ts`
- `onDestroy` lifecycle callback on `EditorCoreOptions`
- `@tiptap/react` added to peer dependencies
- `typecheck` script (`tsc --noEmit`)
- vitest test framework with unit and integration tests
- LICENSE file (MIT)

### Breaking Change
- `mount()` and `unmount()` on `EditorCore` now throw an error (TipTap v3 removed these APIs; pass `element` in constructor options instead)

### Changed
- (none)

### Fixed
- `./tentap/editor-html` export now guaranteed to exist after `npm publish` (added `editor:build` to `prepublishOnly`)
- Removed all `as any` type casts in bridge files

## 0.0.1

- Initial release: TipTap v3 editor core with Web, Electron & TenTap support
