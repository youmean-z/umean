import { Extension } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

const inlineMathUnwrapPluginKey = new PluginKey('inlineMathUnwrap');

/** 行内公式 Backspace/Delete 时解包为 `$$latex`（保留开头 $$，去掉末尾 $$，方便直接编辑后输入 $$ 触发 InputRule 转回公式） */
export function inlineMathToEditableText(latex: string): string {
  return `$$${latex}`;
}

function unwrapInlineMath(view: EditorView, pos: number, node: ProseMirrorNode): boolean {
  if (node.type.name !== 'inlineMath') {
    return false;
  }

  const latex = node.attrs.latex;
  if (typeof latex !== 'string') {
    return false;
  }

  const text = inlineMathToEditableText(latex);
  const { tr, schema } = view.state;

  tr.replaceWith(pos, pos + node.nodeSize, schema.text(text));
  tr.setSelection(TextSelection.create(tr.doc, pos + text.length));
  view.dispatch(tr.scrollIntoView());

  return true;
}

function findInlineMathToUnwrap(
  view: EditorView,
  key: 'Backspace' | 'Delete',
): { pos: number; node: ProseMirrorNode } | null {
  const { selection } = view.state;

  if (selection instanceof NodeSelection && selection.node.type.name === 'inlineMath') {
    return { pos: selection.from, node: selection.node };
  }

  if (!selection.empty) {
    return null;
  }

  const { $from } = selection;

  if (key === 'Backspace') {
    const nodeBefore = $from.nodeBefore;
    if (nodeBefore?.type.name === 'inlineMath') {
      return { pos: $from.pos - nodeBefore.nodeSize, node: nodeBefore };
    }
  }

  if (key === 'Delete') {
    const nodeAfter = $from.nodeAfter;
    if (nodeAfter?.type.name === 'inlineMath') {
      return { pos: $from.pos, node: nodeAfter };
    }
  }

  return null;
}

export const InlineMathUnwrap = Extension.create({
  name: 'inlineMathUnwrap',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: inlineMathUnwrapPluginKey,
        props: {
          handleKeyDown(view, event) {
            if (event.key !== 'Backspace' && event.key !== 'Delete') {
              return false;
            }

            const target = findInlineMathToUnwrap(
              view,
              event.key as 'Backspace' | 'Delete',
            );

            if (!target) {
              return false;
            }

            event.preventDefault();
            return unwrapInlineMath(view, target.pos, target.node);
          },
        },
      }),
    ];
  },
});
