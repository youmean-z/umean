export { createDefaultExtensions, createRichExtensions } from './extensions/defaultExtensions';
export { MarkdownClipboard } from './extensions/markdownClipboard';
export {
  createHeadlessEditor,
  jsonToHTML,
  jsonToMarkdown,
  markdownToJSON,
} from './utils/transform';
export { getSharedLowlight } from './utils/lowlight';

export {
  emptyDoc,
  demoDoc,
  type DefaultExtensionsOptions,
  type RichExtensionsOptions,
  type TransformOptions,
} from './types';

export { Markdown } from '@tiptap/markdown';
export { default as StarterKit } from '@tiptap/starter-kit';
export type { Editor, JSONContent } from '@tiptap/core';
