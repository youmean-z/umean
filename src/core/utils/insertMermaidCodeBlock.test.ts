import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

import {
  DEFAULT_MERMAID_SOURCE,
  insertMermaidCodeBlock,
} from './insertMermaidCodeBlock';

describe('insertMermaidCodeBlock', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  it('inserts a mermaid code block with the starter source', () => {
    editor = new Editor({
      extensions: [StarterKit],
      content: '<p>hello</p>',
    });
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);

    expect(insertMermaidCodeBlock(editor)).toBe(true);
    expect(editor.isActive('codeBlock')).toBe(true);
    expect(editor.getAttributes('codeBlock').language).toBe('mermaid');
    expect(editor.getText()).toContain('flowchart TD');
    expect(editor.getText()).toContain('A-->B');
    expect(DEFAULT_MERMAID_SOURCE).toContain('flowchart');
  });
});
