import type { Editor } from '@tiptap/core';
import type { ChainedCommands } from '@tiptap/core';

import type {
  EditorActionId,
  EditorActionPayload,
  EditorActionPayloadMap,
} from './types';

type AnyPayload = EditorActionPayloadMap[keyof EditorActionPayloadMap];

// ---- Action definition table ------------------------------------------------

interface ActionDef {
  run: (chain: ChainedCommands, payload?: AnyPayload) => ChainedCommands;
  can: (editor: Editor, payload?: AnyPayload) => boolean;
  /** 标记名或节点名，用于 isActive；`null` 表示恒为 false */
  activeCheck: string | null;
  /** activeCheck 的 attrs 参数 */
  activeAttrs?: Record<string, unknown>;
}

const ACTIONS: Record<EditorActionId, ActionDef> = {
  undo: {
    run: (c) => c.undo(),
    can: (e) => e.can().undo(),
    activeCheck: null,
  },
  redo: {
    run: (c) => c.redo(),
    can: (e) => e.can().redo(),
    activeCheck: null,
  },
  toggleBold: {
    run: (c) => c.toggleBold(),
    can: (e) => e.can().toggleBold(),
    activeCheck: 'bold',
  },
  toggleItalic: {
    run: (c) => c.toggleItalic(),
    can: (e) => e.can().toggleItalic(),
    activeCheck: 'italic',
  },
  toggleStrike: {
    run: (c) => c.toggleStrike(),
    can: (e) => e.can().toggleStrike(),
    activeCheck: 'strike',
  },
  toggleCode: {
    run: (c) => c.toggleCode(),
    can: (e) => e.can().toggleCode(),
    activeCheck: 'code',
  },
  toggleHighlight: {
    run: (c) => c.toggleHighlight(),
    can: (e) => e.can().toggleHighlight(),
    activeCheck: 'highlight',
  },
  setParagraph: {
    run: (c) => c.setParagraph(),
    can: (e) => e.can().setParagraph(),
    activeCheck: 'paragraph',
  },
  toggleHeading1: {
    run: (c) => c.toggleHeading({ level: 1 }),
    can: (e) => e.can().toggleHeading({ level: 1 }),
    activeCheck: 'heading',
    activeAttrs: { level: 1 },
  },
  toggleHeading2: {
    run: (c) => c.toggleHeading({ level: 2 }),
    can: (e) => e.can().toggleHeading({ level: 2 }),
    activeCheck: 'heading',
    activeAttrs: { level: 2 },
  },
  toggleHeading3: {
    run: (c) => c.toggleHeading({ level: 3 }),
    can: (e) => e.can().toggleHeading({ level: 3 }),
    activeCheck: 'heading',
    activeAttrs: { level: 3 },
  },
  toggleHeading4: {
    run: (c) => c.toggleHeading({ level: 4 }),
    can: (e) => e.can().toggleHeading({ level: 4 }),
    activeCheck: 'heading',
    activeAttrs: { level: 4 },
  },
  toggleHeading5: {
    run: (c) => c.toggleHeading({ level: 5 }),
    can: (e) => e.can().toggleHeading({ level: 5 }),
    activeCheck: 'heading',
    activeAttrs: { level: 5 },
  },
  toggleHeading6: {
    run: (c) => c.toggleHeading({ level: 6 }),
    can: (e) => e.can().toggleHeading({ level: 6 }),
    activeCheck: 'heading',
    activeAttrs: { level: 6 },
  },
  toggleBulletList: {
    run: (c) => c.toggleBulletList(),
    can: (e) => e.can().toggleBulletList(),
    activeCheck: 'bulletList',
  },
  toggleOrderedList: {
    run: (c) => c.toggleOrderedList(),
    can: (e) => e.can().toggleOrderedList(),
    activeCheck: 'orderedList',
  },
  toggleTaskList: {
    run: (c) => c.toggleTaskList(),
    can: (e) => e.can().toggleTaskList(),
    activeCheck: 'taskList',
  },
  toggleBlockquote: {
    run: (c) => c.toggleBlockquote(),
    can: (e) => e.can().toggleBlockquote(),
    activeCheck: 'blockquote',
  },
  insertCallout: {
    run: (c, p) => {
      const callout = p as EditorActionPayloadMap['insertCallout'] | undefined;
      return c.insertContent({
        type: 'callout',
        attrs: { type: callout?.type ?? 'info' },
        content: [{ type: 'paragraph' }],
      });
    },
    can: (e, p) => {
      const callout = p as EditorActionPayloadMap['insertCallout'] | undefined;
      return e.can().insertContent({
        type: 'callout',
        attrs: { type: callout?.type ?? 'info' },
        content: [{ type: 'paragraph' }],
      });
    },
    activeCheck: 'callout',
  },
  toggleCodeBlock: {
    run: (c) => c.toggleCodeBlock(),
    can: (e) => e.can().toggleCodeBlock(),
    activeCheck: 'codeBlock',
  },
  setHorizontalRule: {
    run: (c) => c.setHorizontalRule(),
    can: (e) => e.can().setHorizontalRule(),
    activeCheck: null,
  },
  insertTable: {
    run: (c, p) => {
      const table = p as EditorActionPayloadMap['insertTable'] | undefined;
      return c.insertTable({
        rows: table?.rows ?? 3,
        cols: table?.cols ?? 3,
        withHeaderRow: table?.withHeaderRow ?? true,
      });
    },
    can: (e, p) => {
      const table = p as EditorActionPayloadMap['insertTable'] | undefined;
      return e.can().insertTable({
        rows: table?.rows ?? 3,
        cols: table?.cols ?? 3,
        withHeaderRow: table?.withHeaderRow ?? true,
      });
    },
    activeCheck: null,
  },
  insertImage: {
    run: (c, p) => {
      const image = p as EditorActionPayloadMap['insertImage'] | undefined;
      return c.setImage(image!);
    },
    can: (_e, p) => {
      const image = p as EditorActionPayloadMap['insertImage'] | undefined;
      return !!image?.src;
    },
    activeCheck: null,
  },
  insertInlineMath: {
    run: (c, p) => {
      const math = p as EditorActionPayloadMap['insertInlineMath'] | undefined;
      return c.insertInlineMath({ latex: math?.latex ?? '' });
    },
    can: (e, p) => {
      const math = p as EditorActionPayloadMap['insertInlineMath'] | undefined;
      return e.can().insertInlineMath({ latex: math?.latex ?? '' });
    },
    activeCheck: null,
  },
  insertBlockMath: {
    run: (c, p) => {
      const math = p as EditorActionPayloadMap['insertBlockMath'] | undefined;
      return c.insertBlockMath({ latex: math?.latex ?? '' });
    },
    can: (e, p) => {
      const math = p as EditorActionPayloadMap['insertBlockMath'] | undefined;
      return e.can().insertBlockMath({ latex: math?.latex ?? '' });
    },
    activeCheck: null,
  },
  setLink: {
    run: (c, p) => {
      const link = p as EditorActionPayloadMap['setLink'] | undefined;
      return c.extendMarkRange('link').setLink(link!);
    },
    can: (_e, p) => {
      const link = p as EditorActionPayloadMap['setLink'] | undefined;
      return !!link?.href;
    },
    activeCheck: 'link',
  },
  unsetLink: {
    run: (c) => c.extendMarkRange('link').unsetLink(),
    can: (e) => e.can().unsetLink(),
    activeCheck: 'link',
  },
  exitLink: {
    run: (c) => c.exitLink(),
    can: (e) => e.can().exitLink(),
    activeCheck: 'link',
  },
};

