import type { JSONContent } from '@tiptap/core';
import type { EditorOptions } from '@tiptap/core';
import type { MarkdownExtensionOptions } from '@tiptap/markdown';
import type { StarterKitOptions } from '@tiptap/starter-kit';

export interface DefaultExtensionsOptions {
  starterKit?: Partial<StarterKitOptions> | false;
  markdown?: Partial<MarkdownExtensionOptions>;
}

export interface TransformOptions {
  extensions?: EditorOptions['extensions'];
  extensionOptions?: DefaultExtensionsOptions;
}

export const emptyDoc: JSONContent = { type: 'doc', content: [] };
