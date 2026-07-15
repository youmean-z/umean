import type { Editor, EditorOptions, JSONContent } from '@tiptap/core';

import type {
  EditorActionId,
  EditorActionPayload,
  KeyboardShortcutsOptions,
} from '../core/commands/types';
import type { DefaultExtensionsOptions } from '../core/types';

export interface EditorUpdatePayload {
  editor: Editor;
  json: JSONContent;
  html: string;
  markdown: string;
}

export interface EditorSelectionPayload {
  editor: Editor;
  from: number;
  to: number;
  empty: boolean;
  isActive: (action: EditorActionId) => boolean;
  can: <A extends EditorActionId>(
    action: A,
    payload?: EditorActionPayload<A>,
  ) => boolean;
}

export type EditorCoreOptions = Partial<
  Omit<
    EditorOptions,
    'extensions' | 'content' | 'contentType' | 'onUpdate' | 'onSelectionUpdate'
  >
> & {
  /** 初始内容，默认按 JSON 解析 */
  content?: JSONContent | string;
  /** 内容格式，默认 json */
  contentType?: 'json' | 'markdown' | 'html';
  /** 完全自定义扩展列表，传入后将忽略 extensionOptions */
  extensions?: EditorOptions['extensions'];
  /** 默认扩展配置（StarterKit + Markdown） */
  extensionOptions?: DefaultExtensionsOptions;
  /**
   * 快捷键自定义（与 `extensionOptions.shortcuts` 合并；顶层优先）。
   * `false` 关闭 umean 统一快捷键表。
   */
  shortcuts?: KeyboardShortcutsOptions | false;
  /** 内容变更回调 */
  onUpdate?: (payload: EditorUpdatePayload) => void;
  /** 选区变更回调（工具栏 / Bubble 可用） */
  onSelectionUpdate?: (payload: EditorSelectionPayload) => void;
  /** 编辑器销毁回调 */
  onDestroy?: () => void;
};
