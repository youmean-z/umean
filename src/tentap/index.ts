import type { EditorOptions } from '@tiptap/core';

import { createTenTapSupplementalExtensions } from '../core/extensions/defaultExtensions';
import type { DefaultExtensionsOptions } from '../core/types';

export interface TenTapTiptapOptions {
  extensions: EditorOptions['extensions'];
  editorProps?: EditorOptions['editorProps'];
  content?: EditorOptions['content'];
  contentType?: EditorOptions['contentType'];
}

/**
 * TenTap WebView 侧 TipTap 配置。
 * 基础格式与富媒体由 Bridge 提供；此处追加与 Web 对齐的补充扩展。
 * 默认不挂块拖拽手柄；需手柄时传 `blockDragHandle: {}`。
 */
export function createTenTapTiptapOptions(
  options: DefaultExtensionsOptions = {},
): TenTapTiptapOptions {
  return {
    extensions: createTenTapSupplementalExtensions({
      ...options,
      blockDragHandle: options.blockDragHandle ?? false,
    }),
    editorProps: {
      attributes: {
        spellcheck: 'false',
      },
    },
  };
}

export { createTenTapBridges, type TenTapBridgesOptions } from './createTenTapBridges';
export {
  TableBridge,
  TableEditorActionType,
} from './bridges/tableBridge';
export {
  ImageBridge,
  ImageEditorActionType,
} from './bridges/imageBridge';
export {
  HorizontalRuleBridge,
  HorizontalRuleEditorActionType,
} from './bridges/horizontalRuleBridge';
export {
  CalloutBridge,
  CalloutEditorActionType,
} from './bridges/calloutBridge';
export {
  MathBridge,
  MathEditorActionType,
} from './bridges/mathBridge';
export {
  LinkBridge,
  LinkEditorActionType,
} from './bridges/linkBridge';
export {
  CodeBlockBridge,
  CodeBlockEditorActionType,
  createCodeBlockBridge,
  type CreateCodeBlockBridgeOptions,
} from './bridges/codeBlockBridge';

export {
  createDefaultExtensions,
  createRichExtensions,
  createTenTapSupplementalExtensions,
  createHeadlessEditor,
  jsonToHTML,
  jsonToMarkdown,
  markdownToJSON,
  emptyDoc,
  MarkdownClipboard,
  Markdown,
  StarterKit,
} from '../core/index';

export type {
  DefaultExtensionsOptions,
  HeadingPolicyMode,
  HeadingPolicyOptions,
  RichExtensionsOptions,
  MathOptions,
  MermaidOptions,
  TransformOptions,
  CodeBlockLanguageDefinition,
  CodeBlockLanguageInput,
  Editor,
  JSONContent,
} from '../core/index';
