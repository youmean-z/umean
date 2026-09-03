import type { Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

type NodeLikeSelection = {
  node?: { type: { name: string } };
  from: number;
  to: number;
};

/**
 * 块级 atom（图、分割线）后面保证有段落，并把光标放进去。
 * TrailingParagraph 可能已经补过一段，不要再叠一行。
 */
export function placeCaretAfterBlock(editor: Editor, nodeName: string): boolean {
  const { selection, schema, doc } = editor.state;
  const { $from } = selection;
  const indexInParent = $from.depth > 0 ? $from.index($from.depth - 1) : -1;
  const prevSibling =
    indexInParent > 0 ? $from.node($from.depth - 1).child(indexInParent - 1) : null;

  if (
    selection.empty &&
    $from.parent.type.name === 'paragraph' &&
    prevSibling?.type.name === nodeName
  ) {
    return true;
  }

  const sel = selection as NodeLikeSelection;
  const insertPos =
    sel.node?.type.name === nodeName ? sel.to : selection.$to.after();
  const paragraphType = schema.nodes.paragraph;
  if (!paragraphType || insertPos < 0 || insertPos > doc.content.size) {
    return true;
  }

  const nodeAfter = insertPos < doc.content.size ? doc.nodeAt(insertPos) : null;
  if (nodeAfter?.type.name === 'paragraph') {
    return editor.commands.setTextSelection(insertPos + 1);
  }

  return editor
    .chain()
    .command(({ tr, dispatch }) => {
      tr.insert(insertPos, paragraphType.create());
      tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos + 1)));
      dispatch?.(tr);
      return true;
    })
    .run();
}
