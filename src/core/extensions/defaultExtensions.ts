import type { AnyExtension } from '@tiptap/core';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';

import type { DefaultExtensionsOptions } from '../types';
import { MarkdownClipboard } from './markdownClipboard';
import { createRichExtensions } from './richExtensions';

export function createDefaultExtensions(
  options: DefaultExtensionsOptions = {},
): AnyExtension[] {
  const extensions: AnyExtension[] = [];

  if (options.starterKit !== false) {
    extensions.push(
      StarterKit.configure({
        codeBlock: false,
        ...options.starterKit,
      }),
    );
  }

  if (options.rich !== false) {
    extensions.push(...createRichExtensions(options.rich));
  }

  extensions.push(
    options.markdown ? Markdown.configure(options.markdown) : Markdown,
    MarkdownClipboard,
  );

  return extensions;
}

export { createRichExtensions } from './richExtensions';
