import type { Editor } from '@tiptap/core';

/**
 * 稳定命令 ID，供工具栏 / Slash / 快捷键共用。
 * Slash 菜单下一项会直接复用这些名称。
 */
export const EDITOR_ACTION_IDS = [
  'undo',
  'redo',
  'toggleBold',
  'toggleItalic',
  'toggleStrike',
  'toggleCode',
  'toggleHighlight',
  'setParagraph',
  'toggleHeading1',
  'toggleHeading2',
  'toggleHeading3',
  'toggleHeading4',
  'toggleHeading5',
  'toggleHeading6',
  'toggleBulletList',
  'toggleOrderedList',
  'toggleTaskList',
  'toggleBlockquote',
  'insertCallout',
  'toggleCodeBlock',
  'setHorizontalRule',
  'insertTable',
  'insertImage',
  'insertInlineMath',
  'insertBlockMath',
  'setLink',
  'unsetLink',
  'exitLink',
] as const;

export type EditorActionId = (typeof EDITOR_ACTION_IDS)[number];

export type EditorActionPayloadMap = {
  insertTable?: { rows?: number; cols?: number; withHeaderRow?: boolean };
  insertImage?: { src: string; alt?: string; title?: string };
  insertInlineMath?: { latex?: string };
  insertBlockMath?: { latex?: string };
  setLink?: {
    href: string;
    target?: string | null;
    rel?: string | null;
    class?: string | null;
  };
  insertCallout?: { type?: 'info' | 'tip' | 'warning' | 'danger' };
};

export type EditorActionPayload<A extends EditorActionId = EditorActionId> =
  A extends keyof EditorActionPayloadMap
    ? EditorActionPayloadMap[A]
    : undefined;

export type KeyboardShortcutHandler = (ctx: { editor: Editor }) => boolean;

/**
 * 快捷键绑定值：
 * - 命令 ID：执行标准动作
 * - `false`：禁用该键（吞掉事件，避免落到 StarterKit 等同键）
 * - 函数：宿主自定义（如打开链接面板）
 */
export type KeyboardShortcutBinding =
  | EditorActionId
  | false
  | KeyboardShortcutHandler;

export interface KeyboardShortcutsOptions {
  /** 是否启用默认快捷键表，默认 true */
  defaults?: boolean;
  /**
   * 覆盖/追加绑定。键名与 TipTap 一致，如 `Mod-b`、`Mod-Shift-8`、`Mod-Alt-1`。
   */
  bindings?: Record<string, KeyboardShortcutBinding>;
}
