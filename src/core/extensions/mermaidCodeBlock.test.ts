import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RenderResult } from 'mermaid';

const { mockMermaidRenderResult } = vi.hoisted(() => ({
  mockMermaidRenderResult: {
    svg: '<svg class="mermaid-svg">test</svg>',
    diagramType: 'flowchart',
  } satisfies RenderResult,
}));

// Mock mermaid for NodeView tests
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue(mockMermaidRenderResult),
  },
}));
import { Editor, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import mermaid from 'mermaid';
import { MermaidCodeBlock, resetMermaidInitializedForTests } from './mermaidCodeBlock';
import { CodeBlockToolbar } from './codeBlockNodeView';

const mermaidEditorExtensions = [
  StarterKit,
  CodeBlockToolbar.configure({
    toolbar: { enabled: false },
    mermaid: { enabled: true },
  }),
];

function textNodeIncludes(node: JSONContent, fragment: string): boolean {
  if (node.type !== 'text' || !('text' in node)) {
    return false;
  }
  const { text } = node as JSONContent & { text?: unknown };
  return typeof text === 'string' && text.includes(fragment);
}

function contentIncludesText(content: JSONContent[] | undefined, fragment: string): boolean {
  return content?.some((node) => textNodeIncludes(node, fragment)) ?? false;
}

beforeEach(() => {
  resetMermaidInitializedForTests();
  vi.mocked(mermaid.render).mockResolvedValue(mockMermaidRenderResult);
});

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe('MermaidCodeBlock extension', () => {
  it('extension has correct name', () => {
    expect(MermaidCodeBlock.name).toBe('mermaidCodeBlock');
  });

  it('can be configured with enabled: false', () => {
    const ext = MermaidCodeBlock.configure({ enabled: false });
    expect(ext.options.enabled).toBe(false);
  });

  it('is a compatibility extension without its own plugin', () => {
    const ext = MermaidCodeBlock.configure({ enabled: false });
    const editor = new Editor({
      extensions: [StarterKit, ext],
      element: null,
    });
    expect(editor).toBeDefined();
    editor.destroy();
  });
});

describe('Mermaid NodeView in editor', () => {
  it('renders mermaid code block without crashing', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: mermaidEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: 'graph TD\n  A --> B' }],
          },
        ],
      },
    });

    expect(editor).toBeDefined();

    const nodeview = div.querySelector('.mermaid-nodeview');
    expect(nodeview).not.toBeNull();

    editor.destroy();
    div.remove();
  });

  it('does not render mermaid nodeview for non-mermaid code blocks', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: mermaidEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'javascript' },
            content: [{ type: 'text', text: 'console.log("hi")' }],
          },
        ],
      },
    });

    const mermaidNodeview = div.querySelector('.mermaid-nodeview');
    expect(mermaidNodeview).toBeNull();

    // 非 mermaid 代码块未启用 toolbar，应回退到默认 NodeView（pre > code）
    const pre = div.querySelector('pre');
    expect(pre).not.toBeNull();

    const codeBlockNodeview = div.querySelector('.code-block-nodeview');
    expect(codeBlockNodeview).toBeNull();

    editor.destroy();
    div.remove();
  });

  it('shows preview by default when block has content', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: mermaidEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: 'graph TD\n  A --> B' }],
          },
        ],
      },
    });

    await flushMicrotasks();
    await flushMicrotasks();

    const nodeview = div.querySelector('.mermaid-nodeview') as HTMLElement | null;
    const previewButton = div.querySelector(
      '.mermaid-toolbar__button[aria-pressed="true"]',
    ) as HTMLButtonElement | null;

    expect(nodeview).not.toBeNull();
    expect(nodeview?.classList.contains('mermaid-nodeview--preview')).toBe(true);
    expect(previewButton?.textContent).toBe('图表');

    editor.destroy();
    div.remove();
  });

  it('defaults to code mode for empty mermaid block', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: mermaidEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
          },
        ],
      },
    });

    await flushMicrotasks();
    await flushMicrotasks();

    const nodeview = div.querySelector('.mermaid-nodeview') as HTMLElement | null;
    const codeButton = div.querySelector(
      '.mermaid-toolbar__button[aria-pressed="true"]',
    ) as HTMLButtonElement | null;

    expect(nodeview?.classList.contains('mermaid-nodeview--code')).toBe(true);
    expect(codeButton?.textContent).toBe('源码');

    editor.destroy();
    div.remove();
  });

  it('switches to code mode when code button is clicked', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: mermaidEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: 'graph TD\n  A --> B' }],
          },
        ],
      },
    });

    await flushMicrotasks();
    await flushMicrotasks();

    const nodeview = div.querySelector('.mermaid-nodeview') as HTMLElement;
    const codeButton = Array.from(
      div.querySelectorAll('.mermaid-toolbar__button'),
    ).find((button) => button.textContent === '源码') as HTMLButtonElement;

    codeButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(nodeview.classList.contains('mermaid-nodeview--code')).toBe(true);
    expect(codeButton.getAttribute('aria-pressed')).toBe('true');

    editor.destroy();
    div.remove();
  });

  it('preserves multiline content when editing in code mode', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: mermaidEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: 'graph TD' }],
          },
        ],
      },
    });

    await flushMicrotasks();
    await flushMicrotasks();

    const codeButton = Array.from(
      div.querySelectorAll('.mermaid-toolbar__button'),
    ).find((button) => button.textContent === '源码') as HTMLButtonElement;
    codeButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    const pos = editor.state.selection.from;
    editor.view.dispatch(editor.state.tr.insertText('\n  A --> B', pos));

    const json = editor.getJSON();
    const codeBlock = json.content?.find((n) => n.type === 'codeBlock');
    expect(codeBlock?.content?.[0]).toMatchObject({
      type: 'text',
      text: 'graph TD\n  A --> B',
    });
    expect(json.content?.filter((n) => n.type === 'codeBlock').length).toBe(1);

    editor.destroy();
    div.remove();
  });

  it('shows inline parse error and suppresses global mermaid error DOM', async () => {
    vi.mocked(mermaid.render).mockRejectedValueOnce(new Error('parse failed'));

    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: mermaidEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: 'grahp LR\n  A --> B' }],
          },
        ],
      },
    });

    await flushMicrotasks();
    await flushMicrotasks();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const preview = div.querySelector('.mermaid-preview') as HTMLElement;
    expect(preview.textContent).toContain('(Mermaid 解析错误)');
    expect(document.body.textContent).not.toContain('Syntax error in text');

    expect(vi.mocked(mermaid.initialize)).toHaveBeenCalledWith(
      expect.objectContaining({ suppressErrorRendering: true }),
    );

    editor.destroy();
    div.remove();
  });

  it('switches back to preview when preview button is clicked', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: mermaidEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: 'graph TD\n  A --> B' }],
          },
        ],
      },
    });

    await flushMicrotasks();
    await flushMicrotasks();

    const nodeview = div.querySelector('.mermaid-nodeview') as HTMLElement;
    const buttons = Array.from(div.querySelectorAll('.mermaid-toolbar__button'));
    const codeButton = buttons.find((button) => button.textContent === '源码') as HTMLButtonElement;
    const previewButton = buttons.find((button) => button.textContent === '图表') as HTMLButtonElement;

    codeButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    previewButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(nodeview.classList.contains('mermaid-nodeview--preview')).toBe(true);
    expect(previewButton.getAttribute('aria-pressed')).toBe('true');

    editor.destroy();
    div.remove();
  });

  it('does not auto-switch mode when selection moves away', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: mermaidEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: 'graph TD\n  A --> B' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'after mermaid' }],
          },
        ],
      },
    });

    await flushMicrotasks();
    await flushMicrotasks();

    const nodeview = div.querySelector('.mermaid-nodeview') as HTMLElement;
    const codeButton = Array.from(
      div.querySelectorAll('.mermaid-toolbar__button'),
    ).find((button) => button.textContent === '源码') as HTMLButtonElement;

    codeButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    editor.commands.focus('end');

    expect(nodeview.classList.contains('mermaid-nodeview--code')).toBe(true);

    editor.destroy();
    div.remove();
  });

  it('does not duplicate mermaid blocks in document JSON', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: mermaidEditorExtensions,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: 'graph TD\n  A --> B' }],
          },
        ],
      },
    });

    await flushMicrotasks();
    await flushMicrotasks();

    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { language: 'mermaid' },
          content: [{ type: 'text', text: 'graph TD\n  A --> C' }],
        },
      ],
    });

    await flushMicrotasks();
    await flushMicrotasks();

    const jsonAfter = editor.getJSON();
    const codeBlocks = jsonAfter.content?.filter((n) => n.type === 'codeBlock') ?? [];
    expect(codeBlocks.length).toBe(1);
    expect(contentIncludesText(codeBlocks[0]?.content, 'A --> C')).toBe(true);

    // 不应把 mermaid 源码泄漏为独立 paragraph
    const leaked = jsonAfter.content?.filter(
      (n) => n.type === 'paragraph' && contentIncludesText(n.content, 'graph TD'),
    );
    expect(leaked?.length ?? 0).toBe(0);

    editor.destroy();
    div.remove();
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

    it('renders copy button and copies mermaid source', async () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      const editor = new Editor({
        element: div,
        extensions: mermaidEditorExtensions,
        content: {
          type: 'doc',
          content: [
            {
              type: 'codeBlock',
              attrs: { language: 'mermaid' },
              content: [{ type: 'text', text: 'graph TD\n  A --> B' }],
            },
          ],
        },
      });

      await flushMicrotasks();
      await flushMicrotasks();

      const copyButton = div.querySelector('.mermaid-toolbar__copy') as HTMLButtonElement;
      expect(copyButton?.textContent).toBe('复制');

      copyButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      await vi.waitFor(() => {
        expect(writeText).toHaveBeenCalledWith('graph TD\n  A --> B');
      });
      expect(copyButton.textContent).toBe('已复制');
      expect(editor.state.selection.$from.parent.type.name).toBe('codeBlock');

      editor.destroy();
      div.remove();
    });
  });
});
