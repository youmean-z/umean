export { createDefaultExtensions, createRichExtensions, createTenTapSupplementalExtensions } from './extensions/defaultExtensions';
export { createEditorPlaceholder, type EditorPlaceholderOptions } from './extensions/editorPlaceholder';
export {
  BlockMathNodeViewExtension,
  BlockMathWithNodeView,
  type BlockMathNodeViewOptions,
} from './extensions/blockMathNodeView';
export { HeadingPolicy } from './extensions/headingPolicy';
export {
  BlockDragHandle,
  blockDragHandlePluginKey,
  moveTopLevelBlock,
  resolveTopLevelDropPos,
  type BlockDragHandleOptions,
  type BlockDragHandlePluginState,
} from './extensions/blockDragHandle';
export {
  DirtyState,
  dirtyStatePluginKey,
  getDirtyState,
  skipDirtyTracking,
  type DirtyStateOptions,
  type DirtyStatePluginState,
  type DirtyStateMeta,
} from './extensions/dirtyState';
export {
  FindReplace,
  findReplacePluginKey,
  getFindReplaceState,
  collectFindMatches,
  type FindMatch,
  type FindReplacePluginState,
  type FindReplaceOptions,
  type SetFindQueryOptions,
} from './extensions/findReplace';
export {
  collectFlatHeadings,
  buildHeadingTree,
  getHeadings,
  scrollToHeading,
  type HeadingItem,
  type FlatHeading,
} from './utils/headings';
export {
  ZH_CN,
  EN,
  resolveMessages,
  type UmeanMessages,
} from './i18n';
export {
  Callout,
  CALLOUT_TYPES,
  CALLOUT_TYPE_LABELS,
  type CalloutType,
  type CalloutOptions,
} from './extensions/callout';
export {
  LinkExit,
  exitLinkStoredMark,
  isAtEndOfLink,
} from './extensions/linkExit';
export { InlineMathUnwrap, inlineMathToEditableText } from './extensions/inlineMathUnwrap';
export { MarkdownClipboard } from './extensions/markdownClipboard';
export {
  CodeBlockToolbar,
  CodeBlockEnter,
  createCodeBlockEnterPlugin,
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
  getEditorHeadingPolicyMode,
  isHeading1ToggleAllowed,
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
export { getSharedLowlight, createCodeBlockLowlight } from './utils/lowlight';
export {
  DEFAULT_CODE_BLOCK_LANGUAGES,
  resolveCodeBlockLanguageConfig,
  resolveCodeBlockLanguageId,
  findResolvedCodeBlockLanguage,
  type CodeBlockLanguageDefinition,
  type CodeBlockLanguageInput,
  type CodeBlockLanguageConfig,
  type ResolvedCodeBlockLanguage,
} from './utils/codeBlockLanguages';
export {
  DEFAULT_LINK_OPTIONS,
  resolveStarterKitLink,
} from './utils/linkDefaults';
export {
  EDITOR_ACTION_IDS,
  type EditorActionId,
  type EditorActionPayload,
  type EditorActionPayloadMap,
  type KeyboardShortcutBinding,
  type KeyboardShortcutHandler,
  type KeyboardShortcutsOptions,
} from './commands/types';
export {
  DEFAULT_SHORTCUT_BINDINGS,
  resolveShortcutBindings,
} from './commands/defaultShortcuts';
export {
  runEditorAction,
  canRunEditorAction,
  isEditorActionActive,
} from './commands/runAction';
export { KeyboardShortcuts } from './extensions/keyboardShortcuts';
export { MediaUpload } from './extensions/mediaUpload';
export {
  pickLocalFile,
  isImageFile,
  collectFilesFromDataTransfer,
  normalizeImageUploadResult,
  normalizeFileUploadResult,
  type UploadSource,
  type UploadContext,
  type ImageUploadResult,
  type FileUploadResult,
  type MediaUploadOptions,
} from './media/uploadTypes';
export { resolveSlashOptions } from './media/resolveSlashUpload';
export {
  computeFloatingMenuPosition,
  positionFloatingMenu,
} from './utils/floatingMenuPosition';
export {
  SlashCommand,
  slashPluginKey,
  findSlashMatch,
  computeSlashMenuPosition,
} from './extensions/slashCommand';
export {
  DEFAULT_SLASH_ITEMS,
  buildDefaultSlashItems,
  getDefaultSlashItems,
  resolveSlashItems,
  filterSlashItems,
} from './commands/slashItems';
export type {
  SlashItem,
  SlashItemGroup,
  SlashMatch,
  SlashState,
  SlashRequestContext,
  SlashCommandOptions,
} from './commands/slashTypes';

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
