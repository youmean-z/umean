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
});
