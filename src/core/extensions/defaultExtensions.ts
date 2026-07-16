import type { AnyExtension } from '@tiptap/core';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';

import type { StarterKitOptions } from '@tiptap/starter-kit';

import { resolveMessages } from '../i18n';
import type {
  DefaultExtensionsOptions,
  HeadingPolicyMode,
  HeadingPolicyOptions,
} from '../types';
import { resolveStarterKitLink } from '../utils/linkDefaults';
import { resolveSlashOptions } from '../media/resolveSlashUpload';
import { createEditorPlaceholder } from './editorPlaceholder';
import { FindReplace } from './findReplace';
import { HeadingPolicy } from './headingPolicy';
import { KeyboardShortcuts } from './keyboardShortcuts';
import { LinkExit } from './linkExit';
import { MarkdownClipboard } from './markdownClipboard';
import { MediaUpload } from './mediaUpload';
import { createRichExtensions } from './richExtensions';
import { SlashCommand } from './slashCommand';
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

  const messages = resolveMessages(options.locale);

  return {
    mode: options.headingPolicy?.mode ?? 'free',
    placeholderTitle:
      options.headingPolicy?.placeholderTitle ?? messages.placeholderTitle,
    placeholderContent:
      options.headingPolicy?.placeholderContent ?? messages.placeholderContent,
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

  if (options.findReplace !== false) {
    extensions.push(
      options.findReplace
        ? FindReplace.configure(options.findReplace)
        : FindReplace,
    );
  }

  appendPolicyExtensions(extensions, options);

  return extensions;
}

export function createDefaultExtensions(
  options: DefaultExtensionsOptions = {},
): AnyExtension[] {
  const extensions: AnyExtension[] = [];
  const headingPolicyMode = resolveHeadingPolicyMode(options);
  const messages = resolveMessages(options.locale);

  if (options.starterKit !== false) {
    const starterKitOptions: Partial<StarterKitOptions> = {
      codeBlock: false,
      ...options.starterKit,
      link: resolveStarterKitLink(options),
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

    if (starterKitOptions.link !== false) {
      extensions.push(LinkExit);
    }
  }

  if (options.shortcuts !== false) {
    extensions.push(
      options.shortcuts
        ? KeyboardShortcuts.configure(options.shortcuts)
        : KeyboardShortcuts,
    );
  }

  if (options.findReplace !== false) {
    extensions.push(
      options.findReplace
        ? FindReplace.configure(options.findReplace)
        : FindReplace,
    );
  }

  if (options.slash !== false) {
    const slashOptions = resolveSlashOptions(options, messages);
    if (slashOptions !== false) {
      extensions.push(SlashCommand.configure(slashOptions));
    }
  }

  if (options.upload !== false && options.upload) {
    extensions.push(MediaUpload.configure(options.upload));
  }

  if (options.rich !== false) {
    extensions.push(...createRichExtensions(options.rich, messages));
  }

  appendMarkdownExtensions(extensions, options);
  appendPolicyExtensions(extensions, options);

  return extensions;
}

export { createRichExtensions } from './richExtensions';
