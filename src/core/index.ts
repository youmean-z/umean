export { createDefaultExtensions, createRichExtensions, createTenTapSupplementalExtensions } from './extensions/defaultExtensions';
export { createEditorPlaceholder, type EditorPlaceholderOptions } from './extensions/editorPlaceholder';
export {
  BlockMathNodeViewExtension,
  BlockMathWithNodeView,
  type BlockMathNodeViewOptions,
} from './extensions/blockMathNodeView';
export { HeadingPolicy } from './extensions/headingPolicy';
export { InlineMathUnwrap, inlineMathToEditableText } from './extensions/inlineMathUnwrap';
export { MarkdownClipboard } from './extensions/markdownClipboard';
export {
  CodeBlockToolbar,
  type CodeBlockToolbarOptions,
} from './extensions/codeBlockNodeView';
export { MermaidCodeBlock, type MermaidCodeBlockOptions } from './extensions/mermaidCodeBlock';
export { TableAlignShortcut } from './extensions/tableAlignShortcut';
export { TableShortcut } from './extensions/tableShortcut';
export {
  applyHeadingPolicy,
  createDocumentDoc,
  createEmptyParagraphDoc,
  isEmptyDocContent,
  type ApplyHeadingPolicyOptions,
} from './utils/headingPolicyUtils';
export {
  parseAlignSuffix,
  applyAlignToTable,
  findCellAtPos,
  type TableAlign,
} from './utils/tableUtils';
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
  type MathOptions,
  type MermaidOptions,
  type RichExtensionsOptions,
  type TransformOptions,
} from './types';

export { Markdown } from '@tiptap/markdown';
export { default as StarterKit } from '@tiptap/starter-kit';
export type { Editor, JSONContent } from '@tiptap/core';
