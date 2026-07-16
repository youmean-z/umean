import type { Editor } from '@tiptap/core';

import { ZH_CN, type UmeanMessages } from '../i18n';
import { isHeading1ToggleAllowed } from '../utils/headingPolicyUtils';
import type { SlashItem } from './slashTypes';

/**
 * 构建默认 Slash 菜单项。
 *
 * `keywords` 故意为中英双语集合：无论界面 locale 为何，搜中文或英文都能命中。
 */
export function buildDefaultSlashItems(
  messages: UmeanMessages = ZH_CN,
): SlashItem[] {
  return [
    {
      id: 'setParagraph',
      action: 'setParagraph',
      title: messages.slashParagraph,
      keywords: ['paragraph', 'text', '正文', '段落'],
      group: 'basic',
    },
    {
      id: 'toggleHeading1',
      action: 'toggleHeading1',
      title: messages.slashHeading1,
      keywords: ['h1', 'heading1', '标题', 'heading'],
      group: 'basic',
    },
    {
      id: 'toggleHeading2',
      action: 'toggleHeading2',
      title: messages.slashHeading2,
      keywords: ['h2', 'heading2', '标题'],
      group: 'basic',
    },
    {
      id: 'toggleHeading3',
      action: 'toggleHeading3',
      title: messages.slashHeading3,
      keywords: ['h3', 'heading3', '标题'],
      group: 'basic',
    },
    {
      id: 'toggleBulletList',
      action: 'toggleBulletList',
      title: messages.slashBulletList,
      keywords: ['ul', 'bullet', 'list', '无序', '列表'],
      group: 'list',
    },
    {
      id: 'toggleOrderedList',
      action: 'toggleOrderedList',
      title: messages.slashOrderedList,
      keywords: ['ol', 'ordered', 'number', '有序', '列表'],
      group: 'list',
    },
    {
      id: 'toggleTaskList',
      action: 'toggleTaskList',
      title: messages.slashTaskList,
      keywords: ['todo', 'task', 'checkbox', '任务', '待办'],
      group: 'list',
    },
    {
      id: 'toggleBlockquote',
      action: 'toggleBlockquote',
      title: messages.slashBlockquote,
      keywords: ['quote', 'blockquote', '引用'],
      group: 'list',
    },
    {
      id: 'insertCallout',
      action: 'insertCallout',
      title: messages.slashCallout,
      keywords: ['callout', 'info', '信息', '注意'],
      group: 'callout',
      payload: { type: 'info' },
    },
    {
      id: 'insertCalloutTip',
      action: 'insertCallout',
      title: messages.slashCalloutTip,
      keywords: ['callout', 'tip', '提示', '注意'],
      group: 'callout',
      payload: { type: 'tip' },
    },
    {
      id: 'insertCalloutWarning',
      action: 'insertCallout',
      title: messages.slashCalloutWarning,
      keywords: ['callout', 'warning', '警告', '注意'],
      group: 'callout',
      payload: { type: 'warning' },
    },
    {
      id: 'insertCalloutDanger',
      action: 'insertCallout',
      title: messages.slashCalloutDanger,
      keywords: ['callout', 'danger', '危险', '注意'],
      group: 'callout',
      payload: { type: 'danger' },
    },
    {
      id: 'toggleCodeBlock',
      action: 'toggleCodeBlock',
      title: messages.slashCodeBlock,
      keywords: ['code', 'codeblock', '代码'],
      group: 'insert',
    },
    {
      id: 'setHorizontalRule',
      action: 'setHorizontalRule',
      title: messages.slashHorizontalRule,
      keywords: ['hr', 'divider', '分割线', '横线'],
      group: 'insert',
    },
    {
      id: 'insertTable',
      action: 'insertTable',
      title: messages.slashTable,
      keywords: ['table', '表格'],
      group: 'insert',
      payload: { rows: 3, cols: 3, withHeaderRow: true },
    },
    {
      id: 'insertInlineMath',
      action: 'insertInlineMath',
      title: messages.slashInlineMath,
      keywords: ['math', 'latex', 'inline', '公式', '行内'],
      group: 'insert',
      payload: { latex: 'E=mc^2' },
    },
    {
      id: 'insertBlockMath',
      action: 'insertBlockMath',
      title: messages.slashBlockMath,
      keywords: ['math', 'latex', 'block', '公式', '块'],
      group: 'insert',
      payload: { latex: '\\sum_{i=1}^{n} i' },
    },
    {
      id: 'insertImage',
      action: 'insertImage',
      title: messages.slashImage,
      keywords: ['image', 'img', 'picture', '图片'],
      group: 'media',
      needsRequest: true,
    },
  ];
}

/** @deprecated 使用 `getDefaultSlashItems(editor, messages)`；等价于 `buildDefaultSlashItems(ZH_CN)` */
export const DEFAULT_SLASH_ITEMS: SlashItem[] = buildDefaultSlashItems(ZH_CN);

export function getDefaultSlashItems(
  editor: Editor,
  messages?: UmeanMessages,
): SlashItem[] {
  return buildDefaultSlashItems(messages ?? ZH_CN).filter((item) => {
    if (item.when && !item.when(editor)) {
      return false;
    }
    if (item.action === 'toggleHeading1' && !isHeading1ToggleAllowed(editor)) {
      return false;
    }
    if (item.action === 'insertCallout' && !editor.schema.nodes.callout) {
      return false;
    }
    return true;
  });
}

export function resolveSlashItems(
  editor: Editor,
  items: 'default' | SlashItem[] | ((editor: Editor) => SlashItem[]) = 'default',
  extendItems: SlashItem[] = [],
  messages?: UmeanMessages,
): SlashItem[] {
  const base =
    items === 'default'
      ? getDefaultSlashItems(editor, messages)
      : typeof items === 'function'
        ? items(editor)
        : items;

  return [...base, ...extendItems].filter((item) =>
    item.when ? item.when(editor) : true,
  );
}

export function filterSlashItems(
  items: SlashItem[],
  query: string,
): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return items;
  }

  return items.filter((item) => {
    if (item.title.toLowerCase().includes(q)) {
      return true;
    }
    if (item.id.toLowerCase().includes(q)) {
      return true;
    }
    if (item.action.toLowerCase().includes(q)) {
      return true;
    }
    return (item.keywords ?? []).some((k) => k.toLowerCase().includes(q));
  });
}
