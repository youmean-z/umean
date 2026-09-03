import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';
import { NodeSelection } from '@tiptap/pm/state';

import {
  createDefaultExtensions,
  createTenTapSupplementalExtensions,
} from './defaultExtensions';
import {
  TrailingParagraph,
  breakAfterBlockAtom,
  isBlockAtom,
  needsTrailingParagraph,
} from './trailingParagraph';

function dispatchKey(view: Editor['view'], key: 'Enter'): boolean {
  const event = new KeyboardEvent('keydown', { key, cancelable: true });
  return view.someProp('handleKeyDown', (handler) => handler(view, event)) ?? false;
}

function dispatchBeforeInput(
  view: Editor['view'],
  inputType: 'insertParagraph' | 'insertLineBreak',
): boolean {
  const event = new InputEvent('beforeinput', {
    inputType,
    cancelable: true,
    bubbles: true,
  });
  return (
    view.someProp('handleDOMEvents', (handlers) =>
      handlers.beforeinput?.(view, event),
    ) ?? false
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

function imagePos(editor: Editor): number {
  let found = -1;
  editor.state.doc.descendants((node, pos) => {
    if (found < 0 && node.type.name === 'image') {
      found = pos;
    }
  });
  return found;
}

describe('TrailingParagraph', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  function createEditor(
    content: string | Record<string, unknown> = '<p>hello</p>',
  ) {
    editor = new Editor({
      extensions: [
        StarterKit,
        Image.configure({ allowBase64: true }),
        TrailingParagraph,
      ],
      content,
    });
    return editor;
  }

  it('registers on Web and TenTap supplemental extensions', () => {
    expect(createDefaultExtensions().map((e) => e.name)).toContain(
      'trailingParagraph',
    );
    expect(createTenTapSupplementalExtensions().map((e) => e.name)).toContain(
      'trailingParagraph',
    );
  });

  it('treats images as block atoms', () => {
    createEditor();
    const image = editor.schema.nodes.image.create({
      src: 'https://example.com/a.png',
    });
    expect(isBlockAtom(image)).toBe(true);
    expect(isBlockAtom(editor.schema.nodes.paragraph.create())).toBe(false);
  });

  it('treats horizontal rules as blocks that need a trailing paragraph', () => {
    createEditor();
    const rule = editor.schema.nodes.horizontalRule.create();
    expect(isBlockAtom(rule)).toBe(true);
  });

  it('appends a paragraph when the document ends with an image', () => {
    createEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hi' }] },
        { type: 'image', attrs: { src: 'https://example.com/a.png' } },
      ],
    });

    expect(editor.state.doc.lastChild?.type.name).toBe('paragraph');
    expect(needsTrailingParagraph(editor.state.doc)).toBe(false);
    expect(countType(editor, 'image')).toBe(1);
  });

  it('appends a paragraph when the document ends with a horizontal rule', () => {
    createEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hi' }] },
        { type: 'horizontalRule' },
      ],
    });

    expect(editor.state.doc.lastChild?.type.name).toBe('paragraph');
    expect(needsTrailingParagraph(editor.state.doc)).toBe(false);
  });

  it('restores a trailing paragraph after the last block after an image is deleted', () => {
    createEditor({
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'https://example.com/a.png' } },
        { type: 'paragraph', content: [{ type: 'text', text: 'after' }] },
      ],
    });

    const last = editor.state.doc.lastChild;
    expect(last?.type.name).toBe('paragraph');
    const from = editor.state.doc.content.size - (last?.nodeSize ?? 0);
    editor.view.dispatch(
      editor.state.tr.delete(from, editor.state.doc.content.size),
    );

    expect(editor.state.doc.lastChild?.type.name).toBe('paragraph');
    expect(editor.state.selection.$from.parent.type.name).toBe('paragraph');
    expect(editor.getText()).not.toContain('after');
  });

  it('inserts a paragraph after a selected image on Enter', () => {
    createEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hi' }] },
        { type: 'image', attrs: { src: 'https://example.com/a.png' } },
        { type: 'paragraph' },
      ],
    });

    const pos = imagePos(editor);
    editor.view.dispatch(
      editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)),
    );
    const paragraphsBefore = countType(editor, 'paragraph');

    expect(dispatchKey(editor.view, 'Enter')).toBe(true);
    expect(countType(editor, 'paragraph')).toBe(paragraphsBefore + 1);
    expect(editor.state.selection.$from.parent.type.name).toBe('paragraph');
    expect(editor.state.selection.$from.parent.content.size).toBe(0);
  });

  it('inserts a new paragraph when Enter is pressed in an empty paragraph after an image', () => {
    createEditor({
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'https://example.com/a.png' } },
        { type: 'paragraph' },
      ],
    });

    const lastPos = editor.state.doc.content.size - editor.state.doc.lastChild!.nodeSize;
    editor.commands.setTextSelection(lastPos + 1);
    const paragraphsBefore = countType(editor, 'paragraph');

    expect(breakAfterBlockAtom(editor.state, editor.view.dispatch)).toBe(true);
    expect(countType(editor, 'paragraph')).toBe(paragraphsBefore + 1);
    expect(editor.state.selection.$from.parent.type.name).toBe('paragraph');
  });

  it('handles mobile beforeinput insertParagraph after an image', () => {
    createEditor({
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'https://example.com/a.png' } },
        { type: 'paragraph' },
      ],
    });

    const lastPos = editor.state.doc.content.size - editor.state.doc.lastChild!.nodeSize;
    editor.commands.setTextSelection(lastPos + 1);
    const paragraphsBefore = countType(editor, 'paragraph');

    expect(dispatchBeforeInput(editor.view, 'insertParagraph')).toBe(true);
    expect(countType(editor, 'paragraph')).toBe(paragraphsBefore + 1);
  });

  it('does not intercept Enter in a normal empty paragraph', () => {
    createEditor('<p>hello</p><p></p>');
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    expect(breakAfterBlockAtom(editor.state)).toBe(false);
  });
});
