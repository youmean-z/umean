import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';

import { filterSlashItems } from '../commands/slashItems';
import { createDefaultExtensions } from './defaultExtensions';
import { findSlashMatch, slashPluginKey } from './slashCommand';

describe('filterSlashItems', () => {
  it('filters by chinese keyword', () => {
    const items = [
      {
        id: 'toggleHeading1',
        action: 'toggleHeading1' as const,
        title: '一级标题',
        keywords: ['标题', 'h1'],
      },
      {
        id: 'insertTable',
        action: 'insertTable' as const,
        title: '表格',
        keywords: ['table'],
      },
    ];
    expect(filterSlashItems(items, '标题').map((i) => i.id)).toEqual([
      'toggleHeading1',
    ]);
    expect(filterSlashItems(items, 'table').map((i) => i.id)).toEqual([
      'insertTable',
    ]);
  });
});

describe('SlashCommand', () => {
  let editor: Editor;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    element.className = 'umean-editor';
    document.body.appendChild(element);
    editor = new Editor({
      element,
      extensions: createDefaultExtensions({
        slash: {
          onRequest: ({ item, apply }) => {
            if (item.action === 'insertImage') {
              apply({ src: 'https://example.com/a.png' });
              return true;
            }
          },
        },
      }),
      content: '',
      contentType: 'markdown',
    });
  });

  afterEach(() => {
    editor.destroy();
    element.remove();
    document.querySelectorAll('.umean-slash').forEach((node) => node.remove());
  });

  it('registers slash extension by default', () => {
    const names = createDefaultExtensions().map((e) => e.name);
    expect(names).toContain('umeanSlashCommand');
  });

  it('can be disabled', () => {
    const names = createDefaultExtensions({ slash: false }).map((e) => e.name);
    expect(names).not.toContain('umeanSlashCommand');
  });

  it('findSlashMatch detects /query after whitespace', () => {
    editor.commands.setContent('hello /tab');
    editor.commands.focus('end');
    const match = findSlashMatch(editor.state, '/');
    expect(match).toMatchObject({ query: 'tab' });
  });

  it('activates plugin state when typing slash', () => {
    editor.commands.setContent('<p></p>');
    editor.commands.setTextSelection(1);
    editor.commands.insertContent('/');
    const slash = slashPluginKey.getState(editor.state);
    expect(slash?.active).toBe(true);
    expect(slash?.items.length).toBeGreaterThan(0);
  });

  it('filters items by query', () => {
    editor.commands.setContent('<p></p>');
    editor.commands.setTextSelection(1);
    editor.commands.insertContent('/表格');
    const slash = slashPluginKey.getState(editor.state);
    expect(slash?.active).toBe(true);
    expect(slash?.items.some((i) => i.action === 'insertTable')).toBe(true);
    expect(slash?.items.every((i) =>
      [i.title, i.id, i.action, ...(i.keywords ?? [])]
        .join(' ')
        .toLowerCase()
        .includes('表格') ||
      i.action === 'insertTable' ||
      (i.keywords ?? []).some((k) => k.includes('table') || k.includes('表格')),
    )).toBe(true);
  });

  it('Enter executes selected item and removes slash query', () => {
    editor.commands.setContent('<p></p>');
    editor.commands.setTextSelection(1);
    editor.commands.insertContent('/hr');
    // move activeIndex to horizontal rule if needed
    const slash = slashPluginKey.getState(editor.state);
    const hrIndex = slash?.items.findIndex((i) => i.action === 'setHorizontalRule') ?? -1;
    expect(hrIndex).toBeGreaterThanOrEqual(0);
    editor.view.dispatch(
      editor.state.tr.setMeta(slashPluginKey, { activeIndex: hrIndex }),
    );

    const handled = editor.view.someProp('handleKeyDown', (f) =>
      f(
        editor.view,
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    expect(handled).toBe(true);
    expect(editor.getHTML()).toContain('<hr');
    expect(editor.getText()).not.toContain('/hr');
  });

  it('renders DOM menu while active', () => {
    editor.commands.setContent('<p></p>');
    editor.commands.setTextSelection(1);
    editor.commands.insertContent('/');
    const menu = document.querySelector('.umean-slash') as HTMLElement | null;
    expect(menu).toBeTruthy();
    expect(menu!.style.display).not.toBe('none');
    expect(menu!.querySelectorAll('.umean-slash-item').length).toBeGreaterThan(0);
    expect(menu!.parentElement).toBe(document.body);
  });
});

describe('computeSlashMenuPosition', () => {
  it('opens below when there is enough space', async () => {
    const { computeSlashMenuPosition } = await import('./slashCommand');
    const pos = computeSlashMenuPosition({
      caret: { top: 40, bottom: 56, left: 20 },
      menu: { width: 220, height: 200 },
      viewport: { width: 800, height: 600 },
    });
    expect(pos.preferAbove).toBe(false);
    expect(pos.top).toBe(62);
  });

  it('flips above when near viewport bottom', async () => {
    const { computeSlashMenuPosition } = await import('./slashCommand');
    const pos = computeSlashMenuPosition({
      caret: { top: 170, bottom: 186, left: 20 },
      menu: { width: 220, height: 200 },
      viewport: { width: 800, height: 200 },
    });
    expect(pos.preferAbove).toBe(true);
    expect(pos.top).toBeLessThan(170);
  });
});
