import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';

import { createDefaultExtensions } from './defaultExtensions';
import { isAtEndOfLink } from './linkExit';

describe('LinkExit', () => {
  let editor: Editor;

  beforeEach(() => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    editor = new Editor({
      element,
      extensions: createDefaultExtensions(),
      content: 'hello',
      contentType: 'markdown',
    });
  });

  afterEach(() => {
    editor.destroy();
    document.body.replaceChildren();
  });

  it('registers linkExit when link is enabled', () => {
    const names = createDefaultExtensions().map((e) => e.name);
    expect(names).toContain('linkExit');
  });

  it('omits linkExit when link: false', () => {
    const names = createDefaultExtensions({ link: false }).map((e) => e.name);
    expect(names).not.toContain('linkExit');
  });

  it('exitLink clears stored mark so following text is not linked', () => {
    editor.commands.setTextSelection({ from: 1, to: 6 });
    editor.commands.setLink({ href: 'https://example.com' });
    // place caret at end of "hello" (pos after last char within doc)
    editor.commands.setTextSelection(6);

    expect(isAtEndOfLink(editor.state)).toBe(true);
    expect(editor.commands.exitLink()).toBe(true);

    editor.commands.insertContent(' world');
    const html = editor.getHTML();
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('>hello</a>');
    expect(html).toMatch(/<\/a> world|<\/a>world/);
    expect(html).not.toMatch(/hello world<\/a>/);
  });

  it('unsetLink still removes the whole link', () => {
    editor.commands.setTextSelection({ from: 1, to: 6 });
    editor.commands.setLink({ href: 'https://example.com' });
    editor.commands.setTextSelection(3);
    expect(editor.commands.unsetLink()).toBe(true);
    expect(editor.getHTML()).not.toContain('href=');
  });
});
