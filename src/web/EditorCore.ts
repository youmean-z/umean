import { Editor, type JSONContent } from '@tiptap/core';

import { createDefaultExtensions } from '../core/extensions/defaultExtensions';
import { emptyDoc } from '../core/types';
import type { EditorCoreOptions } from './types';

export class EditorCore {
  readonly editor: Editor;
  private _onDestroy?: () => void;

  constructor(options: EditorCoreOptions = {}) {
    const {
      extensions,
      extensionOptions,
      content = emptyDoc,
      contentType = 'json',
      onUpdate,
      onDestroy,
      ...editorOptions
    } = options;

    this._onDestroy = onDestroy;

    this.editor = new Editor({
      ...editorOptions,
      extensions: extensions ?? createDefaultExtensions(extensionOptions),
      content,
      contentType,
      onUpdate: ({ editor }) => {
        onUpdate?.({
          editor,
          json: editor.getJSON(),
          html: editor.getHTML(),
          markdown: editor.getMarkdown(),
        });
      },
    });
  }

  getJSON(): JSONContent {
    return this.editor.getJSON();
  }

  setJSON(json: JSONContent): void {
    this.editor.commands.setContent(json);
  }

  getHTML(): string {
    return this.editor.getHTML();
  }

  setHTML(html: string): void {
    this.editor.commands.setContent(html, { contentType: 'html' });
  }

  getMarkdown(): string {
    return this.editor.getMarkdown();
  }

  setMarkdown(markdown: string): void {
    this.editor.commands.setContent(markdown, { contentType: 'markdown' });
  }

  /** @deprecated TipTap v3 no longer supports manual mount — pass `element` in constructor options instead. */
  mount(_element: HTMLElement): void {
    throw new Error(
      'EditorCore.mount() is not supported in TipTap v3. Pass `element` in constructor options instead.',
    );
  }

  /** @deprecated TipTap v3 no longer supports manual unmount. */
  unmount(): void {
    throw new Error(
      'EditorCore.unmount() is not supported in TipTap v3. The editor is automatically unmounted on destroy.',
    );
  }

  focus(): void {
    this.editor.commands.focus();
  }

  destroy(): void {
    this._onDestroy?.();
    this.editor.destroy();
  }
}
