export { createDefaultExtensions } from './extensions/defaultExtensions.js';
export { MarkdownClipboard } from './extensions/markdownClipboard.js';
export {
  createHeadlessEditor,
  jsonToHTML,
  jsonToMarkdown,
  markdownToJSON,
} from './utils/transform.js';

export { emptyDoc, type DefaultExtensionsOptions, type TransformOptions } from './types.js';

export { Markdown } from '@tiptap/markdown';
export { default as StarterKit } from '@tiptap/starter-kit';
export type { Editor, JSONContent } from '@tiptap/core';
