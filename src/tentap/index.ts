import type { DefaultExtensionsOptions } from '../core/types.js';
import { createDefaultExtensions } from '../core/extensions/defaultExtensions.js';

export interface TenTapTiptapOptions {
  extensions: ReturnType<typeof createDefaultExtensions>;
}

/**
 * 为 TenTap `useTenTap({ tiptapOptions })` 生成与 Web 端一致的扩展配置。
 *
 * @example
 * ```tsx
 * import { useTenTap, TenTapStartKit } from '@10play/tentap-editor';
 * import { createTenTapTiptapOptions } from 'umean/tentap';
 *
 * const editor = useTenTap({
 *   bridges: TenTapStartKit,
 *   tiptapOptions: createTenTapTiptapOptions(),
 * });
 * ```
 */
export function createTenTapTiptapOptions(
  extensionOptions: DefaultExtensionsOptions = {},
): TenTapTiptapOptions {
  return {
    extensions: createDefaultExtensions(extensionOptions),
  };
}

export {
  createDefaultExtensions,
  createHeadlessEditor,
  jsonToHTML,
  jsonToMarkdown,
  markdownToJSON,
  emptyDoc,
  MarkdownClipboard,
  Markdown,
  StarterKit,
} from '../core/index.js';

export type {
  DefaultExtensionsOptions,
  TransformOptions,
  Editor,
  JSONContent,
} from '../core/index.js';
