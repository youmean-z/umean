import { describe, it, expect } from 'vitest';
import { Editor, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Markdown } from '@tiptap/markdown';
import { Slice } from '@tiptap/pm/model';

import { getSharedLowlight } from '../utils/lowlight';
import { MarkdownClipboard } from './markdownClipboard';

const clipboardExtensions = [
  StarterKit.configure({ codeBlock: false }),
  CodeBlockLowlight.configure({ lowlight: getSharedLowlight() }),
  Markdown,
  MarkdownClipboard,
];

function getBlockText(doc: JSONContent, blockIndex = 0): string | undefined {
  const block = doc.content?.[blockIndex];
  const child = block?.content?.[0];
  if (!child || child.type !== 'text' || typeof child.text !== 'string') {
    return undefined;
  }

  return child.text;
}

function createPasteEvent(text: string, html = ''): ClipboardEvent {
  const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: (type: string) => {
        if (type === 'text/plain') return text;
        if (type === 'text/html') return html;
        return '';
      },
    },
  });
  return event;
}

function runHandlePaste(editor: Editor, event: ClipboardEvent): boolean {
  let handled = false;
  editor.view.someProp('handlePaste', (handler) => {
    if (handler(editor.view, event, Slice.empty)) {
      handled = true;
      return true;
    }
    return false;
  });
  return handled;
}

describe('MarkdownClipboard', () => {
  it('skips markdown parsing when pasting inside a code block', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: clipboardExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'javascript' },
            content: [{ type: 'text', text: 'const x = ' }],
          },
        ],
      },
    });

    editor.commands.setTextSelection(1 + 'const x = '.length);

    const handled = runHandlePaste(
      editor,
      createPasteEvent("console.log('paste-me')"),
    );

    expect(handled).toBe(false);
    expect(editor.state.selection.$from.parent.type.name).toBe('codeBlock');
    expect(getBlockText(editor.getJSON())).toBe('const x = ');

    editor.destroy();
    div.remove();
  });

  it('still parses plain text as markdown outside code blocks', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: clipboardExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          },
        ],
      },
    });

    editor.commands.setTextSelection(1);

    const handled = runHandlePaste(
      editor,
      createPasteEvent('plain text line'),
    );

    expect(handled).toBe(true);
    expect(getBlockText(editor.getJSON())).toBe('plain text line');

    editor.destroy();
    div.remove();
  });
});
