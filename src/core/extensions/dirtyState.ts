import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { Plugin, PluginKey, type Transaction } from '@tiptap/pm/state';

export interface DirtyStatePluginState {
  dirty: boolean;
}

export type DirtyStateMeta =
  | { type: 'markClean' }
  | { type: 'markDirty' }
  /** 本次 transaction 的 docChanged 不计入脏（如 headingPolicy 自动修正） */
  | { type: 'ignore' };

export interface DirtyStateOptions {
  /** 预留；当前无额外配置 */
}

export const dirtyStatePluginKey = new PluginKey<DirtyStatePluginState>(
  'umeanDirtyState',
);

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dirtyState: {
      /** 标记为已保存/干净 */
      markClean: () => ReturnType;
      /** 手动标脏（少用；通常由编辑自动触发） */
      markDirty: () => ReturnType;
    };
  }
}

export function getDirtyState(editor: Editor): boolean {
  return dirtyStatePluginKey.getState(editor.state)?.dirty ?? false;
}

/** 给 programmatic transaction 挂上，避免误标脏 */
export function skipDirtyTracking(tr: Transaction): Transaction {
  return tr.setMeta(dirtyStatePluginKey, {
    type: 'ignore',
  } satisfies DirtyStateMeta);
}

/**
 * 脏状态追踪。
 *
 * 约定：
 * - 用户编辑导致 `docChanged` → dirty
 * - `markClean()` 重置（宿主保存成功 / setContent 后应调用）
 * - meta `ignore`：本次变更不改 dirty（headingPolicy 自动修正使用）
 */
export const DirtyState = Extension.create<DirtyStateOptions>({
  name: 'umeanDirtyState',

  addOptions() {
    return {};
  },

  addCommands() {
    return {
      markClean:
        () =>
        ({ state, dispatch }) => {
          if (!dispatch) {
            return true;
          }
          dispatch(
            state.tr.setMeta(dirtyStatePluginKey, {
              type: 'markClean',
            } satisfies DirtyStateMeta),
          );
          return true;
        },
      markDirty:
        () =>
        ({ state, dispatch }) => {
          if (!dispatch) {
            return true;
          }
          dispatch(
            state.tr.setMeta(dirtyStatePluginKey, {
              type: 'markDirty',
            } satisfies DirtyStateMeta),
          );
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<DirtyStatePluginState>({
        key: dirtyStatePluginKey,
        state: {
          init: () => ({ dirty: false }),
          apply(tr, value) {
            const meta = tr.getMeta(dirtyStatePluginKey) as
              | DirtyStateMeta
              | undefined;

            if (meta?.type === 'markClean') {
              return { dirty: false };
            }
            if (meta?.type === 'markDirty') {
              return { dirty: true };
            }
            if (meta?.type === 'ignore') {
              return value;
            }
            if (tr.docChanged) {
              return { dirty: true };
            }
            return value;
          },
        },
      }),
    ];
  },
});
