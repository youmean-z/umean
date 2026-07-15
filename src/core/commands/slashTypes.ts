import type { Editor } from '@tiptap/core';

import type { UmeanMessages } from '../i18n';
import type { EditorActionId, EditorActionPayloadMap } from './types';

export type SlashItemGroup = 'basic' | 'list' | 'insert' | 'media' | (string & {});

export interface SlashItem {
  id: string;
  action: EditorActionId;
  title: string;
  keywords?: string[];
  group?: SlashItemGroup;
  payload?: EditorActionPayloadMap[keyof EditorActionPayloadMap];
  /** 返回 false 时隐藏该项 */
  when?: (editor: Editor) => boolean;
  /**
   * 需要宿主补全参数（如图片 URL、链接）。
   * 为 true 时优先走 `onRequest`，未处理则跳过执行。
   */
  needsRequest?: boolean;
}

export interface SlashMatch {
  from: number;
  to: number;
  query: string;
}

export interface SlashState {
  active: boolean;
  from: number;
  to: number;
  query: string;
  items: SlashItem[];
  activeIndex: number;
}

export interface SlashRequestContext {
  editor: Editor;
  item: SlashItem;
  /** 删除 `/query` 并执行插入；宿主拿到参数后应调用 */
  apply: (payload?: EditorActionPayloadMap[keyof EditorActionPayloadMap]) => boolean;
  /** 取消补全：只删除 `/query`，不插入内容 */
  dismiss: () => void;
}

export interface SlashCommandOptions {
  /** 触发字符，默认 `/` */
  trigger?: string;
  /**
   * 菜单项：默认内置列表；或完全自定义；或函数动态生成。
   */
  items?: 'default' | SlashItem[] | ((editor: Editor) => SlashItem[]);
  /** 追加到默认列表之后 */
  extendItems?: SlashItem[];
  /**
   * UI：`dom` 使用内置浮动菜单；`false` 仅通知宿主（后续可接自绘）。
   * @default 'dom'
   */
  render?: 'dom' | false;
  /** 图片/链接等需要宿主补全时回调；返回 true 表示已处理 */
  onRequest?: (ctx: SlashRequestContext) => boolean | void;
  /** 状态变化（自绘 UI 可用） */
  onUpdate?: (state: SlashState & { clientRect: (() => DOMRect | null) | null }) => void;
  /** 国际化文案，默认 zh-CN */
  messages?: UmeanMessages;
}
