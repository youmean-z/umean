import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EditorCore } from './EditorCore';

describe('EditorCore', () => {
  let container: HTMLElement;
  let core: EditorCore;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    core?.destroy();
    container?.remove();
  });

  it('creates an editor with default options', () => {
    core = new EditorCore({ element: container });
    expect(core.editor).toBeDefined();
    expect(core.getJSON().type).toBe('doc');
  });

  it('getJSON returns empty doc by default', () => {
    core = new EditorCore({ element: container });
    const json = core.getJSON();
    expect(json.type).toBe('doc');
  });

  it('getHTML returns HTML string', () => {
    core = new EditorCore({ element: container });
    const html = core.getHTML();
    expect(typeof html).toBe('string');
  });

  it('getMarkdown returns markdown string', () => {
    core = new EditorCore({ element: container });
    const md = core.getMarkdown();
    expect(typeof md).toBe('string');
  });

  it('setJSON updates content', () => {
    core = new EditorCore({ element: container });
    core.setJSON({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }],
    });
    const html = core.getHTML();
    expect(html).toContain('Hi');
  });

  it('setMarkdown updates content', () => {
    core = new EditorCore({ element: container });
    core.setMarkdown('# Title');
    const html = core.getHTML();
    expect(html).toContain('<h1>Title</h1>');
  });

  it('focus does not throw', () => {
    core = new EditorCore({ element: container });
    expect(() => core.focus()).not.toThrow();
  });

  it('destroy calls onDestroy callback', () => {
    let called = false;
    core = new EditorCore({ element: container, onDestroy: () => { called = true; } });
    core.destroy();
    expect(called).toBe(true);
  });

  it('onUpdate fires when setJSON changes content', () => {
    const events: any[] = [];
    core = new EditorCore({
      element: container,
      onUpdate: (payload) => { events.push(payload); },
    });

    core.setJSON({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }],
    });

    expect(events.length).toBeGreaterThanOrEqual(1);
    const last = events[events.length - 1];
    expect(last.json).toBeDefined();
    expect(last.html).toBeDefined();
    expect(last.markdown).toBeDefined();
    expect(last.editor).toBeDefined();
  });

  it('mount throws deprecation error', () => {
    core = new EditorCore({ element: container });
    expect(() => core.mount(document.createElement('div'))).toThrow(/not supported/);
  });

  it('unmount throws deprecation error', () => {
    core = new EditorCore({ element: container });
    expect(() => core.unmount()).toThrow(/not supported/);
  });

  it('setLink / unsetLink / getLinkHref work on selection', () => {
    core = new EditorCore({ element: container });
    core.setMarkdown('visit docs');
    core.editor.commands.setTextSelection({ from: 1, to: 6 });

    expect(core.setLink('https://example.com')).toBe(true);
    expect(core.isLinkActive()).toBe(true);
    expect(core.getLinkHref()).toBe('https://example.com');
    expect(core.getHTML()).toContain('href="https://example.com"');
    expect(core.getHTML()).toContain('target="_blank"');
    expect(core.getMarkdown()).toMatch(/\[visit\]\(https:\/\/example\.com\/?\)/);

    expect(core.unsetLink()).toBe(true);
    expect(core.isLinkActive()).toBe(false);
    expect(core.getLinkHref()).toBeNull();
  });

  it('exitLink keeps existing link but stops extending it', () => {
    core = new EditorCore({ element: container });
    core.setMarkdown('visit');
    core.editor.commands.setTextSelection({ from: 1, to: 6 });
    expect(core.setLink('https://example.com')).toBe(true);
    core.editor.commands.setTextSelection(6);
    expect(core.exitLink()).toBe(true);
    core.editor.commands.insertContent(' now');
    const html = core.getHTML();
    expect(html).toContain('>visit</a>');
    expect(html).not.toMatch(/visit now<\/a>/);
  });

  it('run / can / isActive share action ids', () => {
    core = new EditorCore({ element: container });
    core.setMarkdown('hello');
    core.editor.commands.setTextSelection({ from: 1, to: 6 });
    expect(core.can('toggleBold')).toBe(true);
    expect(core.run('toggleBold')).toBe(true);
    expect(core.isActive('toggleBold')).toBe(true);
  });

  it('onSelectionUpdate receives action helpers', () => {
    const payloads: any[] = [];
    core = new EditorCore({
      element: container,
      content: 'hi',
      contentType: 'markdown',
      onSelectionUpdate: (p) => payloads.push(p),
    });
    core.editor.commands.setTextSelection({ from: 1, to: 3 });
    expect(payloads.length).toBeGreaterThan(0);
    const last = payloads[payloads.length - 1];
    expect(typeof last.isActive).toBe('function');
    expect(typeof last.can).toBe('function');
  });

  it('accepts top-level shortcuts option', () => {
    const handler = () => true;
    core = new EditorCore({
      element: container,
      shortcuts: { bindings: { 'Mod-k': handler } },
    });
    const ext = core.editor.extensionManager.extensions.find(
      (e) => e.name === 'umeanKeyboardShortcuts',
    );
    expect(ext?.options.bindings?.['Mod-k']).toBe(handler);
  });

  it('insertTemplate inserts fragment at selection', () => {
    core = new EditorCore({ element: container });
    core.setJSON({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }],
    });
    core.editor.commands.setTextSelection(2);
    expect(
      core.insertTemplate({
        type: 'paragraph',
        content: [{ type: 'text', text: 'tpl' }],
      }),
    ).toBe(true);
    expect(core.getHTML()).toContain('tpl');
  });

  it('insertTemplate unwraps doc content', () => {
    core = new EditorCore({ element: container });
    expect(
      core.insertTemplate({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'T' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'body' }] },
        ],
      }),
    ).toBe(true);
    expect(core.getHTML()).toContain('<h2>T</h2>');
    expect(core.getHTML()).toContain('body');
  });

  it('word / char counts work', () => {
    core = new EditorCore({
      element: container,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'hi 你' }],
          },
        ],
      },
    });
    expect(core.getWordCount()).toBe(2);
    expect(core.getCharCount()).toBe(4);
    core.editor.commands.setTextSelection({ from: 1, to: 3 });
    expect(core.getSelectedWordCount()).toBe(1);
  });

  it('setEditable toggles readonly', () => {
    core = new EditorCore({ element: container });
    expect(core.isEditable()).toBe(true);
    core.setEditable(false);
    expect(core.isEditable()).toBe(false);
    expect(core.editor.view.dom.getAttribute('contenteditable')).toBe('false');
    core.setEditable(true);
    expect(core.isEditable()).toBe(true);
  });

  it('getShortcutList reflects configured bindings', () => {
    core = new EditorCore({
      element: container,
      shortcuts: { bindings: { 'Mod-b': false } },
    });
    const list = core.getShortcutList();
    expect(list.find((i) => i.keys === 'Mod-b')?.disabled).toBe(true);
    expect(list.find((i) => i.keys === 'Mod-b')?.label).toBe('已禁用');
    expect(list.find((i) => i.keys === 'Mod-i')?.label).toBe('斜体');
  });
});
