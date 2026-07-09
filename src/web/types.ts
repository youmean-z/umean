import type { Editor, EditorOptions, JSONContent } from '@tiptap/core';

import type { DefaultExtensionsOptions } from '../core/types.js';

export interface EditorUpdatePayload {
  editor: Editor;
  json: JSONContent;
  html: string;
  markdown: string;
}

export type EditorCoreOptions = Partial<
  Omit<EditorOptions, 'extensions' | 'content' | 'contentType' | 'onUpdate'>
> & {
  /** 初始内容，默认按 JSON 解析 */
  content?: JSONContent | string;
  /** 内容格式，默认 json */
  contentType?: 'json' | 'markdown' | 'html';
  /** 完全自定义扩展列表，传入后将忽略 extensionOptions */
  extensions?: EditorOptions['extensions'];
  /** 默认扩展配置（StarterKit + Markdown） */
  extensionOptions?: DefaultExtensionsOptions;
  /** 内容变更回调 */
  onUpdate?: (payload: EditorUpdatePayload) => void;
};
