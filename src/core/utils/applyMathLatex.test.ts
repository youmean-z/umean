import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { BlockMath, InlineMath } from '@tiptap/extension-mathematics';
import StarterKit from '@tiptap/starter-kit';

import { applyMathLatex } from './applyMathLatex';
import { TrailingParagraph } from '../extensions/trailingParagraph';

describe('applyMathLatex', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  function createEditor(content = '<p>hello</p>') {
    editor = new Editor({
      extensions: [
        StarterKit,
        InlineMath.configure({ katexOptions: { throwOnError: false } }),
        BlockMath.configure({
          katexOptions: { throwOnError: false, displayMode: true },
        }),
      ],
      content,
    });
    return editor;
  }

  it('inserts inline math and leaves the caret after it', () => {
    createEditor('<p></p>');
    editor.commands.setTextSelection(1);
    expect(applyMathLatex(editor, 'E=mc^2', 'inline')).toBe(true);

    const json = editor.getJSON();
    const para = json.content?.[0];
    expect(para?.content?.[0]).toMatchObject({
      type: 'inlineMath',
      attrs: { latex: 'E=mc^2' },
    });
    expect(editor.isActive('inlineMath')).toBe(false);
    expect(editor.state.selection.empty).toBe(true);
  });

  it('replaces a captured text range after the live selection collapsed', () => {
    createEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });
    editor.commands.setTextSelection(6);
    expect(
      applyMathLatex(editor, 'x^2', 'inline', { from: 1, to: 6 }),
    ).toBe(true);
    expect(editor.getJSON().content?.[0]?.content).toEqual([
      { type: 'inlineMath', attrs: { latex: 'x^2' } },
    ]);
  });

  it('updates existing inline math from a snapped node range', () => {
    createEditor('<p></p>');
    editor.commands.setTextSelection(1);
    expect(applyMathLatex(editor, 'a', 'inline')).toBe(true);

    const pos = 1;
    expect(editor.state.doc.nodeAt(pos)?.type.name).toBe('inlineMath');
    expect(
      applyMathLatex(editor, 'b+c', 'inline', { from: pos, to: pos + 1 }),
    ).toBe(true);
    expect(editor.state.doc.nodeAt(pos)?.attrs.latex).toBe('b+c');
  });

  it('deletes existing math when latex is empty', () => {
    createEditor('<p></p>');
    editor.commands.setTextSelection(1);
    applyMathLatex(editor, 'a', 'inline');
    expect(
      applyMathLatex(editor, '  ', 'inline', { from: 1, to: 2 }),
    ).toBe(true);
    expect(
      editor.getJSON().content?.[0]?.content?.some(
        (node) => node.type === 'inlineMath',
      ),
    ).toBeFalsy();
  });

  it('does not insert when latex is empty and nothing is selected', () => {
    createEditor();
    editor.commands.setTextSelection(1);
    expect(applyMathLatex(editor, '  ', 'inline')).toBe(false);
    expect(editor.getText()).toBe('hello');
  });

  it('inserts block math and leaves the caret in the paragraph after it', () => {
    createEditor('<p>hello</p>');
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    expect(applyMathLatex(editor, '\\sum x', 'block')).toBe(true);

    const types = editor.getJSON().content?.map((node) => node.type);
    expect(types).toContain('blockMath');
    expect(types?.at(-1)).toBe('paragraph');
    expect(editor.isActive('paragraph')).toBe(true);
    expect(editor.isActive('blockMath')).toBe(false);
  });

  it('does not stack a second empty line when TrailingParagraph already appended one', () => {
    editor = new Editor({
      extensions: [
        StarterKit,
        InlineMath.configure({ katexOptions: { throwOnError: false } }),
        BlockMath.configure({
          katexOptions: { throwOnError: false, displayMode: true },
        }),
        TrailingParagraph,
      ],
      content: '<p>hello</p>',
    });
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);

    expect(applyMathLatex(editor, 'x', 'block')).toBe(true);

    const types = editor.getJSON().content?.map((node) => node.type);
    const mathIndex = types?.indexOf('blockMath') ?? -1;
    expect(types?.slice(mathIndex)).toEqual(['blockMath', 'paragraph']);
  });

  it('converts inline math to a block when kind changes', () => {
    createEditor('<p></p>');
    editor.commands.setTextSelection(1);
    expect(applyMathLatex(editor, 'a+b', 'inline')).toBe(true);

    expect(
      applyMathLatex(editor, 'a+b', 'block', { from: 1, to: 2 }),
    ).toBe(true);

    const types = editor.getJSON().content?.map((node) => node.type);
    expect(types).toContain('blockMath');
    expect(
      editor.getJSON().content?.some((node) =>
        node.content?.some((child) => child.type === 'inlineMath'),
      ),
    ).toBeFalsy();
  });
});
