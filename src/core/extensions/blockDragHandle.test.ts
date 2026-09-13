import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';

import { createDefaultExtensions } from './defaultExtensions';
import {
  blockDragHandlePluginKey,
  getMinTopLevelDropPos,
  isDocumentTitleBlockPos,
  moveTopLevelBlock,
  resolveTopLevelDropPos,
} from './blockDragHandle';

describe('BlockDragHandle', () => {
  let editor: Editor;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    editor = new Editor({
      element,
      extensions: createDefaultExtensions(),
      content: '<h2>Title</h2><p>hello</p><p>world</p>',
    });
  });

  afterEach(() => {
    editor.destroy();
    element.remove();
  });

  it('registers by default and can be disabled', () => {
    expect(createDefaultExtensions().map((e) => e.name)).toContain(
      'umeanBlockDragHandle',
    );
    expect(
      createDefaultExtensions({ blockDragHandle: false }).map((e) => e.name),
    ).not.toContain('umeanBlockDragHandle');
  });

  it('renders a drag handle widget per top-level block', () => {
    const handles = editor.view.dom.querySelectorAll('.umean-drag-handle');
    expect(handles.length).toBe(3);
    expect(handles[0].getAttribute('draggable')).toBe('true');
    expect(handles[0].hasAttribute('data-drag-handle')).toBe(true);
  });

  it('dragstart on handle selects the block as NodeSelection', () => {
    const handle = editor.view.dom.querySelector(
      '.umean-drag-handle',
    ) as HTMLElement;
    expect(handle).toBeTruthy();

    const dragEvent = new Event('dragstart', {
      bubbles: true,
      cancelable: true,
    }) as DragEvent;
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        clearData: () => undefined,
        setData: () => undefined,
        effectAllowed: 'uninitialized',
      },
    });

    handle.dispatchEvent(dragEvent);

    expect(editor.state.selection instanceof NodeSelection).toBe(true);
    expect(editor.view.dragging).toBeTruthy();
    expect(editor.view.dragging?.move).toBe(true);
    expect(blockDragHandlePluginKey.getState(editor.state)?.draggingFrom).toBe(
      0,
    );
    expect(editor.view.dom.classList.contains('umean-block-dragging')).toBe(
      true,
    );
  });
});

describe('top-level-only drop', () => {
  let editor: Editor;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    editor = new Editor({
      element,
      extensions: createDefaultExtensions(),
      content: {
        type: 'doc',
        content: [
          {
            type: 'callout',
            attrs: { type: 'info' },
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'tip' }] },
            ],
          },
          {
            type: 'blockquote',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'quote' }] },
            ],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'after' }],
          },
        ],
      },
    });
  });

  afterEach(() => {
    editor.destroy();
    element.remove();
  });

  it('resolveTopLevelDropPos snaps nested positions to top-level gaps', () => {
    let insideQuote = 0;
    let quoteStart = 0;
    editor.state.doc.forEach((node, offset) => {
      if (node.type.name === 'blockquote') {
        quoteStart = offset;
        insideQuote = offset + 2;
      }
    });
    const quoteNode = editor.state.doc.nodeAt(quoteStart)!;
    const quoteEnd = quoteStart + quoteNode.nodeSize;
    const midPos = quoteStart + Math.floor(quoteNode.nodeSize / 2);

    // clientY 在无布局环境下不可靠；用文档位置中点回退路径验证吸附
    const before = resolveTopLevelDropPos(editor.view, quoteStart + 1, 0);
    const after = resolveTopLevelDropPos(editor.view, midPos + 1, 0);

    expect([quoteStart, quoteEnd]).toContain(before);
    expect([quoteStart, quoteEnd]).toContain(after);
    expect(editor.state.doc.resolve(before).depth).toBe(0);
    expect(editor.state.doc.resolve(after).depth).toBe(0);
    expect(insideQuote).toBeGreaterThan(quoteStart);
    expect(insideQuote).toBeLessThan(quoteEnd);
  });

  it('moveTopLevelBlock reorders siblings without nesting into blockquote', () => {
    const calloutStart = 0;
    const callout = editor.state.doc.nodeAt(calloutStart)!;
    expect(callout.type.name).toBe('callout');

    let quoteStart = 0;
    editor.state.doc.forEach((node, offset) => {
      if (node.type.name === 'blockquote') quoteStart = offset;
    });
    const quoteEnd = quoteStart + editor.state.doc.nodeAt(quoteStart)!.nodeSize;

    const moved = moveTopLevelBlock(editor.view, calloutStart, quoteEnd);
    expect(moved).toBe(true);

    const topTypes: string[] = [];
    editor.state.doc.forEach((node) => {
      topTypes.push(node.type.name);
    });
    expect(topTypes).toEqual(['blockquote', 'callout', 'paragraph']);

    const quote = editor.state.doc.child(0);
    expect(quote.type.name).toBe('blockquote');
    expect(quote.childCount).toBe(1);
    expect(quote.firstChild?.type.name).toBe('paragraph');
  });

  it('handleDrop during handle-drag does not nest callout into blockquote', () => {
    const handle = [...editor.view.dom.children].find((el) =>
      el.classList.contains('umean-drag-handle'),
    ) as HTMLElement;
    expect(handle).toBeTruthy();

    const dragEvent = new Event('dragstart', {
      bubbles: true,
      cancelable: true,
    }) as DragEvent;
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        clearData: () => undefined,
        setData: () => undefined,
        effectAllowed: 'uninitialized',
      },
    });
    handle.dispatchEvent(dragEvent);
    expect(blockDragHandlePluginKey.getState(editor.state)?.draggingFrom).toBe(0);

    let quoteStart = 0;
    editor.state.doc.forEach((node, offset) => {
      if (node.type.name === 'blockquote') quoteStart = offset;
    });
    const quoteDom = editor.view.nodeDOM(quoteStart) as HTMLElement;
    const rect = quoteDom.getBoundingClientRect();

    const dropEvent = new Event('drop', {
      bubbles: true,
      cancelable: true,
    }) as DragEvent;
    Object.defineProperty(dropEvent, 'clientX', {
      value: rect.left + rect.width / 2,
    });
    Object.defineProperty(dropEvent, 'clientY', {
      value: rect.top + rect.height / 2,
    });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        getData: () => '',
        files: [],
      },
    });

    editor.view.dom.dispatchEvent(dropEvent);

    const topTypes: string[] = [];
    editor.state.doc.forEach((node) => {
      topTypes.push(node.type.name);
    });
    expect(topTypes).toHaveLength(3);
    expect(topTypes).toContain('callout');
    expect(topTypes).toContain('blockquote');

    let nestedCallout = false;
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'blockquote') {
        node.descendants((child) => {
          if (child.type.name === 'callout') nestedCallout = true;
        });
      }
    });
    expect(nestedCallout).toBe(false);
    expect(editor.view.dom.classList.contains('umean-block-dragging')).toBe(
      false,
    );
  });
});

