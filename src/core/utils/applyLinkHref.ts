import type { Editor } from '@tiptap/core';

import { exitLinkStoredMark } from '../extensions/linkExit';

export type LinkApplyRange = { from: number; to: number };

/** 空串表示去掉链接；无协议时补 https:// */
export function normalizeLinkHref(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  if (
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function restoreRange(editor: Editor, range?: LinkApplyRange | null): void {
  if (!range || range.from < 0 || range.to < range.from) {
    return;
  }

  const size = editor.state.doc.content.size;
  const from = Math.min(range.from, size);
  const to = Math.min(range.to, size);
  if (to < from) {
    return;
  }

  if (to === from) {
    editor.commands.setTextSelection(from);
    return;
  }

  editor.commands.setTextSelection({ from, to });
}

function leaveLinkTyping(editor: Editor): void {
  editor.commands.setTextSelection(editor.state.selection.to);
  const tr = exitLinkStoredMark(editor.state);
  if (tr) {
    editor.view.dispatch(tr);
  }
}

/**
 * 有选区（含传入的 `range`）则给选区加链接；无选区才插入 URL 文本。
 * `raw` 为空则取消当前链接。加完把光标放到链后，后续输入不再带链。
 */
export function applyLinkHref(
  editor: Editor,
  raw: string,
  range?: LinkApplyRange | null,
): boolean {
  restoreRange(editor, range);

  const href = normalizeLinkHref(raw);
  if (!href) {
    const unset = editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .run();
    if (unset) {
      leaveLinkTyping(editor);
    }
    return unset;
  }

  if (!editor.state.selection.empty || editor.isActive('link')) {
    const wrapped = editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href })
      .run();
    if (wrapped) {
      leaveLinkTyping(editor);
    }
    return wrapped;
  }

  const inserted = editor
    .chain()
    .focus()
    .insertContent({
      type: 'text',
      text: href,
      marks: [{ type: 'link', attrs: { href } }],
    })
    .run();
  if (inserted) {
    leaveLinkTyping(editor);
  }
  return inserted;
}
