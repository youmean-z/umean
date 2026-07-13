import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Editor, type JSONContent } from '@tiptap/core';
import { InlineMath } from '@tiptap/extension-mathematics';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';

import {
  BlockMathWithNodeView,
  resizeBlockMathSourceArea,
  resetBlockMathNodeViewsForTests,
} from './blockMathNodeView';
import { InlineMathUnwrap } from './inlineMathUnwrap';

vi.mock('katex', () => ({
  default: {
    render: vi.fn((_latex: string, el: HTMLElement) => {
      el.textContent = 'katex-rendered';
    }),
  },
}));

function createMathEditor(content: JSONContent) {
  const div = document.createElement('div');
  document.body.appendChild(div);

  const editor = new Editor({
    element: div,
    extensions: [
      StarterKit,
      InlineMath.configure({ katexOptions: { throwOnError: false } }),
      InlineMathUnwrap,
      BlockMathWithNodeView.configure({
        katexOptions: { throwOnError: false, displayMode: true },
      }),
    ],
    content,
  });

  return { editor, div };
}

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

function dispatchKey(view: Editor['view'], key: 'Backspace' | 'Delete'): boolean {
  const event = new KeyboardEvent('keydown', { key, cancelable: true });
  return (
    view.someProp('handleKeyDown', (handler) => handler(view, event)) ?? false
  );
}

beforeEach(() => {
  resetBlockMathNodeViewsForTests();
});

describe('BlockMathNodeView', () => {
  it('renders block math with toolbar', async () => {
    const { editor, div } = createMathEditor({
      type: 'doc',
      content: [
        {
          type: 'blockMath',
          attrs: { latex: '\\sum_{i=1}^{n} i' },
        },
      ],
    });

    await flushMicrotasks();
    await flushMicrotasks();

    expect(div.querySelector('.block-math-nodeview')).not.toBeNull();
    expect(div.querySelector('.block-math-toolbar')).not.toBeNull();
    expect(div.querySelector('.block-math-toolbar__copy')?.textContent).toBe('复制');

    const sourceButton = Array.from(
      div.querySelectorAll('.block-math-toolbar__button'),
    ).find((button) => button.textContent === '源码');
    expect(sourceButton).toBeDefined();

    editor.destroy();
    div.remove();
  });

  it('shows preview by default when block has latex', async () => {
    const { editor, div } = createMathEditor({
      type: 'doc',
      content: [
        {
          type: 'blockMath',
          attrs: { latex: 'E=mc^2' },
        },
      ],
    });

    await flushMicrotasks();
    await flushMicrotasks();

    const nodeview = div.querySelector('.block-math-nodeview') as HTMLElement;
    expect(nodeview.classList.contains('block-math-nodeview--preview')).toBe(true);

    editor.destroy();
    div.remove();
  });

  it('defaults to edit mode for empty block math', async () => {
    const { editor, div } = createMathEditor({
      type: 'doc',
      content: [{ type: 'blockMath', attrs: { latex: '' } }],
    });

    await flushMicrotasks();
    await flushMicrotasks();

    const nodeview = div.querySelector('.block-math-nodeview') as HTMLElement;
    expect(nodeview.classList.contains('block-math-nodeview--edit')).toBe(true);

    editor.destroy();
    div.remove();
  });

  it('enters edit mode on Backspace when block is selected', async () => {
    const { editor, div } = createMathEditor({
      type: 'doc',
      content: [{ type: 'blockMath', attrs: { latex: 'E=mc^2' } }],
    });

    await flushMicrotasks();
    await flushMicrotasks();

    editor.view.dispatch(
      editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)),
    );

    expect(dispatchKey(editor.view, 'Backspace')).toBe(true);

    const nodeview = div.querySelector('.block-math-nodeview') as HTMLElement;
    expect(nodeview.classList.contains('block-math-nodeview--edit')).toBe(true);

    editor.destroy();
    div.remove();
  });

  it('creates empty block math from $$$ input rule', async () => {
    const { editor, div } = createMathEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '$$$' }],
        },
      ],
    });

    editor.commands.focus('end');
    const from = editor.state.selection.from;
    const defaultInsert = () => editor.state.tr.insertText(' ');
    const handled = editor.view.someProp(
      'handleTextInput',
      (handler) => handler(editor.view, from, from, ' ', defaultInsert),
    );
    expect(handled).toBe(true);

    await flushMicrotasks();
    await flushMicrotasks();

    expect(editor.state.doc.firstChild?.type.name).toBe('blockMath');

    editor.destroy();
    div.remove();
  });

  it('auto-resizes source textarea based on content', async () => {
    const { editor, div } = createMathEditor({
      type: 'doc',
      content: [{ type: 'blockMath', attrs: { latex: '' } }],
    });

    await flushMicrotasks();
    await flushMicrotasks();

    const sourceArea = div.querySelector('.block-math-source') as HTMLTextAreaElement;
    const emptyHeight = Number.parseFloat(sourceArea.style.height);

    sourceArea.value = 'E=mc^2\n\\sum_{i=1}^{n} i\n\\int_0^1 x^2 dx';
    sourceArea.dispatchEvent(new Event('input', { bubbles: true }));

    const expandedHeight = Number.parseFloat(sourceArea.style.height);
    expect(expandedHeight).toBeGreaterThan(emptyHeight);
    expect(sourceArea.style.overflow).not.toBe('scroll');

    editor.destroy();
    div.remove();
  });

  it('resizeBlockMathSourceArea sets inline height from scrollHeight', () => {
    const sourceArea = document.createElement('textarea');
    sourceArea.className = 'block-math-source';
    sourceArea.style.width = '480px';
    sourceArea.value = 'line1\nline2\nline3';
    document.body.appendChild(sourceArea);

    resizeBlockMathSourceArea(sourceArea);

    expect(sourceArea.style.height).not.toBe('');
    expect(Number.parseFloat(sourceArea.style.height)).toBeGreaterThan(0);

    resizeBlockMathSourceArea(sourceArea);
    const singleLineHeight = Number.parseFloat(sourceArea.style.height);
    sourceArea.value = 'line1\nline2\nline3\nline4\nline5';
    resizeBlockMathSourceArea(sourceArea);
    expect(Number.parseFloat(sourceArea.style.height)).toBeGreaterThan(singleLineHeight);

    sourceArea.remove();
  });

  describe('copy button', () => {
    let writeText: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('copies block math source and focuses source editor', async () => {
      const { editor, div } = createMathEditor({
        type: 'doc',
        content: [{ type: 'blockMath', attrs: { latex: 'E=mc^2' } }],
      });

      await flushMicrotasks();
      await flushMicrotasks();

      const copyButton = div.querySelector('.block-math-toolbar__copy') as HTMLButtonElement;
      copyButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      await vi.waitFor(() => {
        expect(writeText).toHaveBeenCalledWith('E=mc^2');
      });
      expect(copyButton.textContent).toBe('已复制');

      const nodeview = div.querySelector('.block-math-nodeview') as HTMLElement;
      expect(nodeview.classList.contains('block-math-nodeview--edit')).toBe(true);

      const sourceArea = div.querySelector('.block-math-source') as HTMLTextAreaElement;
      expect(document.activeElement).toBe(sourceArea);

      editor.destroy();
      div.remove();
    });
  });
});
