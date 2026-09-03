import type { Editor } from '@tiptap/core';

import { placeCaretAfterBlock } from './placeCaretAfterBlock';

/** 插入分割线，光标落在线后段落（已有则不叠行）。 */
export function insertHorizontalRuleWithCaret(editor: Editor): boolean {
  if (!editor.chain().focus().setHorizontalRule().run()) {
    return false;
  }

  return placeCaretAfterBlock(editor, 'horizontalRule');
}
