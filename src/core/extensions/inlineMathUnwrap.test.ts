import { describe, it, expect } from 'vitest';
import { Editor, type JSONContent } from '@tiptap/core';
import { Mathematics } from '@tiptap/extension-mathematics';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';

import {
  InlineMathUnwrap,
  inlineMathToEditableText,
} from './inlineMathUnwrap';

function createMathEditor(content: JSONContent) {
  const div = document.createElement('div');
  document.body.appendChild(div);

  const editor = new Editor({
    element: div,
    extensions: [
      StarterKit,
      Mathematics.configure({ katexOptions: { throwOnError: false } }),
      InlineMathUnwrap,
    ],
    content,
  });

  return { editor, div };
}

function findInlineMathPos(editor: Editor): number {
  let mathPos = -1;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'inlineMath') {
      mathPos = pos;
    }
  });
  return mathPos;
}

function dispatchKey(view: Editor['view'], key: 'Backspace' | 'Delete'): boolean {
  const event = new KeyboardEvent('keydown', { key, cancelable: true });
  return (
    view.someProp('handleKeyDown', (handler) => handler(view, event)) ?? false
  );
}

describe('inlineMathToEditableText', () => {
  it('returns opening $$ without closing delimiter', () => {
    expect(inlineMathToEditableText('E=mc^2')).toBe('$$E=mc^2');
  });

  it('returns only $$ for empty latex', () => {
    expect(inlineMathToEditableText('')).toBe('$$');
  });
});

describe('InlineMathUnwrap', () => {
  it('unwraps selected inline math on Backspace', () => {
    const { editor, div } = createMathEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'inlineMath', attrs: { latex: 'E=mc^2' } },
          ],
        },
      ],
    });

    const mathPos = findInlineMathPos(editor);
    editor.view.dispatch(
      editor.state.tr.setSelection(
        NodeSelection.create(editor.state.doc, mathPos),
      ),
    );

    expect(dispatchKey(editor.view, 'Backspace')).toBe(true);
    expect(editor.state.doc.textContent).toBe('$$E=mc^2');

    editor.destroy();
    div.remove();
  });

  it('unwraps inline math on Backspace when cursor is after it', () => {
    const { editor, div } = createMathEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'inlineMath', attrs: { latex: 'E=mc^2' } },
            { type: 'text', text: ' tail' },
          ],
        },
      ],
    });

    const mathPos = findInlineMathPos(editor);
    editor.commands.setTextSelection(mathPos + 1);

    expect(dispatchKey(editor.view, 'Backspace')).toBe(true);
    expect(editor.state.doc.textContent).toBe('$$E=mc^2 tail');

    editor.destroy();
    div.remove();
  });

  it('unwraps inline math on Delete when cursor is before it', () => {
    const { editor, div } = createMathEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'head ' },
            { type: 'inlineMath', attrs: { latex: 'E=mc^2' } },
          ],
        },
      ],
    });

    editor.commands.setTextSelection(6);

    expect(dispatchKey(editor.view, 'Delete')).toBe(true);
    expect(editor.state.doc.textContent).toBe('head $$E=mc^2');

    editor.destroy();
    div.remove();
  });

  it('places cursor at end after unwrap for typing closing $$', () => {
    const { editor, div } = createMathEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'inlineMath', attrs: { latex: 'E=mc^2' } }],
        },
      ],
    });

    const mathPos = findInlineMathPos(editor);
    editor.view.dispatch(
      editor.state.tr.setSelection(
        NodeSelection.create(editor.state.doc, mathPos),
      ),
    );
    dispatchKey(editor.view, 'Backspace');

    const unwrapped = '$$E=mc^2';
    expect(editor.state.doc.textContent).toBe(unwrapped);
    expect(editor.state.selection.from).toBe(mathPos + unwrapped.length);

    editor.destroy();
    div.remove();
  });

  it('does not unwrap block math to inline dollar text', () => {
    const { editor, div } = createMathEditor({
      type: 'doc',
      content: [
        {
          type: 'blockMath',
          attrs: { latex: 'E=mc^2' },
        },
      ],
    });

    editor.view.dispatch(
      editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)),
    );

    dispatchKey(editor.view, 'Backspace');

    expect(editor.state.doc.textContent).not.toBe('$$E=mc^2');
    let hasInlineUnwrap = false;
    editor.state.doc.descendants((node) => {
      if (node.isText && node.text === '$$E=mc^2') {
        hasInlineUnwrap = true;
      }
    });
    expect(hasInlineUnwrap).toBe(false);

    editor.destroy();
    div.remove();
  });
});
