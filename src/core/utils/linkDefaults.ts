import type { LinkOptions } from '@tiptap/extension-link';

import type { DefaultExtensionsOptions } from '../types';

/**
 * 笔记场景默认：输入/粘贴自动成链，编辑时不误点跳转，外链新窗口打开。
 * 可用 `extensionOptions.link` 覆盖。
 */
export const DEFAULT_LINK_OPTIONS: Partial<LinkOptions> = {
  autolink: true,
  linkOnPaste: true,
  openOnClick: false,
  defaultProtocol: 'https',
  HTMLAttributes: {
    target: '_blank',
    rel: 'noopener noreferrer',
    class: 'umean-link',
  },
};

/**
 * 解析 StarterKit 的 link 配置。
 * - `link: false` 关闭链接
 * - `starterKit.link: false` 且未设置顶层 `link` 时同样关闭
 * - 否则合并笔记默认值与用户配置
 */
export function resolveStarterKitLink(
  options: DefaultExtensionsOptions,
): Partial<LinkOptions> | false {
  if (options.link === false) {
    return false;
  }

  const starterLink =
    options.starterKit !== false ? options.starterKit?.link : undefined;

  if (starterLink === false && options.link === undefined) {
    return false;
  }

  const fromStarter = typeof starterLink === 'object' ? starterLink : {};
  const fromTop = typeof options.link === 'object' ? options.link : {};

  return {
    ...DEFAULT_LINK_OPTIONS,
    ...fromStarter,
    ...fromTop,
    HTMLAttributes: {
      ...DEFAULT_LINK_OPTIONS.HTMLAttributes,
      ...fromStarter.HTMLAttributes,
      ...fromTop.HTMLAttributes,
    },
  };
}
