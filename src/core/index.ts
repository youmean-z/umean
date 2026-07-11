export { createDefaultExtensions, createRichExtensions } from './extensions/defaultExtensions';
export { HeadingPolicy } from './extensions/headingPolicy';
export { MarkdownClipboard } from './extensions/markdownClipboard';
export { TableAlignShortcut } from './extensions/tableAlignShortcut';
export { TableShortcut } from './extensions/tableShortcut';
export {
  createHeadlessEditor,
  jsonToHTML,
  jsonToMarkdown,
  markdownToJSON,
} from './utils/transform';
export { getSharedLowlight } from './utils/lowlight';

export {
  emptyDoc,
  type DefaultExtensionsOptions,
  type HeadingPolicyMode,
  type HeadingPolicyOptions,
  type RichExtensionsOptions,
  type TransformOptions,
} from './types';

export { Markdown } from '@tiptap/markdown';
export { default as StarterKit } from '@tiptap/starter-kit';
export type { Editor, JSONContent } from '@tiptap/core';
