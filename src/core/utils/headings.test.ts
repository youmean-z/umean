import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

import { createDefaultExtensions } from '../extensions/defaultExtensions';
import {
  buildHeadingTree,
  collectFlatHeadings,
  getHeadings,
  scrollToHeading,
} from './headings';

describe('collectFlatHeadings / buildHeadingTree', () => {
  it('builds a nested tree by level', () => {
    const editor = new Editor({
      extensions: [StarterKit],
      content: `
        <h1>A</h1>
        <h2>A1</h2>
        <h2>A2</h2>
        <h3>A2a</h3>
        <h1>B</h1>
      `,
    });

    const flat = collectFlatHeadings(editor.state.doc);
    expect(flat.map((h) => h.text)).toEqual(['A', 'A1', 'A2', 'A2a', 'B']);
    expect(flat.every((h) => h.id.startsWith('h-'))).toBe(true);

    const tree = buildHeadingTree(flat);
    expect(tree).toHaveLength(2);
    expect(tree[0].text).toBe('A');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[1].text).toBe('A2');
    expect(tree[0].children[1].children[0].text).toBe('A2a');
    expect(tree[1].text).toBe('B');
    expect(tree[1].children).toHaveLength(0);

    editor.destroy();
  });
});

describe('getHeadings / scrollToHeading', () => {
  let editor: Editor;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    editor = new Editor({
      element,
      extensions: createDefaultExtensions(),
      content: '<h2>First</h2><p>body</p><h3>Second</h3>',
    });
  });

  afterEach(() => {
    editor.destroy();
    element.remove();
  });

  it('returns heading tree from editor', () => {
    const headings = getHeadings(editor);
    expect(headings).toHaveLength(1);
    expect(headings[0].text).toBe('First');
    expect(headings[0].level).toBe(2);
    expect(headings[0].children[0].text).toBe('Second');
  });

  it('scrollToHeading moves selection into the heading', () => {
    const [first] = getHeadings(editor);
    expect(scrollToHeading(editor, first.pos)).toBe(true);
    expect(editor.isActive('heading', { level: 2 })).toBe(true);

    const child = first.children[0];
    expect(scrollToHeading(editor, child.pos)).toBe(true);
    expect(editor.isActive('heading', { level: 3 })).toBe(true);
  });

  it('scrollToHeading returns false for invalid pos', () => {
    expect(scrollToHeading(editor, 1)).toBe(false);
  });
});
