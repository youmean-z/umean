import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';

import { createDefaultExtensions } from './defaultExtensions';
import { getDirtyState } from './dirtyState';

describe('DirtyState', () => {
  let editor: Editor;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    editor = new Editor({
      element,
      extensions: createDefaultExtensions(),
      content: '<p>hello</p>',
    });
  });

  afterEach(() => {
    editor.destroy();
    element.remove();
  });

  it('registers by default and starts clean', () => {
    expect(createDefaultExtensions().map((e) => e.name)).toContain(
      'umeanDirtyState',
    );
    expect(getDirtyState(editor)).toBe(false);
  });

  it('marks dirty on user edit', () => {
    editor.commands.insertContent('!');
    expect(getDirtyState(editor)).toBe(true);
  });

  it('markClean resets dirty', () => {
    editor.commands.insertContent('!');
    expect(editor.commands.markClean()).toBe(true);
    expect(getDirtyState(editor)).toBe(false);
  });

  it('can be disabled', () => {
    expect(
      createDefaultExtensions({ dirtyState: false }).map((e) => e.name),
    ).not.toContain('umeanDirtyState');
  });
});

describe('DirtyState with headingPolicy', () => {
  it('policy auto-fix does not leave dirty after markClean on load', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const editor = new Editor({
      element,
      extensions: createDefaultExtensions({
        headingPolicy: { mode: 'document' },
      }),
      content: '<p>body</p>',
    });

    // document mode may rewrite first block to h1 — that path uses skipDirty / markClean
    editor.commands.markClean();
    expect(getDirtyState(editor)).toBe(false);

    editor.commands.insertContent('x');
    expect(getDirtyState(editor)).toBe(true);

    editor.destroy();
    element.remove();
  });
});
