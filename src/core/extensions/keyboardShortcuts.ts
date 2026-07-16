import { Extension, type Editor } from '@tiptap/core';

import { resolveShortcutBindings } from '../commands/defaultShortcuts';
import { runEditorAction } from '../commands/runAction';
import type {
  EditorActionId,
  KeyboardShortcutBinding,
  KeyboardShortcutsOptions,
} from '../commands/types';
import { isHeading1ToggleAllowed } from '../utils/headingPolicyUtils';

function isActionId(value: KeyboardShortcutBinding): value is EditorActionId {
  return typeof value === 'string';
}

function buildShortcutMap(
  editor: Editor,
  bindings: Record<string, KeyboardShortcutBinding>,
): Record<string, () => boolean> {
  const map: Record<string, () => boolean> = {};

  for (const [keys, binding] of Object.entries(bindings)) {
    if (binding === false) {
      map[keys] = () => true;
      continue;
    }

    if (typeof binding === 'function') {
      const handler = binding;
      map[keys] = () => handler({ editor });
      continue;
    }

    if (isActionId(binding)) {
      const action = binding;
      map[keys] = () => {
        // document/chunk：吞掉 H1 快捷键，避免回落到 StarterKit 仍可切一级标题
        if (action === 'toggleHeading1' && !isHeading1ToggleAllowed(editor)) {
          return true;
        }
        return runEditorAction(editor, action);
      };
    }
  }

  return map;
}

/**
 * 统一快捷键入口：默认表 + 宿主覆盖。
 * priority 高于 StarterKit，便于禁用/改键而不与内置绑键打架。
 */
export const KeyboardShortcuts = Extension.create<KeyboardShortcutsOptions>({
  name: 'umeanKeyboardShortcuts',
  priority: 150,

  addOptions() {
    return {
      defaults: true,
      bindings: {},
    };
  },

  addKeyboardShortcuts() {
    const bindings = resolveShortcutBindings({
      defaults: this.options.defaults,
      bindings: this.options.bindings,
    });

    return buildShortcutMap(this.editor, bindings);
  },
});
