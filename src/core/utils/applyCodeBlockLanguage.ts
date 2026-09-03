import type { Editor } from '@tiptap/core';

/** 光标在代码块内时写入 language；不在代码块内则失败。 */
export function applyCodeBlockLanguage(
  editor: Editor,
  language: string | null,
): boolean {
  if (!editor.isActive('codeBlock')) {
    return false;
  }

  return editor
    .chain()
    .focus()
    .updateAttributes('codeBlock', { language })
    .run();
}
