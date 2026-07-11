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
  HeadingPolicy,
  MarkdownClipboard,
  TableAlignShortcut,
  TableShortcut,
  Markdown,
  StarterKit,
} from '../core/index';

export type {
  DefaultExtensionsOptions,
  HeadingPolicyMode,
  HeadingPolicyOptions,
  RichExtensionsOptions,
  TransformOptions,
  Editor,
  JSONContent,
} from '../core/index';
