import { Extension } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

const MARKDOWN_PATTERNS = [
  /^#{1,6}\s/m,
  /^\*\s/m,
  /^-\s/m,
  /^\d+\.\s/m,
  /\*\*[^*\n]+\*\*/,
  /__[^_\n]+__/,
  /\*[^*\n]+\*/,
  /`[^`\n]+`/,
  /^```/m,
  /^>\s/m,
  /\[.+?\]\(.+?\)/,
  /^(\*{3,}|-{3,}|_{3,})$/m,
];

function looksLikeMarkdown(text: string): boolean {
  return MARKDOWN_PATTERNS.some((pattern) => pattern.test(text));
}

function fragmentToJSON(content: {
  forEach: (fn: (node: { toJSON: () => JSONContent }) => void) => void;
}): JSONContent {
  const nodes: JSONContent[] = [];

  content.forEach((node) => {
    nodes.push(node.toJSON());
  });

  return { type: 'doc', content: nodes };
}

function isSelectionInCodeBlock(view: EditorView): boolean {
  return view.state.selection.$from.parent.type.name === 'codeBlock';
}

function shouldParseAsMarkdown(text: string, html?: string): boolean {
  const normalized = text.trim();
  if (!normalized) {
    return false;
  }

  if (looksLikeMarkdown(normalized)) {
    return true;
  }

  return !html?.trim();
}

export const MarkdownClipboard = Extension.create({
  name: 'markdownClipboard',
  priority: 1000,

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey('markdownClipboard'),
        props: {
          handlePaste(view, event) {
            if (!editor.markdown) {
              return false;
            }

            if (isSelectionInCodeBlock(view)) {
              return false;
            }

            const text = event.clipboardData?.getData('text/plain');
            if (!text?.trim()) {
              return false;
            }

            const html = event.clipboardData?.getData('text/html');
            if (!shouldParseAsMarkdown(text, html)) {
              return false;
            }

            return editor.commands.insertContent(text, { contentType: 'markdown' });
          },

          clipboardTextSerializer: (slice) => {
            if (!editor.markdown) {
              return '';
            }

            return editor.markdown.serialize(fragmentToJSON(slice.content));
          },
        },
      }),
    ];
  },
});