describe('document mode title locked', () => {
  let editor: Editor;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    editor = new Editor({
      element,
      extensions: createDefaultExtensions({
        headingPolicy: { mode: 'document' },
      }),
      content: '<h1>Title</h1><p>hello</p><p>world</p>',
    });
  });

  afterEach(() => {
    editor.destroy();
    element.remove();
  });

  it('does not render a drag handle on the document title', () => {
    const handles = [...editor.view.dom.children].filter((el) =>
      el.classList.contains('umean-drag-handle'),
    );
    expect(handles.length).toBe(2);

    const title = editor.view.dom.querySelector('h1');
    expect(title).toBeTruthy();
    expect(
      title?.previousElementSibling?.classList.contains('umean-drag-handle') ??
        false,
    ).toBe(false);

    const firstParagraph = editor.view.dom.querySelector('p');
    expect(
      firstParagraph?.previousElementSibling?.classList.contains(
        'umean-drag-handle',
      ),
    ).toBe(true);
  });

  it('rejects dragging the title block', () => {
    const titleEnd = editor.state.doc.firstChild!.nodeSize;
    expect(getMinTopLevelDropPos(editor.state.doc, 'document')).toBe(titleEnd);
    expect(isDocumentTitleBlockPos(editor.state.doc, 0, 'document')).toBe(true);
    expect(moveTopLevelBlock(editor.view, 0, titleEnd + 1, 'document')).toBe(
      false,
    );
    expect(editor.state.doc.firstChild?.textContent).toBe('Title');
  });

  it('clamps drops so blocks cannot move above the title', () => {
    let worldStart = 0;
    editor.state.doc.forEach((node, offset) => {
      if (node.type.name === 'paragraph' && node.textContent === 'world') {
        worldStart = offset;
      }
    });
    const titleEnd = editor.state.doc.firstChild!.nodeSize;

    const moved = moveTopLevelBlock(editor.view, worldStart, 0, 'document');
    expect(moved).toBe(true);

    const topTexts: string[] = [];
    editor.state.doc.forEach((node) => {
      topTexts.push(node.textContent);
    });
    expect(topTexts[0]).toBe('Title');
    expect(topTexts.slice(1)).toEqual(['world', 'hello']);
    expect(editor.state.doc.resolve(titleEnd).depth).toBe(0);
  });
});

describe('BlockMath drag disabled', () => {
  it('marks blockMath as non-draggable in schema', () => {
    const editor = new Editor({
      extensions: createDefaultExtensions(),
      content: {
        type: 'doc',
        content: [{ type: 'blockMath', attrs: { latex: 'x' } }],
      },
    });

    expect(editor.schema.nodes.blockMath.spec.draggable).toBe(false);
    expect(editor.view.dom.querySelector('.block-math-nodeview')).toBeTruthy();

    editor.destroy();
  });
});

describe('handles on NodeView blocks', () => {
  it('renders handles before math / code / mermaid blocks', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const editor = new Editor({
      element,
      extensions: createDefaultExtensions(),
      content: {
        type: 'doc',
        content: [
          { type: 'blockMath', attrs: { latex: 'x' } },
          {
            type: 'codeBlock',
            attrs: { language: 'javascript' },
            content: [{ type: 'text', text: 'const a = 1' }],
          },
          {
            type: 'codeBlock',
            attrs: { language: 'mermaid' },
            content: [{ type: 'text', text: 'graph TD; A-->B' }],
          },
        ],
      },
    });

    const handles = [...editor.view.dom.children].filter((el) =>
      el.classList.contains('umean-drag-handle'),
    );
    expect(handles.length).toBe(3);

    const math = editor.view.dom.querySelector('.block-math-nodeview');
    const code = editor.view.dom.querySelector('.code-block-nodeview');
    const mermaid = editor.view.dom.querySelector('.mermaid-nodeview');
    expect(math?.previousElementSibling?.classList.contains('umean-drag-handle')).toBe(
      true,
    );
    expect(code?.previousElementSibling?.classList.contains('umean-drag-handle')).toBe(
      true,
    );
    expect(
      mermaid?.previousElementSibling?.classList.contains('umean-drag-handle'),
    ).toBe(true);

    editor.destroy();
    element.remove();
  });
});
