export { EditorCore } from './EditorCore';
export { createEditor } from './createEditor';
export type { EditorCoreOptions, EditorUpdatePayload } from './types';

export {
  createDefaultExtensions,
  createRichExtensions,
  createHeadlessEditor,
  jsonToHTML,
  jsonToMarkdown,
  markdownToJSON,
  emptyDoc,
  demoDoc,
  MarkdownClipboard,
  Markdown,
  StarterKit,
} from '../core/index';

export type {
  DefaultExtensionsOptions,
  RichExtensionsOptions,
  TransformOptions,
  Editor,
  JSONContent,
} from '../core/index';
