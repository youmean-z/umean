import type { AnyExtension } from '@tiptap/core';
import { Markdown } from '@tiptap/markdown';

import { MarkdownClipboard } from '../core/extensions/markdownClipboard';
import type { DefaultExtensionsOptions } from '../core/types';
import { createTenTapBridges } from './createTenTapBridges';

export interface TenTapTiptapOptions {
  extensions: AnyExtension[];
}

/**
 * TenTap WebView 侧扩展：Markdown + 剪贴板。
 * Image / TaskList 由 TenTapStartKit Bridge 提供，Table / CodeBlock 由自定义 Bridge 提供。
 */
export function createTenTapTiptapOptions(
  options: Pick<DefaultExtensionsOptions, 'markdown'> = {},
): TenTapTiptapOptions {
  const extensions: AnyExtension[] = [];

  extensions.push(
    options.markdown ? Markdown.configure(options.markdown) : Markdown,
    MarkdownClipboard,
  );

  return { extensions };
}

export { createTenTapBridges } from './createTenTapBridges';
export { TableBridge, TableEditorActionType } from './bridges/tableBridge';
export { CodeBlockBridge, CodeBlockEditorActionType } from './bridges/codeBlockBridge';

export {
  createDefaultExtensions,
  createRichExtensions,
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
  RichExtensionsOptions,
  TransformOptions,
  Editor,
  JSONContent,
} from '../core/index';
