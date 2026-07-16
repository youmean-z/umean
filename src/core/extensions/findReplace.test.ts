import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';

import { createDefaultExtensions } from './defaultExtensions';
import {
  collectFindMatches,
  findReplacePluginKey,
  getFindReplaceState,
} from './findReplace';

describe('collectFindMatches', () => {
  it('finds case-insensitive matches by default', () => {
    const editor = new Editor({
      extensions: createDefaultExtensions({ findReplace: false }),
      content: '<p>Hello hello HELLO</p>',
    });
    const matches = collectFindMatches(editor.state.doc, 'hello', false);
    expect(matches).toHaveLength(3);
    editor.destroy();
  });

  it('respects caseSensitive', () => {
    const editor = new Editor({
      extensions: createDefaultExtensions({ findReplace: false }),
      content: '<p>Hello hello</p>',
    });
    expect(collectFindMatches(editor.state.doc, 'Hello', true)).toHaveLength(1);
    editor.destroy();
  });
});

describe('FindReplace', () => {
  let editor: Editor;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    editor = new Editor({
      element,
      extensions: createDefaultExtensions(),
      content: '<p>one two one two one</p>',
    });
  });

  afterEach(() => {
    editor.destroy();
    element.remove();
  });

  it('registers by default and can be disabled', () => {
    expect(createDefaultExtensions().map((e) => e.name)).toContain(
      'umeanFindReplace',
    );
    expect(
      createDefaultExtensions({ findReplace: false }).map((e) => e.name),
    ).not.toContain('umeanFindReplace');
  });

  it('setFindQuery highlights matches and selects first from cursor', () => {
    editor.commands.setTextSelection(1);
    expect(editor.commands.setFindQuery('one')).toBe(true);

    const state = getFindReplaceState(editor);
    expect(state?.matches).toHaveLength(3);
    expect(state?.activeIndex).toBe(0);
    expect(state?.decorations.find().length).toBe(3);
    expect(editor.state.selection.from).toBe(state!.matches[0].from);
    expect(editor.state.selection.to).toBe(state!.matches[0].to);
  });

  it('setFindQuery can preview without selecting or focusing', () => {
    editor.commands.setTextSelection(1);
    const fromBefore = editor.state.selection.from;
    expect(
      editor.commands.setFindQuery('one', { select: false, focus: false }),
    ).toBe(true);

    const state = getFindReplaceState(editor);
    expect(state?.matches).toHaveLength(3);
    expect(editor.state.selection.from).toBe(fromBefore);
  });

  it('findNext selects current first when selection is not on it', () => {
    editor.commands.setTextSelection(1);
    editor.commands.setFindQuery('one', { select: false, focus: false });

    expect(editor.commands.findNext()).toBe(true);
    expect(getFindReplaceState(editor)?.activeIndex).toBe(0);
    expect(editor.state.selection.from).toBe(
      getFindReplaceState(editor)!.matches[0].from,
    );

    expect(editor.commands.findNext()).toBe(true);
    expect(getFindReplaceState(editor)?.activeIndex).toBe(1);
  });

  it('findNext and findPrevious cycle active match', () => {
    editor.commands.setTextSelection(1);
    editor.commands.setFindQuery('one');

    expect(editor.commands.findNext()).toBe(true);
    expect(getFindReplaceState(editor)?.activeIndex).toBe(1);

    expect(editor.commands.findNext()).toBe(true);
    expect(getFindReplaceState(editor)?.activeIndex).toBe(2);

    expect(editor.commands.findNext()).toBe(true);
    expect(getFindReplaceState(editor)?.activeIndex).toBe(0);

    expect(editor.commands.findPrevious()).toBe(true);
    expect(getFindReplaceState(editor)?.activeIndex).toBe(2);
  });

  it('replaceCurrent replaces active match and advances', () => {
    editor.commands.setTextSelection(1);
    editor.commands.setFindQuery('one');

    expect(editor.commands.replaceCurrent('xxx')).toBe(true);
    expect(getFindReplaceState(editor)?.matches).toHaveLength(2);
    expect(editor.getText()).toBe('xxx two one two one');
  });

  it('replaceAll replaces every match', () => {
    editor.commands.setFindQuery('one');
    expect(editor.commands.replaceAll('x')).toBe(true);
    expect(editor.getText()).toBe('x two x two x');
    expect(getFindReplaceState(editor)?.matches).toHaveLength(0);
  });

  it('clearFind removes highlights', () => {
    editor.commands.setFindQuery('two');
    expect(getFindReplaceState(editor)?.matches.length).toBeGreaterThan(0);
    expect(editor.commands.clearFind()).toBe(true);
    const state = findReplacePluginKey.getState(editor.state);
    expect(state?.query).toBe('');
    expect(state?.matches).toHaveLength(0);
    expect(state?.decorations.find()).toHaveLength(0);
  });

  it('returns false for findNext when there is no query', () => {
    expect(editor.commands.findNext()).toBe(false);
    expect(editor.commands.replaceCurrent('x')).toBe(false);
    expect(editor.commands.replaceAll('x')).toBe(false);
  });
});
