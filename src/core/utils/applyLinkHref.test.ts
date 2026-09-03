import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

import { applyLinkHref, normalizeLinkHref } from './applyLinkHref';

describe('normalizeLinkHref', () => {
  it('trims and prefixes https when there is no scheme', () => {
    expect(normalizeLinkHref(' example.com ')).toBe('https://example.com');
  });

  it('keeps existing schemes and empty input', () => {
    expect(normalizeLinkHref('https://a.co')).toBe('https://a.co');
    expect(normalizeLinkHref('mailto:a@b.c')).toBe('mailto:a@b.c');
    expect(normalizeLinkHref('  ')).toBe('');
  });
});

describe('applyLinkHref', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  function createEditor(content = '<p>hello</p>') {
    editor = new Editor({
      extensions: [
        StarterKit.configure({ link: false }),
        Link.configure({ openOnClick: false, autolink: true }),
      ],
      content,
    });
    return editor;
  }

  it('wraps a non-empty selection', () => {
    createEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });
    expect(applyLinkHref(editor, 'example.com')).toBe(true);
    expect(editor.getHTML()).toContain('href="https://example.com"');
    expect(editor.getHTML()).toContain('hello');
  });

  it('inserts linked text when the selection is empty', () => {
    createEditor('<p></p>');
    editor.commands.setTextSelection(1);
    expect(applyLinkHref(editor, 'https://a.co/x')).toBe(true);
    expect(editor.getHTML()).toContain('href="https://a.co/x"');
    expect(editor.getText()).toContain('https://a.co/x');
  });

  it('unsets the link when href is empty', () => {
    createEditor('<p><a href="https://a.co">hello</a></p>');
    editor.commands.setTextSelection(2);
    expect(applyLinkHref(editor, '')).toBe(true);
    expect(editor.getHTML()).not.toContain('href=');
  });

  it('wraps a captured range after the live selection collapsed', () => {
    createEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });
    editor.commands.setTextSelection(6);
    expect(applyLinkHref(editor, 'example.com', { from: 1, to: 6 })).toBe(
      true,
    );
    expect(editor.getHTML()).toContain('href="https://example.com"');
    expect(editor.getText()).toBe('hello');
    expect(editor.getText()).not.toContain('https://');
  });

  it('updates the current link when the caret is collapsed inside it', () => {
    createEditor('<p><a href="https://a.co">hello</a></p>');
    editor.commands.setTextSelection(3);
    expect(applyLinkHref(editor, 'b.co')).toBe(true);
    expect(editor.getHTML()).toContain('href="https://b.co"');
    expect(editor.getText()).toBe('hello');
  });

  it('restores a collapsed caret so an existing link is updated, not duplicated', () => {
    createEditor('<p><a href="https://a.co">hello</a> world</p>');
    editor.commands.setTextSelection(3);
    editor.commands.setTextSelection(8);
    expect(applyLinkHref(editor, 'b.co', { from: 3, to: 3 })).toBe(true);
    expect(editor.getHTML()).toContain('href="https://b.co"');
    expect(editor.getHTML()).not.toContain('https://a.co');
    expect(editor.getText()).toBe('hello world');
  });

  it('places the caret after the link so further typing is plain', () => {
    createEditor();
    editor.commands.setTextSelection({ from: 1, to: 6 });
    applyLinkHref(editor, 'example.com');
    editor.commands.insertContent('x');
    expect(editor.getHTML()).toContain('</a>x');
    expect(editor.getText()).toBe('hellox');
  });
});
