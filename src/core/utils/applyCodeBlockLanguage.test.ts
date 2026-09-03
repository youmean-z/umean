import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

import { applyCodeBlockLanguage } from './applyCodeBlockLanguage';

describe('applyCodeBlockLanguage', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  it('updates language inside a code block and no-ops outside', () => {
    editor = new Editor({
      extensions: [StarterKit],
      content: '<pre><code class="language-javascript">const a = 1</code></pre><p>hi</p>',
    });

    editor.commands.setTextSelection(2);
    expect(editor.isActive('codeBlock')).toBe(true);
    expect(applyCodeBlockLanguage(editor, 'typescript')).toBe(true);
    expect(editor.getAttributes('codeBlock').language).toBe('typescript');

    editor.commands.setTextSelection(editor.state.doc.content.size - 2);
    expect(editor.isActive('codeBlock')).toBe(false);
    expect(applyCodeBlockLanguage(editor, 'css')).toBe(false);
  });
});