// ---- Public API ------------------------------------------------------------

function chain(editor: Editor): ChainedCommands {
  return editor.chain().focus();
}

/**
 * 执行标准动作。payload 仅部分动作需要（如 insertImage / setLink）。
 * 返回 false 表示当前 schema/选区不可用或参数不足。
 */
export function runEditorAction(
  editor: Editor,
  action: EditorActionId,
  payload?: AnyPayload,
): boolean {
  const def = ACTIONS[action];
  if (!def) {
    return false;
  }

  if (!def.can(editor, payload)) {
    return false;
  }

  return def.run(chain(editor), payload).run();
}

/** 当前是否可执行该动作（不落盘）。 */
export function canRunEditorAction(
  editor: Editor,
  action: EditorActionId,
  payload?: AnyPayload,
): boolean {
  const def = ACTIONS[action];
  if (!def) {
    return false;
  }

  return def.can(editor, payload);
}

/** 该动作对应标记/节点当前是否激活（插入类动作恒为 false）。 */
export function isEditorActionActive(
  editor: Editor,
  action: EditorActionId,
): boolean {
  const def = ACTIONS[action];
  if (!def?.activeCheck) {
    return false;
  }

  return editor.isActive(def.activeCheck, def.activeAttrs ?? {});
}

export function runEditorActionTyped<A extends EditorActionId>(
  editor: Editor,
  action: A,
  payload?: EditorActionPayload<A>,
): boolean {
  return runEditorAction(editor, action, payload as AnyPayload);
}
