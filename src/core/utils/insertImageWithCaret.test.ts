import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

import { insertImageWithCaret } from './insertImageWithCaret';
import { TrailingParagraph } from '../extensions/trailingParagraph';

describe('insertImageWithCaret', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  it('inserts a block image and leaves the caret in an empty paragraph after it', () => {
    editor = new Editor({
      extensions: [StarterKit, Image.configure({ allowBase64: true })],
      content: '<p>hello</p>',
    });
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);

    expect(insertImageWithCaret(editor, 'https://example.com/a.png')).toBe(
      true,
    );

    const types = editor.getJSON().content?.map((node) => node.type);
    expect(types).toContain('image');
    expect(types?.at(-1)).toBe('paragraph');
    expect(editor.isActive('paragraph')).toBe(true);
    expect(editor.isActive('image')).toBe(false);
    expect(editor.state.selection.empty).toBe(true);
  });

  it('does not stack a second empty line when TrailingParagraph already appended one', () => {
    editor = new Editor({
      extensions: [
        StarterKit,
        Image.configure({ allowBase64: true }),
        TrailingParagraph,
      ],
      content: '<p>hello</p>',
    });
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);

    expect(insertImageWithCaret(editor, 'https://example.com/a.png')).toBe(
      true,
    );

    const types = editor.getJSON().content?.map((node) => node.type);
    const imageIndex = types?.indexOf('image') ?? -1;
    expect(types?.slice(imageIndex)).toEqual(['image', 'paragraph']);
    expect(editor.isActive('paragraph')).toBe(true);
  });

  it('inserts from inside a heading and leaves the caret in a paragraph', () => {
    editor = new Editor({
      extensions: [StarterKit, Image.configure({ allowBase64: true })],
      content: '<h1>title</h1><p>hello</p>',
    });
    editor.commands.setTextSelection(2);

    expect(insertImageWithCaret(editor, 'https://example.com/a.png')).toBe(
      true,
    );
    expect(editor.getJSON().content?.some((node) => node.type === 'image')).toBe(
      true,
    );
    expect(editor.isActive('paragraph')).toBe(true);
  });
});
