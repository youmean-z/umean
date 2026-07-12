import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock mermaid for NodeView tests
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({
      svg: '<svg class="mermaid-svg">test</svg>',
    }),
  },
}));

import { Editor, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { MermaidCodeBlock, resetMermaidInitializedForTests } from './mermaidCodeBlock';

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

  it('does not create Plugin when disabled', () => {
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
      extensions: [StarterKit, MermaidCodeBlock],
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

  it('does not interfere with non-mermaid code blocks', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: [StarterKit, MermaidCodeBlock],
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

    const nodeview = div.querySelector('.mermaid-nodeview');
    expect(nodeview).toBeNull();

    const pre = div.querySelector('pre');
    expect(pre).not.toBeNull();

    editor.destroy();
    div.remove();
  });

  it('shows preview by default when not focused', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: [StarterKit, MermaidCodeBlock],
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

    const previewDOM = div.querySelector('.mermaid-preview') as HTMLElement | null;
    const pre = div.querySelector('.mermaid-nodeview pre') as HTMLElement | null;

    expect(previewDOM).not.toBeNull();
    expect(previewDOM?.style.display).not.toBe('none');
    expect(pre?.style.display).toBe('none');

    editor.destroy();
    div.remove();
  });

  it('switches to edit mode when preview is clicked', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: [StarterKit, MermaidCodeBlock],
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

    const previewDOM = div.querySelector('.mermaid-preview') as HTMLElement;
    const pre = div.querySelector('.mermaid-nodeview pre') as HTMLElement;

    previewDOM.click();

    expect(pre.style.display).not.toBe('none');
    expect(previewDOM.style.display).toBe('none');

    editor.destroy();
    div.remove();
  });

  it('does not duplicate mermaid blocks in document JSON', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const editor = new Editor({
      element: div,
      extensions: [StarterKit, MermaidCodeBlock],
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
});
