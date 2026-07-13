import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import python from 'highlight.js/lib/languages/python';

import { createCodeBlockLowlight } from '../utils/lowlight';
import { CodeBlockEnter, CodeBlockToolbar } from './codeBlockNodeView';

function createToolbarEditorExtensions(
  languages?: Parameters<typeof createCodeBlockLowlight>[0],
) {
  const codeBlockLanguageConfig = createCodeBlockLowlight(languages);

  return [
    StarterKit.configure({ codeBlock: false }),
    CodeBlockLowlight.configure({
      lowlight: codeBlockLanguageConfig.lowlight,
      defaultLanguage: codeBlockLanguageConfig.defaultLanguageId,
    }),
    CodeBlockEnter,
    CodeBlockToolbar.configure({
      toolbar: { enabled: true },
      mermaid: { enabled: false },
      languages: codeBlockLanguageConfig.languages,
      aliasToId: codeBlockLanguageConfig.aliasToId,
    }),
  ];
}

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
      extensions: createToolbarEditorExtensions(),
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
    expect(div.querySelector('.code-block-toolbar__lang-trigger')).not.toBeNull();
    expect(div.querySelector('.code-block-toolbar__button')?.textContent).toBe('复制');

    editor.destroy();
    div.remove();
  });

  it('copies code block source', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: createToolbarEditorExtensions(),
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

  it('only shows configured languages in toolbar select', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: createToolbarEditorExtensions(['js', 'css']),
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

    const options = div.querySelectorAll('.code-block-toolbar__lang-option');
    const optionValues = [...options].map(
      (option) => (option as HTMLElement).dataset.value,
    );
    expect(optionValues).toEqual(['text', 'javascript', 'css']);

    editor.destroy();
    div.remove();
  });

  it('changes code block language from toolbar select', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: createToolbarEditorExtensions([
        'javascript',
        { id: 'python', grammar: python, label: 'Python' },
      ]),
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

    const pythonOption = div.querySelector(
      '.code-block-toolbar__lang-option[data-value="python"]',
    ) as HTMLElement;
    pythonOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

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
      extensions: createToolbarEditorExtensions(),
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

    const trigger = div.querySelector(
      '.code-block-toolbar__lang-trigger',
    ) as HTMLButtonElement;
    expect(trigger.textContent).toBe('Plain Text');

    editor.destroy();
    div.remove();
  });

  it('omits highlight class when highlight is disabled', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: createToolbarEditorExtensions([
        {
          id: 'markdown',
          grammar: python,
          highlight: false,
          label: 'Markdown',
        },
      ]),
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'markdown' },
            content: [{ type: 'text', text: '# title' }],
          },
        ],
      },
    });

    const code = div.querySelector('.code-block-source code');
    expect(code?.className).toBe('');

    editor.destroy();
    div.remove();
  });

  it('inserts newline after <html> via Enter in xml code block', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: createToolbarEditorExtensions(['html']),
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'xml' },
            content: [{ type: 'text', text: '<html>' }],
          },
        ],
      },
    });

    editor.commands.focus('end');

    const handled = editor.view.someProp(
      'handleKeyDown',
      (handler) =>
        handler(
          editor.view,
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
        ) ?? false,
    );
    expect(handled).toBe(true);

    const codeBlock = editor.getJSON().content?.[0];
    expect(codeBlock?.content?.[0]).toMatchObject({
      type: 'text',
      text: '<html>\n',
    });

    editor.destroy();
    div.remove();
  });
});
