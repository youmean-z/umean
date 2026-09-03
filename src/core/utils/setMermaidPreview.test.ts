import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RenderResult } from 'mermaid';

const { mockMermaidRenderResult } = vi.hoisted(() => ({
  mockMermaidRenderResult: {
    svg: '<svg class="mermaid-svg">test</svg>',
    diagramType: 'flowchart',
  } satisfies RenderResult,
}));

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue(mockMermaidRenderResult),
  },
}));

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import mermaid from 'mermaid';

import { TenTapMermaidPreview } from '../extensions/tentapMermaidPreview';
import {
  resetMermaidInitializedForTests,
  resetMermaidNodeViewsForTests,
} from '../extensions/mermaidCodeBlock';
import {
  isMermaidCodeBlockActive,
  isMermaidPreviewActive,
  setMermaidPreview,
} from './setMermaidPreview';

beforeEach(() => {
  resetMermaidInitializedForTests();
  resetMermaidNodeViewsForTests();
  vi.mocked(mermaid.render).mockResolvedValue(mockMermaidRenderResult);
});

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe('TenTap mermaid preview', () => {
  let editor: Editor;
  let root: HTMLDivElement;

  afterEach(() => {
    editor?.destroy();
    root?.remove();
  });

  it('renders a chart without the web toolbar and can switch to source', async () => {
    root = document.createElement('div');
    document.body.appendChild(root);

    editor = new Editor({
      element: root,
      extensions: [StarterKit, TenTapMermaidPreview],
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: 'flowchart TD\n  A-->B' }],
          },
        ],
      },
    });

    editor.commands.setTextSelection(2);
    expect(isMermaidCodeBlockActive(editor)).toBe(true);

    await flushMicrotasks();
    await flushMicrotasks();

    const nodeview = root.querySelector('.mermaid-nodeview') as HTMLElement;
    expect(nodeview).not.toBeNull();
    expect(root.querySelector('.mermaid-toolbar')).toBeNull();
    expect(nodeview.classList.contains('mermaid-nodeview--tentap')).toBe(true);
    expect(nodeview.classList.contains('mermaid-nodeview--preview')).toBe(true);
    expect(isMermaidPreviewActive(editor)).toBe(true);

    expect(setMermaidPreview(editor, false)).toBe(true);
    expect(nodeview.classList.contains('mermaid-nodeview--code')).toBe(true);
    expect(isMermaidPreviewActive(editor)).toBe(false);

    expect(setMermaidPreview(editor, true)).toBe(true);
    expect(nodeview.classList.contains('mermaid-nodeview--preview')).toBe(true);
  });
});
