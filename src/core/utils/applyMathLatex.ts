import type { Editor } from '@tiptap/core';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';

import { placeCaretAfterBlock } from './placeCaretAfterBlock';

export type MathKind = 'inline' | 'block';
export type MathApplyRange = { from: number; to: number };

function clampRange(
  docSize: number,
  range?: MathApplyRange | null,
): MathApplyRange | null {
  if (!range || range.from < 0 || range.to < range.from) {
    return null;
  }

  const from = Math.min(range.from, docSize);
  const to = Math.min(range.to, docSize);
  if (to < from) {
    return null;
  }

  return { from, to };
}

function mathNodeAt(
  editor: Editor,
  pos: number,
): { kind: MathKind; pos: number } | null {
  const node = editor.state.doc.nodeAt(pos);
  if (node?.type.name === 'inlineMath') {
    return { kind: 'inline', pos };
  }

  if (node?.type.name === 'blockMath') {
    return { kind: 'block', pos };
  }

  return null;
}

function findActiveMath(editor: Editor): { kind: MathKind; pos: number } | null {
  const { selection } = editor.state;
  if (selection instanceof NodeSelection) {
    return mathNodeAt(editor, selection.from);
  }

  if (editor.isActive('inlineMath')) {
    return { kind: 'inline', pos: selection.from };
  }

  if (editor.isActive('blockMath')) {
    return { kind: 'block', pos: selection.from };
  }

  return null;
}

function restoreRange(editor: Editor, range?: MathApplyRange | null): void {
  const next = clampRange(editor.state.doc.content.size, range);
  if (!next) {
    return;
  }

  if (next.to === next.from) {
    editor.commands.setTextSelection(next.from);
    return;
  }

  const asMath = mathNodeAt(editor, next.from);
  if (asMath && next.to === next.from + 1) {
    editor.commands.setNodeSelection(next.from);
    return;
  }

  editor.commands.setTextSelection({ from: next.from, to: next.to });
}

function placeCaretAfterInlineMath(editor: Editor): boolean {
  const { selection } = editor.state;
  if (
    selection instanceof NodeSelection &&
    selection.node.type.name === 'inlineMath'
  ) {
    return editor.commands.setTextSelection(selection.to);
  }

  const { $from } = selection;
  if ($from.nodeBefore?.type.name === 'inlineMath') {
    return true;
  }

  return editor
    .chain()
    .command(({ tr, dispatch }) => {
      tr.setSelection(TextSelection.near(tr.doc.resolve(selection.to)));
      dispatch?.(tr);
      return true;
    })
    .run();
}

function replaceMathKind(
  editor: Editor,
  latex: string,
  fromKind: MathKind,
  toKind: MathKind,
  pos: number,
): boolean {
  const deleted =
    fromKind === 'inline'
      ? editor.chain().focus().deleteInlineMath({ pos }).run()
      : editor.chain().focus().deleteBlockMath({ pos }).run();
  if (!deleted) {
    return false;
  }

  if (toKind === 'inline') {
    return insertInlineMathAt(editor, latex, pos, pos);
  }

  return insertBlockMathAt(editor, latex, pos, pos);
}

function updateOrDeleteMath(
  editor: Editor,
  latex: string,
  kind: MathKind,
  active: { kind: MathKind; pos: number },
): boolean {
  if (!latex) {
    const deleted =
      active.kind === 'inline'
        ? editor.chain().focus().deleteInlineMath({ pos: active.pos }).run()
        : editor.chain().focus().deleteBlockMath({ pos: active.pos }).run();
    return deleted;
  }

  if (kind !== active.kind) {
    return replaceMathKind(editor, latex, active.kind, kind, active.pos);
  }

  if (active.kind === 'inline') {
    const updated = editor
      .chain()
      .focus()
      .updateInlineMath({ latex, pos: active.pos })
      .run();
    if (updated) {
      placeCaretAfterInlineMath(editor);
    }
    return updated;
  }

  const updated = editor
    .chain()
    .focus()
    .updateBlockMath({ latex, pos: active.pos })
    .run();
  if (updated) {
    placeCaretAfterBlock(editor, 'blockMath');
  }
  return updated;
}

function insertInlineMathAt(
  editor: Editor,
  latex: string,
  from: number,
  to: number,
): boolean {
  const type = editor.schema.nodes.inlineMath;
  if (!type) {
    return false;
  }

  const inserted = editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.replaceWith(from, to, type.create({ latex }));
      return true;
    })
    .run();
  if (inserted) {
    placeCaretAfterInlineMath(editor);
  }
  return inserted;
}

function insertBlockMathAt(
  editor: Editor,
  latex: string,
  from: number,
  to: number,
): boolean {
  const chain = editor.chain().focus();
  if (to > from) {
    chain.deleteRange({ from, to });
  }

  const inserted = chain.insertBlockMath({ latex, pos: from }).run();
  if (inserted) {
    placeCaretAfterBlock(editor, 'blockMath');
  }
  return inserted;
}

/**
 * 栏内填 LaTeX：`range` 指向已有公式则更新（空串删除）；否则在该选区插入。
 * 原生输入框会抢焦点，调用方需先记下选区。
 */
export function applyMathLatex(
  editor: Editor,
  raw: string,
  kind: MathKind,
  range?: MathApplyRange | null,
): boolean {
  const latex = raw.trim();
  const snapped = clampRange(editor.state.doc.content.size, range);
  const fromSnap = snapped ? mathNodeAt(editor, snapped.from) : null;
  const active = fromSnap ?? findActiveMath(editor);

  if (active) {
    return updateOrDeleteMath(editor, latex, kind, active);
  }

  if (!latex) {
    return false;
  }

  restoreRange(editor, snapped);
  const { from, to } = editor.state.selection;

  if (kind === 'block') {
    return insertBlockMathAt(editor, latex, from, to);
  }

  return insertInlineMathAt(editor, latex, from, to);
}
