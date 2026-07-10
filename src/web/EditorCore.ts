import { Editor, type JSONContent } from '@tiptap/core';

import { createDefaultExtensions } from '../core/extensions/defaultExtensions';
import { emptyDoc } from '../core/types';
import type { EditorCoreOptions } from './types';

export class EditorCore {
  readonly editor: Editor;

  constructor(options: EditorCoreOptions = {}) {
    const {
      extensions,
      extensionOptions,
      content = emptyDoc,
      contentType = 'json',
      onUpdate,
      ...editorOptions
    } = options;

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

  mount(element: HTMLElement): void {
    this.editor.mount(element);
  }

  unmount(): void {
    this.editor.unmount();
  }

  focus(): void {
    this.editor.commands.focus();
  }

  destroy(): void {
    this.editor.destroy();
  }
}
