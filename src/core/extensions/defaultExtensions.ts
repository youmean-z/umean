import type { AnyExtension } from '@tiptap/core';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';

import type { StarterKitOptions } from '@tiptap/starter-kit';

import type { DefaultExtensionsOptions, HeadingPolicyMode } from '../types';
import { HeadingPolicy } from './headingPolicy';
import { MarkdownClipboard } from './markdownClipboard';
import { createRichExtensions } from './richExtensions';

function resolveHeadingPolicyMode(
  options: DefaultExtensionsOptions,
): HeadingPolicyMode {
  if (options.headingPolicy === false) {
    return 'free';
  }

  return options.headingPolicy?.mode ?? 'free';
}

export function createDefaultExtensions(
  options: DefaultExtensionsOptions = {},
): AnyExtension[] {
  const extensions: AnyExtension[] = [];
  const headingPolicyMode = resolveHeadingPolicyMode(options);

  if (options.starterKit !== false) {
    const starterKitOptions: Partial<StarterKitOptions> = {
      codeBlock: false,
      ...options.starterKit,
    };

    if (headingPolicyMode === 'chunk') {
      starterKitOptions.heading = {
        levels: [2, 3, 4, 5, 6],
        ...(typeof options.starterKit?.heading === 'object'
          ? options.starterKit.heading
          : {}),
      };
    }

    extensions.push(StarterKit.configure(starterKitOptions));
  }

  if (options.rich !== false) {
    extensions.push(...createRichExtensions(options.rich));
  }

  extensions.push(
    options.markdown ? Markdown.configure(options.markdown) : Markdown,
    MarkdownClipboard,
  );

  if (options.headingPolicy !== false && headingPolicyMode !== 'free') {
    extensions.push(
      HeadingPolicy.configure({
        mode: headingPolicyMode,
        placeholderTitle: options.headingPolicy?.placeholderTitle,
      }),
    );
  }

  return extensions;
}

export { createRichExtensions } from './richExtensions';
