import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

import { insertHorizontalRuleWithCaret } from './insertHorizontalRuleWithCaret';
import { TrailingParagraph } from '../extensions/trailingParagraph';

describe('insertHorizontalRuleWithCaret', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  it('inserts a rule and leaves the caret in the paragraph after it', () => {
    editor = new Editor({
      extensions: [StarterKit],
      content: '<p>hello</p>',
    });
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);

    expect(insertHorizontalRuleWithCaret(editor)).toBe(true);

    const types = editor.getJSON().content?.map((node) => node.type);
    expect(types).toContain('horizontalRule');
    expect(types?.at(-1)).toBe('paragraph');
    expect(editor.isActive('paragraph')).toBe(true);
    expect(editor.getHTML()).toContain('<hr');
  });

  it('does not stack a second empty line when TrailingParagraph already appended one', () => {
    editor = new Editor({
      extensions: [StarterKit, TrailingParagraph],
      content: '<p>hello</p>',
    });
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);

    expect(insertHorizontalRuleWithCaret(editor)).toBe(true);

    const types = editor.getJSON().content?.map((node) => node.type);
    const hrIndex = types?.indexOf('horizontalRule') ?? -1;
    expect(types?.slice(hrIndex)).toEqual(['horizontalRule', 'paragraph']);
  });
});
