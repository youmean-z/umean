export { createDefaultExtensions, createRichExtensions, createTenTapSupplementalExtensions } from './extensions/defaultExtensions';
export { createEditorPlaceholder } from './extensions/editorPlaceholder';
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
  DEFAULT_PLACEHOLDER_CONTENT,
  DEFAULT_PLACEHOLDER_TITLE,
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
