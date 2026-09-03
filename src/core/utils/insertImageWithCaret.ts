import type { Editor } from '@tiptap/core';

import { placeCaretAfterBlock } from './placeCaretAfterBlock';

/**
 * 先按 TipTap 原生命令插入块级图片（与原先 ImageBridge 一致），
 * 再确保图后有空段落并把光标放进去。
 */
export function insertImageWithCaret(editor: Editor, src: string): boolean {
  if (!editor.chain().focus().setImage({ src }).run()) {
    return false;
  }

  return placeCaretAfterBlock(editor, 'image');
}
