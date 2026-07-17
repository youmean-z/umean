# Changelog

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
