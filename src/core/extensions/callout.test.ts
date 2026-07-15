import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';

import { createDefaultExtensions } from './defaultExtensions';
import { markdownToJSON, jsonToMarkdown } from '../utils/transform';

describe('Highlight + Callout', () => {
  let editor: Editor;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    editor = new Editor({
      element,
      extensions: createDefaultExtensions(),
      content: '',
    });
  });

  afterEach(() => {
    editor.destroy();
    element.remove();
  });

  it('registers highlight and callout by default', () => {
    const names = createDefaultExtensions().map((e) => e.name);
    expect(names).toContain('highlight');
    expect(names).toContain('callout');
  });

  it('can disable highlight and callout', () => {
    const names = createDefaultExtensions({
      rich: { highlight: false, callout: false },
    }).map((e) => e.name);
    expect(names).not.toContain('highlight');
    expect(names).not.toContain('callout');
  });

  it('toggles highlight mark', () => {
    editor.commands.setContent('<p>hello</p>');
    editor.commands.setTextSelection({ from: 1, to: 6 });
    expect(editor.commands.toggleHighlight()).toBe(true);
    expect(editor.isActive('highlight')).toBe(true);
    expect(editor.getHTML()).toContain('<mark');
  });

  it('inserts callout via command', () => {
    expect(editor.commands.setCallout({ type: 'warning' })).toBe(true);
    expect(editor.isActive('callout')).toBe(true);
    expect(editor.getHTML()).toContain('data-callout-type="warning"');
    expect(editor.getHTML()).toContain('umean-callout--warning');
  });

  it('round-trips ==highlight== markdown', () => {
    const json = markdownToJSON('这是 ==重点== 内容');
    const md = jsonToMarkdown(json);
    expect(md).toContain('==重点==');
  });

  it('round-trips Obsidian callout markdown', () => {
    const source = `> [!tip]
> 记得提交前跑测试。
`;
    const json = markdownToJSON(source);
    const callout = json.content?.find((n) => n.type === 'callout');
    expect(callout?.attrs?.type).toBe('tip');
    const md = jsonToMarkdown(json);
    expect(md).toContain('> [!tip]');
    expect(md).toMatch(/>\s*记得提交前跑测试/);
  });
});
