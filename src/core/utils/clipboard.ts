import { TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

import type { UmeanMessages } from '../i18n';

/**
 * 复制文本到剪贴板，并管理按钮文案状态（"复制"→"已复制"→恢复）。
 * 三个 NodeView（CodeBlock / Mermaid / BlockMath）共用。
 */
export async function copyToClipboard(
  text: string,
  button: HTMLButtonElement,
  messages: UmeanMessages,
  resetTimerRef: { current: ReturnType<typeof setTimeout> | undefined },
  onAfterCopy?: () => void,
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = messages.copied;
  } catch {
    button.textContent = messages.copyFailed;
  }

  if (resetTimerRef.current) {
    clearTimeout(resetTimerRef.current);
  }

  resetTimerRef.current = setTimeout(() => {
    button.textContent = messages.copy;
  }, 2000);

  onAfterCopy?.();
}

/**
 * 将光标定位到 ProseMirror Node 内部末尾。
 * 用于复制后聚焦回编辑器（CodeBlock / Mermaid NodeView 共用）。
 */
export function focusProseMirrorNodeEnd(
  view: EditorView,
  node: ProseMirrorNode,
  getPos: () => number | undefined,
): void {
  const pos = getPos();
  if (pos == null) return;

  const { doc } = view.state;
  const innerFrom = pos + 1;
  const innerTo = pos + node.nodeSize - 1;
  const selection =
    innerTo > innerFrom
      ? TextSelection.create(doc, innerTo)
      : TextSelection.near(doc.resolve(innerFrom));

  view.dispatch(view.state.tr.setSelection(selection));
  view.focus();
}
