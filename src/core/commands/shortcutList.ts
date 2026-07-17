import { resolveShortcutBindings } from './defaultShortcuts';
import {
  getActionLabel,
  resolveMessages,
  type UmeanMessages,
} from '../i18n';
import type {
  EditorActionId,
  KeyboardShortcutBinding,
  KeyboardShortcutsOptions,
} from './types';

export interface ShortcutListItem {
  /** TipTap 键名，如 `Mod-b` */
  keys: string;
  /** 标准动作；禁用或自定义函数时为 null */
  action: EditorActionId | null;
  /** 本地化显示名（禁用/自定义时用对应文案） */
  label: string;
  /** 是否禁用该键（吞掉事件） */
  disabled: boolean;
  /** 是否为宿主自定义处理函数 */
  custom: boolean;
}

export interface GetShortcutListOptions {
  /** 与 DefaultExtensionsOptions.locale 相同 */
  locale?: 'zh-CN' | 'en' | Partial<UmeanMessages>;
  /** 直接传入已解析文案（优先于 locale） */
  messages?: UmeanMessages;
}

/**
 * 根据快捷键配置导出列表，供应用层渲染快捷键说明。
 * 传入 `false` 表示快捷键扩展关闭，返回空数组。
 */
export function getShortcutList(
  options: KeyboardShortcutsOptions | false = {},
  i18n: GetShortcutListOptions = {},
): ShortcutListItem[] {
  if (options === false) {
    return [];
  }

  const messages = i18n.messages ?? resolveMessages(i18n.locale);
  const bindings = resolveShortcutBindings({
    defaults: options.defaults,
    bindings: options.bindings,
  });

  return Object.entries(bindings)
    .map(([keys, binding]) => toShortcutListItem(keys, binding, messages))
    .sort((a, b) => a.keys.localeCompare(b.keys));
}

function toShortcutListItem(
  keys: string,
  binding: KeyboardShortcutBinding,
  messages: UmeanMessages,
): ShortcutListItem {
  if (binding === false) {
    return {
      keys,
      action: null,
      label: messages.shortcutDisabled,
      disabled: true,
      custom: false,
    };
  }
  if (typeof binding === 'function') {
    return {
      keys,
      action: null,
      label: messages.shortcutCustom,
      disabled: false,
      custom: true,
    };
  }
  return {
    keys,
    action: binding,
    label: getActionLabel(binding, messages),
    disabled: false,
    custom: false,
  };
}
