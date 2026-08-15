import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';

import { createDefaultExtensions } from './defaultExtensions';

function dispatchKey(
  view: Editor['view'],
  key: 'Backspace' | 'Delete' | 'Enter',
): boolean {
  const event = new KeyboardEvent('keydown', { key, cancelable: true });
  return (
    view.someProp('handleKeyDown', (handler) => handler(view, event)) ?? false
  );
}

function countType(editor: Editor, type: string): number {
  let count = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === type) {
      count += 1;
    }
  });
  return count;
}

function posOfEmptyParagraph(editor: Editor): number {
  let found = -1;
  editor.state.doc.descendants((node, pos) => {
    if (found < 0 && node.type.name === 'paragraph' && node.content.size === 0) {
      found = pos;
    }
  });
  return found;
}

function setCursorInEmptyParagraph(editor: Editor): void {
  const pos = posOfEmptyParagraph(editor);
  expect(pos).toBeGreaterThanOrEqual(0);
  editor.commands.setTextSelection(pos + 1);
}

describe('BlockquoteKeys', () => {
  let editor: Editor;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    editor = new Editor({
      element,
      extensions: createDefaultExtensions({
        rich: { mermaid: { enabled: false } },
      }),
    });
  });

  afterEach(() => {
    editor.destroy();
    element.remove();
  });

  it('registers blockquoteKeys by default', () => {
    expect(createDefaultExtensions().map((e) => e.name)).toContain(
      'blockquoteKeys',
    );
  });

  it('does not split blockquote when Enter on empty middle paragraph', () => {
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: '首行' }] },
            { type: 'paragraph' },
            { type: 'paragraph', content: [{ type: 'text', text: '— 出处' }] },
          ],
        },
      ],
    });

    setCursorInEmptyParagraph(editor);
    expect(dispatchKey(editor.view, 'Enter')).toBe(true);
    expect(countType(editor, 'blockquote')).toBe(1);
    expect(editor.state.doc.textContent).toContain('首行');
    expect(editor.state.doc.textContent).toContain('— 出处');
  });

  it('does not split blockquote when Backspace on empty middle paragraph', () => {
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: '首行' }] },
            { type: 'paragraph' },
            { type: 'paragraph', content: [{ type: 'text', text: '— 出处' }] },
          ],
        },
      ],
    });

    setCursorInEmptyParagraph(editor);
    expect(dispatchKey(editor.view, 'Backspace')).toBe(true);
    expect(countType(editor, 'blockquote')).toBe(1);
    const quote = editor.getJSON().content?.find((node) => node.type === 'blockquote');
    expect(quote?.content).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: '首行' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '— 出处' }] },
    ]);
  });

  it('unwraps the last remaining quote line into a paragraph', () => {
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: '引用正文' }] },
          ],
        },
      ],
    });

    editor.commands.setTextSelection(1);
    expect(dispatchKey(editor.view, 'Backspace')).toBe(true);
    expect(countType(editor, 'blockquote')).toBe(0);
    expect(editor.state.doc.textContent).toBe('引用正文');
  });

  it('does not join the following paragraph back into a leftover quote', () => {
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: '引用' }] },
          ],
        },
        { type: 'paragraph', content: [{ type: 'text', text: '后面' }] },
      ],
    });

    // 光标在「后面」段首，Backspace 不应把该段拼进引用
    const afterPos =
      editor.state.doc.nodeAt(0)!.nodeSize + 1;
    editor.commands.setTextSelection(afterPos);
    expect(dispatchKey(editor.view, 'Backspace')).toBe(true);
    expect(countType(editor, 'blockquote')).toBe(0);
    expect(editor.state.doc.textContent).toBe('引用后面');
  });
});
