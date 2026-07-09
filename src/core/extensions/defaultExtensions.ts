import type { AnyExtension } from '@tiptap/core';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';

import type { DefaultExtensionsOptions } from '../types.js';
import { MarkdownClipboard } from './markdownClipboard.js';

export function createDefaultExtensions(
  options: DefaultExtensionsOptions = {},
): AnyExtension[] {
  const extensions: AnyExtension[] = [];

  if (options.starterKit !== false) {
    extensions.push(
      options.starterKit
        ? StarterKit.configure(options.starterKit)
        : StarterKit,
    );
  }

  extensions.push(
    options.markdown ? Markdown.configure(options.markdown) : Markdown,
    MarkdownClipboard,
  );

  return extensions;
}
