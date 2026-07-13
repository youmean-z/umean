import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';

import { getSharedLowlight } from '../utils/lowlight';
import { CodeBlockToolbar } from './codeBlockNodeView';

const toolbarEditorExtensions = [
  StarterKit.configure({ codeBlock: false }),
  CodeBlockLowlight.configure({ lowlight: getSharedLowlight() }),
  CodeBlockToolbar.configure({
    toolbar: { enabled: true },
    mermaid: { enabled: false },
  }),
];

describe('CodeBlockToolbar extension', () => {
  it('extension has correct name', () => {
    expect(CodeBlockToolbar.name).toBe('codeBlockToolbar');
  });

  it('can disable toolbar via options', () => {
    const ext = CodeBlockToolbar.configure({
      toolbar: { enabled: false },
      mermaid: { enabled: false },
    });
    expect(ext.options.toolbar?.enabled).toBe(false);
  });
});

describe('CodeBlockToolbar NodeView in editor', () => {
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

  it('renders toolbar for non-mermaid code blocks', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: toolbarEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'javascript' },
            content: [{ type: 'text', text: "console.log('hi')" }],
          },
        ],
      },
    });

    const nodeview = div.querySelector('.code-block-nodeview');
    expect(nodeview).not.toBeNull();
    expect(div.querySelector('.code-block-toolbar__select')).not.toBeNull();
    expect(div.querySelector('.code-block-toolbar__button')?.textContent).toBe('复制');

    editor.destroy();
    div.remove();
  });

  it('copies code block source', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: toolbarEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'javascript' },
            content: [{ type: 'text', text: "console.log('copy-me')" }],
          },
        ],
      },
    });

    const copyButton = div.querySelector('.code-block-toolbar__button') as HTMLButtonElement;
    copyButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("console.log('copy-me')");
    });
    expect(copyButton.textContent).toBe('已复制');
    expect(editor.state.selection.$from.parent.type.name).toBe('codeBlock');

    editor.destroy();
    div.remove();
  });

  it('changes code block language from toolbar select', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: toolbarEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'javascript' },
            content: [{ type: 'text', text: 'const x = 1' }],
          },
        ],
      },
    });

    const select = div.querySelector('.code-block-toolbar__select') as HTMLSelectElement;
    select.value = 'python';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    const json = editor.getJSON();
    const codeBlock = json.content?.[0];
    expect(codeBlock?.type).toBe('codeBlock');
    expect(codeBlock?.attrs?.language).toBe('python');

    const code = div.querySelector('.code-block-source code');
    expect(code?.className).toBe('language-python');

    editor.destroy();
    div.remove();
  });

  it('uses plain text label when language is empty', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: toolbarEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: null },
            content: [{ type: 'text', text: 'plain text' }],
          },
        ],
      },
    });

    const select = div.querySelector('.code-block-toolbar__select') as HTMLSelectElement;
    expect(select.value).toBe('text');

    editor.destroy();
    div.remove();
  });
});
