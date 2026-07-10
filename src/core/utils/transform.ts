import { Editor, type JSONContent } from '@tiptap/core';

import { createDefaultExtensions } from '../extensions/defaultExtensions';
import { emptyDoc, type TransformOptions } from '../types';

function resolveExtensions(options: TransformOptions = {}) {
  return options.extensions ?? createDefaultExtensions(options.extensionOptions);
}

export function createHeadlessEditor(options: TransformOptions = {}): Editor {
  return new Editor({
    element: null,
    extensions: resolveExtensions(options),
    content: emptyDoc,
    contentType: 'json',
  });
}

export function jsonToHTML(
  json: JSONContent,
  options: TransformOptions = {},
): string {
  const editor = createHeadlessEditor(options);

  editor.commands.setContent(json);
  const html = editor.getHTML();
  editor.destroy();

  return html;
}

export function jsonToMarkdown(
  json: JSONContent,
  options: TransformOptions = {},
): string {
  const editor = createHeadlessEditor(options);

  editor.commands.setContent(json);
  const markdown = editor.getMarkdown();
  editor.destroy();

  return markdown;
}

export function markdownToJSON(
  markdown: string,
  options: TransformOptions = {},
): JSONContent {
  const editor = createHeadlessEditor(options);

  editor.commands.setContent(markdown, { contentType: 'markdown' });
  const json = editor.getJSON();
  editor.destroy();

  return json;
}
