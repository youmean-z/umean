import type { AnyExtension } from '@tiptap/core';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';

import type { StarterKitOptions } from '@tiptap/starter-kit';

import type {
  DefaultExtensionsOptions,
  HeadingPolicyMode,
  HeadingPolicyOptions,
} from '../types';
import {
  DEFAULT_PLACEHOLDER_CONTENT,
  DEFAULT_PLACEHOLDER_TITLE,
} from '../types';
import { createEditorPlaceholder } from './editorPlaceholder';
import { HeadingPolicy } from './headingPolicy';
import { MarkdownClipboard } from './markdownClipboard';
import { createRichExtensions } from './richExtensions';
import { TableAlignShortcut } from './tableAlignShortcut';
import { TableShortcut } from './tableShortcut';

function resolveHeadingPolicyMode(
  options: DefaultExtensionsOptions,
): HeadingPolicyMode {
  if (options.headingPolicy === false) {
    return 'free';
  }

  return options.headingPolicy?.mode ?? 'free';
}

function resolveHeadingPolicyOptions(
  options: DefaultExtensionsOptions,
): HeadingPolicyOptions | null {
  if (options.headingPolicy === false) {
    return null;
  }

  return {
    mode: options.headingPolicy?.mode ?? 'free',
    placeholderTitle:
      options.headingPolicy?.placeholderTitle ?? DEFAULT_PLACEHOLDER_TITLE,
    placeholderContent:
      options.headingPolicy?.placeholderContent ?? DEFAULT_PLACEHOLDER_CONTENT,
  };
}

function appendMarkdownExtensions(
  extensions: AnyExtension[],
  options: DefaultExtensionsOptions,
): void {
  extensions.push(
    options.markdown ? Markdown.configure(options.markdown) : Markdown,
    MarkdownClipboard,
  );
}

function appendPolicyExtensions(
  extensions: AnyExtension[],
  options: DefaultExtensionsOptions,
): void {
  const headingPolicy = resolveHeadingPolicyOptions(options);
  const headingPolicyMode = resolveHeadingPolicyMode(options);

  if (!headingPolicy) {
    return;
  }

  extensions.push(
    ...createEditorPlaceholder({
      mode: headingPolicy.mode,
      placeholderTitle: headingPolicy.placeholderTitle,
      placeholderContent: headingPolicy.placeholderContent,
    }),
  );

  if (headingPolicyMode !== 'free') {
    extensions.push(
      HeadingPolicy.configure({
        mode: headingPolicyMode,
      }),
    );
  }
}

function isTableShortcutsEnabled(options: DefaultExtensionsOptions): boolean {
  if (options.rich === false) {
    return false;
  }

  return options.rich?.table !== false;
}

/**
 * TenTap WebView 补充扩展：Bridge 未覆盖的 Markdown、剪贴板、表格快捷键与标题策略。
 * Image / TaskList / Table / CodeBlock 等由 Bridge 提供，勿在此重复注册。
 */
export function createTenTapSupplementalExtensions(
  options: DefaultExtensionsOptions = {},
): AnyExtension[] {
  const extensions: AnyExtension[] = [];

  appendMarkdownExtensions(extensions, options);

  if (isTableShortcutsEnabled(options)) {
    extensions.push(TableShortcut, TableAlignShortcut);
  }

  appendPolicyExtensions(extensions, options);

  return extensions;
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

  appendMarkdownExtensions(extensions, options);
  appendPolicyExtensions(extensions, options);

  return extensions;
}

export { createRichExtensions } from './richExtensions';
