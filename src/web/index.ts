export { EditorCore } from './EditorCore.js';
export { createEditor } from './createEditor.js';
export type { EditorCoreOptions, EditorUpdatePayload } from './types.js';

export {
  createDefaultExtensions,
  createHeadlessEditor,
  jsonToHTML,
  jsonToMarkdown,
  markdownToJSON,
  emptyDoc,
  MarkdownClipboard,
  Markdown,
  StarterKit,
} from '../core/index.js';

export type {
  DefaultExtensionsOptions,
  TransformOptions,
  Editor,
  JSONContent,
} from '../core/index.js';
