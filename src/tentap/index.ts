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
 */
export function createTenTapTiptapOptions(
  options: DefaultExtensionsOptions = {},
): TenTapTiptapOptions {
  return {
    extensions: createTenTapSupplementalExtensions(options),
    editorProps: {
      attributes: {
        spellcheck: 'false',
      },
    },
  };
}

export { createTenTapBridges, type TenTapBridgesOptions } from './createTenTapBridges';
export { TableBridge, TableEditorActionType } from './bridges/tableBridge';
export { CodeBlockBridge, CodeBlockEditorActionType } from './bridges/codeBlockBridge';

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
  Editor,
  JSONContent,
} from '../core/index';
