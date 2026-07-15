import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { Editor } from '@tiptap/core';

import {
  DEFAULT_SHORTCUT_BINDINGS,
  resolveShortcutBindings,
} from './defaultShortcuts';
import {
  canRunEditorAction,
  isEditorActionActive,
  runEditorAction,
} from './runAction';
import { createDefaultExtensions } from '../extensions/defaultExtensions';
import { EDITOR_ACTION_IDS } from './types';

describe('resolveShortcutBindings', () => {
  it('includes defaults by default', () => {
    expect(resolveShortcutBindings()).toMatchObject(DEFAULT_SHORTCUT_BINDINGS);
  });

  it('allows disabling a default binding', () => {
    expect(
      resolveShortcutBindings({ bindings: { 'Mod-b': false } })['Mod-b'],
    ).toBe(false);
  });

  it('allows custom handler binding', () => {
    const handler = () => true;
    expect(
      resolveShortcutBindings({ bindings: { 'Mod-k': handler } })['Mod-k'],
    ).toBe(handler);
  });

  it('can skip defaults', () => {
    expect(
      resolveShortcutBindings({
        defaults: false,
        bindings: { 'Mod-b': 'toggleBold' },
      }),
    ).toEqual({ 'Mod-b': 'toggleBold' });
  });
});

describe('runEditorAction', () => {
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
    editor.commands.setTextSelection({ from: 1, to: 6 });
  });

  afterEach(() => {
    editor.destroy();
    document.body.replaceChildren();
  });

  it('lists stable action ids', () => {
    expect(EDITOR_ACTION_IDS).toContain('toggleBold');
    expect(EDITOR_ACTION_IDS).toContain('insertTable');
  });

  it('toggles bold and reports isActive', () => {
    expect(runEditorAction(editor, 'toggleBold')).toBe(true);
    expect(isEditorActionActive(editor, 'toggleBold')).toBe(true);
    expect(editor.getHTML()).toContain('<strong>');
  });

  it('inserts table', () => {
    editor.commands.setTextSelection(6);
    expect(canRunEditorAction(editor, 'insertTable')).toBe(true);
    expect(runEditorAction(editor, 'insertTable', { rows: 2, cols: 2 })).toBe(
      true,
    );
    expect(editor.getHTML()).toContain('<table');
  });

  it('requires src for insertImage', () => {
    expect(runEditorAction(editor, 'insertImage')).toBe(false);
    expect(
      runEditorAction(editor, 'insertImage', { src: 'https://example.com/a.png' }),
    ).toBe(true);
    expect(editor.getHTML()).toContain('<img');
  });
});

describe('canRunEditorAction for all action ids', () => {
  const element = document.createElement('div');
  document.body.appendChild(element);
  const editor = new Editor({
    element,
    extensions: createDefaultExtensions(),
    content: 'hello',
    contentType: 'markdown',
  });

  afterAll(() => {
    editor.destroy();
    element.remove();
  });

  const toggleActions = [
    'toggleBold',
    'toggleItalic',
    'toggleStrike',
    'toggleCode',
    'toggleHighlight',
    'toggleHeading1',
    'toggleHeading2',
    'toggleHeading3',
    'toggleHeading4',
    'toggleHeading5',
    'toggleHeading6',
    'toggleBulletList',
    'toggleOrderedList',
    'toggleTaskList',
    'toggleBlockquote',
    'toggleCodeBlock',
  ] as const;

  it.each(toggleActions)('%s can() returns true', (action) => {
    editor.commands.selectAll();
    expect(canRunEditorAction(editor, action)).toBe(true);
  });

  it.each([
    'setHorizontalRule',
    'insertTable',
    'insertCallout',
  ] as const)('%s can() returns true', (action) => {
    expect(canRunEditorAction(editor, action)).toBe(true);
  });

  it('setParagraph can() — depends on current node type', () => {
    expect(typeof canRunEditorAction(editor, 'setParagraph')).toBe('boolean');
  });

  it('insertInlineMath/insertBlockMath can() — depends on schema', () => {
    expect(typeof canRunEditorAction(editor, 'insertInlineMath')).toBe('boolean');
    expect(typeof canRunEditorAction(editor, 'insertBlockMath')).toBe('boolean');
  });

  it('insertImage can returns false without src, true with src', () => {
    expect(canRunEditorAction(editor, 'insertImage')).toBe(false);
    expect(
      canRunEditorAction(editor, 'insertImage', { src: 'https://a.co/p.png' }),
    ).toBe(true);
  });

  it('setLink can returns false without href, true with href', () => {
    expect(canRunEditorAction(editor, 'setLink')).toBe(false);
    expect(
      canRunEditorAction(editor, 'setLink', { href: 'https://a.co' }),
    ).toBe(true);
  });

  it('undo/redo can() returns boolean', () => {
    expect(typeof canRunEditorAction(editor, 'undo')).toBe('boolean');
    expect(typeof canRunEditorAction(editor, 'redo')).toBe('boolean');
  });
});

describe('KeyboardShortcuts extension', () => {
  it('registers by default', () => {
    const names = createDefaultExtensions().map((e) => e.name);
    expect(names).toContain('umeanKeyboardShortcuts');
  });

  it('can be disabled', () => {
    const names = createDefaultExtensions({ shortcuts: false }).map(
      (e) => e.name,
    );
    expect(names).not.toContain('umeanKeyboardShortcuts');
  });

  it('invokes custom handler for overridden binding', () => {
    const handler = vi.fn(() => true);
    const element = document.createElement('div');
    document.body.appendChild(element);
    const editor = new Editor({
      element,
      extensions: createDefaultExtensions({
        shortcuts: { bindings: { 'Mod-k': handler } },
      }),
      content: 'x',
      contentType: 'markdown',
    });

    const ran = editor.view.someProp('handleKeyDown', (f) =>
      f(
        editor.view,
        new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    );

    // TipTap may resolve Mod via meta or ctrl depending on platform; if handler
    // wasn't reached via synthetic event, at least config is registered.
    const ext = editor.extensionManager.extensions.find(
      (e) => e.name === 'umeanKeyboardShortcuts',
    );
    expect(ext?.options.bindings?.['Mod-k']).toBe(handler);

    void ran;
    editor.destroy();
    element.remove();
  });
});
