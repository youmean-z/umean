import type { Editor } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';

import { findMermaidNodeViewAt } from '../extensions/mermaidCodeBlock';

export function findCodeBlockPos(state: EditorState): number | null {
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'codeBlock') {
      return $from.before(depth);
    }
  }

  return null;
}

export function isMermaidCodeBlockActive(editor: Editor): boolean {
  return (
    editor.isActive('codeBlock') &&
    editor.getAttributes('codeBlock').language === 'mermaid'
  );
}

/** 当前 Mermaid 块切图表预览或源码。无 NodeView 时仍返回是否在 mermaid 块内。 */
export function setMermaidPreview(editor: Editor, preview: boolean): boolean {
  if (!isMermaidCodeBlockActive(editor)) {
    return false;
  }

  const pos = findCodeBlockPos(editor.state);
  if (pos == null) {
    return false;
  }

  const nodeView = findMermaidNodeViewAt(pos);
  if (!nodeView) {
    return true;
  }

  if (preview) {
    nodeView.enterPreviewMode();
  } else {
    nodeView.enterEditMode();
  }

  return true;
}

export function isMermaidPreviewActive(editor: Editor): boolean {
  if (!isMermaidCodeBlockActive(editor)) {
    return false;
  }

  const pos = findCodeBlockPos(editor.state);
  if (pos == null) {
    return false;
  }

  return findMermaidNodeViewAt(pos)?.isPreviewMode ?? true;
}
