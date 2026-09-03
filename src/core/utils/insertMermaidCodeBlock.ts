import type { Editor } from '@tiptap/core';

/** 手机端先插源码，不挂 Web 预览工具栏。 */
export const DEFAULT_MERMAID_SOURCE = 'flowchart TD\n  A-->B';

/** 插入 `language=mermaid` 代码块，光标落在源码里。 */
export function insertMermaidCodeBlock(
  editor: Editor,
  source: string = DEFAULT_MERMAID_SOURCE,
): boolean {
  const content = source
    ? [{ type: 'text' as const, text: source }]
    : undefined;

  return editor
    .chain()
    .focus()
    .insertContent({
      type: 'codeBlock',
      attrs: { language: 'mermaid' },
      content,
    })
    .run();
}
