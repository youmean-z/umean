import { describe, it, expect } from 'vitest';

import {
  countChars,
  countWords,
  getCharCount,
  getSelectedWordCount,
  getWordCount,
} from './wordCount';
import { createDefaultExtensions } from '../extensions/defaultExtensions';
import { Editor } from '@tiptap/core';

describe('countWords / countChars', () => {
  it('counts latin words', () => {
    expect(countWords('hello world')).toBe(2);
    expect(countWords('  one   two-three  ')).toBe(2);
  });

  it('counts each CJK character as a word', () => {
    expect(countWords('你好世界')).toBe(4);
    expect(countWords('hello 你好')).toBe(3);
  });

  it('counts characters', () => {
    expect(countChars('ab c')).toBe(4);
    expect(countChars('ab c', { excludeWhitespace: true })).toBe(3);
  });
});

describe('editor word count helpers', () => {
  it('reads from document and selection', () => {
    const editor = new Editor({
      extensions: createDefaultExtensions(),
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'hello 世界' }],
          },
        ],
      },
    });

    expect(getWordCount(editor)).toBe(3);
    expect(getCharCount(editor)).toBe('hello 世界'.length);

    editor.commands.setTextSelection({ from: 1, to: 6 }); // "hello"
    expect(getSelectedWordCount(editor)).toBe(1);

    editor.destroy();
  });
});
