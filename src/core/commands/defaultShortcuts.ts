import type { EditorActionId } from './types';

/**
 * 笔记向默认快捷键（Mod = Cmd/Ctrl）。
 * 与 StarterKit 常见绑键对齐，并由更高 priority 的 KeyboardShortcuts 统一接管，便于覆盖/禁用。
 */
export const DEFAULT_SHORTCUT_BINDINGS: Record<string, EditorActionId> = {
  'Mod-b': 'toggleBold',
  'Mod-i': 'toggleItalic',
  'Mod-Shift-s': 'toggleStrike',
  'Mod-e': 'toggleCode',
  'Mod-Shift-h': 'toggleHighlight',
  'Mod-Alt-0': 'setParagraph',
  'Mod-Alt-1': 'toggleHeading1',
  'Mod-Alt-2': 'toggleHeading2',
  'Mod-Alt-3': 'toggleHeading3',
  'Mod-Alt-4': 'toggleHeading4',
  'Mod-Alt-5': 'toggleHeading5',
  'Mod-Alt-6': 'toggleHeading6',
  'Mod-Shift-7': 'toggleOrderedList',
  'Mod-Shift-8': 'toggleBulletList',
  'Mod-Shift-9': 'toggleTaskList',
  'Mod-Shift-b': 'toggleBlockquote',
  'Mod-Alt-c': 'toggleCodeBlock',
  'Mod-Alt-t': 'insertTable',
  'Mod-m': 'insertInlineMath',
  'Mod-Shift-m': 'insertBlockMath',
};

export function resolveShortcutBindings(
  options: {
    defaults?: boolean;
    bindings?: Record<string, import('./types').KeyboardShortcutBinding>;
  } = {},
): Record<string, import('./types').KeyboardShortcutBinding> {
  const merged: Record<string, import('./types').KeyboardShortcutBinding> = {};

  if (options.defaults !== false) {
    Object.assign(merged, DEFAULT_SHORTCUT_BINDINGS);
  }

  if (options.bindings) {
    Object.assign(merged, options.bindings);
  }

  return merged;
}
