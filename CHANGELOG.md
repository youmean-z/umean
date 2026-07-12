# Changelog

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
