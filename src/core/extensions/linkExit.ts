import { Extension } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';
import type { MarkType } from '@tiptap/pm/model';

function getLinkType(state: EditorState): MarkType | null {
  return state.schema.marks.link ?? null;
}

/** 空选区且位于链接标记的末尾（下一段文本不再带同一 href 的 link）。 */
export function isAtEndOfLink(state: EditorState): boolean {
  const { empty, $from } = state.selection;
  if (!empty) {
    return false;
  }

  const linkType = getLinkType(state);
  if (!linkType || !linkType.isInSet($from.marks())) {
    return false;
  }

  const nodeAfter = $from.nodeAfter;
  if (!nodeAfter) {
    return true;
  }

  return !linkType.isInSet(nodeAfter.marks);
}

/**
 * 退出链接输入态：清除 stored mark，后续输入不再带链。
 * 不删除已有链接文字（与 `unsetLink` / `extendEmptyMarkRange` 相对）。
 */
export function exitLinkStoredMark(state: EditorState): EditorState['tr'] | null {
  const linkType = getLinkType(state);
  if (!linkType) {
    return null;
  }

  const { empty } = state.selection;
  if (!empty) {
    return null;
  }

  const hasStored =
    state.storedMarks != null
      ? linkType.isInSet(state.storedMarks)
      : linkType.isInSet(state.selection.$from.marks());

  if (!hasStored) {
    return null;
  }

  return state.tr.removeStoredMark(linkType).setMeta('preventAutolink', true);
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    linkExit: {
      /**
       * 退出链接输入态：不拆已有链接，仅让后续键入变为普通文本。
       * 在链接末尾或不想继续延长链接时使用。
       */
      exitLink: () => ReturnType;
    };
  }
}

/**
 * 链末退出：在链接末尾按 ArrowRight 清除 link stored mark，
 * 解决 inclusive（autolink）链接改完名称后继续键入仍带链的问题。
 */
export const LinkExit = Extension.create({
  name: 'linkExit',

  addCommands() {
    return {
      exitLink:
        () =>
        ({ state, dispatch }) => {
          const tr = exitLinkStoredMark(state);
          if (!tr) {
            return false;
          }
          if (dispatch) {
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      ArrowRight: ({ editor }) => {
        if (!isAtEndOfLink(editor.state)) {
          return false;
        }
        // 先清 stored mark；返回 false 让默认 ArrowRight 继续移动光标（若还能移）
        editor.commands.exitLink();
        return false;
      },
    };
  },
});
