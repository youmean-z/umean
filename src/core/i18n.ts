/**
 * 编辑器国际化文案。
 * 默认 zh-CN，通过 `DefaultExtensionsOptions.locale` 切换。
 * 切换语言需重建编辑器（库级不支持运行时热切换）。
 */
import type { EditorActionId } from './commands/types';

export interface UmeanMessages {
  // --- Placeholder ---
  placeholderTitle: string;
  placeholderContent: string;

  // --- Callout ---
  calloutInfo: string;
  calloutTip: string;
  calloutWarning: string;
  calloutDanger: string;

  // --- Shared toolbar ---
  copy: string;
  copied: string;
  copyFailed: string;
  source: string;

  // --- Block Math ---
  blockMathPreview: string;
  blockMathPlaceholder: string;
  blockMathEmpty: string;
  blockMathError: string;

  // --- Mermaid ---
  mermaidChart: string;
  mermaidEmpty: string;
  mermaidError: string;

  // --- Code block ---
  codeBlockLanguage: string;
  codeBlockPlainText: string;

  // --- Slash groups ---
  slashGroupBasic: string;
  slashGroupList: string;
  slashGroupCallout: string;
  slashGroupInsert: string;
  slashGroupMedia: string;

  // --- Slash items ---
  slashParagraph: string;
  slashHeading1: string;
  slashHeading2: string;
  slashHeading3: string;
  slashBulletList: string;
  slashOrderedList: string;
  slashTaskList: string;
  slashBlockquote: string;
  slashCallout: string;
  slashCalloutTip: string;
  slashCalloutWarning: string;
  slashCalloutDanger: string;
  slashCodeBlock: string;
  slashHorizontalRule: string;
  slashTable: string;
  slashInlineMath: string;
  slashBlockMath: string;
  slashImage: string;

  // --- Editor actions（工具栏 / 快捷键说明） ---
  actionUndo: string;
  actionRedo: string;
  actionToggleBold: string;
  actionToggleItalic: string;
  actionToggleStrike: string;
  actionToggleCode: string;
  actionToggleHighlight: string;
  actionSetParagraph: string;
  actionToggleHeading1: string;
  actionToggleHeading2: string;
  actionToggleHeading3: string;
  actionToggleHeading4: string;
  actionToggleHeading5: string;
  actionToggleHeading6: string;
  actionToggleBulletList: string;
  actionToggleOrderedList: string;
  actionToggleTaskList: string;
  actionToggleBlockquote: string;
  actionInsertCallout: string;
  actionToggleCodeBlock: string;
  actionSetHorizontalRule: string;
  actionInsertTable: string;
  actionInsertImage: string;
  actionInsertInlineMath: string;
  actionInsertBlockMath: string;
  actionSetLink: string;
  actionUnsetLink: string;
  actionExitLink: string;
  shortcutDisabled: string;
  shortcutCustom: string;
}

const ZH_CN: UmeanMessages = {
  placeholderTitle: '请输入标题',
  placeholderContent: '请输入内容',

  calloutInfo: '信息',
  calloutTip: '提示',
  calloutWarning: '警告',
  calloutDanger: '危险',

  copy: '复制',
  copied: '已复制',
  copyFailed: '复制失败',
  source: '源码',

  blockMathPreview: '公式',
  blockMathPlaceholder:
    '多行公式用 \\\\ 换行，例如：E=mc^2 \\\\ \\sum_{i=1}^{n} i',
  blockMathEmpty: '(公式源码为空)',
  blockMathError: '(公式解析错误)',

  mermaidChart: '图表',
  mermaidEmpty: '(Mermaid 源码为空)',
  mermaidError: '(Mermaid 解析错误)',

  codeBlockLanguage: '代码块语言',
  codeBlockPlainText: '纯文本',

  slashGroupBasic: '基础',
  slashGroupList: '列表',
  slashGroupCallout: '提示块',
  slashGroupInsert: '插入',
  slashGroupMedia: '媒体',

  slashParagraph: '正文',
  slashHeading1: '一级标题',
  slashHeading2: '二级标题',
  slashHeading3: '三级标题',
  slashBulletList: '无序列表',
  slashOrderedList: '有序列表',
  slashTaskList: '任务列表',
  slashBlockquote: '引用',
  slashCallout: '信息块',
  slashCalloutTip: '提示块',
  slashCalloutWarning: '警告块',
  slashCalloutDanger: '危险块',
  slashCodeBlock: '代码块',
  slashHorizontalRule: '分割线',
  slashTable: '表格',
  slashInlineMath: '行内公式',
  slashBlockMath: '块级公式',
  slashImage: '图片',

  actionUndo: '撤销',
  actionRedo: '重做',
  actionToggleBold: '加粗',
  actionToggleItalic: '斜体',
  actionToggleStrike: '删除线',
  actionToggleCode: '行内代码',
  actionToggleHighlight: '高亮',
  actionSetParagraph: '正文',
  actionToggleHeading1: '一级标题',
  actionToggleHeading2: '二级标题',
  actionToggleHeading3: '三级标题',
  actionToggleHeading4: '四级标题',
  actionToggleHeading5: '五级标题',
  actionToggleHeading6: '六级标题',
  actionToggleBulletList: '无序列表',
  actionToggleOrderedList: '有序列表',
  actionToggleTaskList: '任务列表',
  actionToggleBlockquote: '引用',
  actionInsertCallout: '提示块',
  actionToggleCodeBlock: '代码块',
  actionSetHorizontalRule: '分割线',
  actionInsertTable: '表格',
  actionInsertImage: '图片',
  actionInsertInlineMath: '行内公式',
  actionInsertBlockMath: '块级公式',
  actionSetLink: '设置链接',
  actionUnsetLink: '取消链接',
  actionExitLink: '退出链接',
  shortcutDisabled: '已禁用',
  shortcutCustom: '自定义',
};

const EN: UmeanMessages = {
  placeholderTitle: 'Enter title',
  placeholderContent: 'Enter content',

  calloutInfo: 'Info',
  calloutTip: 'Tip',
  calloutWarning: 'Warning',
  calloutDanger: 'Danger',

  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'Copy failed',
  source: 'Source',

  blockMathPreview: 'Preview',
  blockMathPlaceholder:
    'Multi-line formula, use \\\\ for line break, e.g.: E=mc^2 \\\\ \\sum_{i=1}^{n} i',
  blockMathEmpty: '(Formula source is empty)',
  blockMathError: '(Formula parse error)',

  mermaidChart: 'Chart',
  mermaidEmpty: '(Mermaid source is empty)',
  mermaidError: '(Mermaid parse error)',

  codeBlockLanguage: 'Code language',
  codeBlockPlainText: 'Plain Text',

  slashGroupBasic: 'Basic',
  slashGroupList: 'List',
  slashGroupCallout: 'Callout',
  slashGroupInsert: 'Insert',
  slashGroupMedia: 'Media',

  slashParagraph: 'Paragraph',
  slashHeading1: 'Heading 1',
  slashHeading2: 'Heading 2',
  slashHeading3: 'Heading 3',
  slashBulletList: 'Bullet List',
  slashOrderedList: 'Ordered List',
  slashTaskList: 'Task List',
  slashBlockquote: 'Blockquote',
  slashCallout: 'Info Callout',
  slashCalloutTip: 'Tip Callout',
  slashCalloutWarning: 'Warning Callout',
  slashCalloutDanger: 'Danger Callout',
  slashCodeBlock: 'Code Block',
  slashHorizontalRule: 'Horizontal Rule',
  slashTable: 'Table',
  slashInlineMath: 'Inline Math',
  slashBlockMath: 'Block Math',
  slashImage: 'Image',

  actionUndo: 'Undo',
  actionRedo: 'Redo',
  actionToggleBold: 'Bold',
  actionToggleItalic: 'Italic',
  actionToggleStrike: 'Strikethrough',
  actionToggleCode: 'Inline Code',
  actionToggleHighlight: 'Highlight',
  actionSetParagraph: 'Paragraph',
  actionToggleHeading1: 'Heading 1',
  actionToggleHeading2: 'Heading 2',
  actionToggleHeading3: 'Heading 3',
  actionToggleHeading4: 'Heading 4',
  actionToggleHeading5: 'Heading 5',
  actionToggleHeading6: 'Heading 6',
  actionToggleBulletList: 'Bullet List',
  actionToggleOrderedList: 'Ordered List',
  actionToggleTaskList: 'Task List',
  actionToggleBlockquote: 'Blockquote',
  actionInsertCallout: 'Callout',
  actionToggleCodeBlock: 'Code Block',
  actionSetHorizontalRule: 'Horizontal Rule',
  actionInsertTable: 'Table',
  actionInsertImage: 'Image',
  actionInsertInlineMath: 'Inline Math',
  actionInsertBlockMath: 'Block Math',
  actionSetLink: 'Set Link',
  actionUnsetLink: 'Unset Link',
  actionExitLink: 'Exit Link',
  shortcutDisabled: 'Disabled',
  shortcutCustom: 'Custom',
};

/**
 * 根据 locale 配置解析最终文案对象。
 * - `undefined` / `'zh-CN'` → 简体中文
 * - `'en'` → 英文
 * - 自定义对象 → 与 zh-CN 合并（宿主可只覆盖部分字段）
 */
export function resolveMessages(
  locale?: 'zh-CN' | 'en' | Partial<UmeanMessages>,
): UmeanMessages {
  if (!locale || locale === 'zh-CN') {
    return ZH_CN;
  }

  if (locale === 'en') {
    return EN;
  }

  return { ...ZH_CN, ...locale };
}

/** EditorActionId → UmeanMessages 字段 */
const ACTION_MESSAGE_KEYS = {
  undo: 'actionUndo',
  redo: 'actionRedo',
  toggleBold: 'actionToggleBold',
  toggleItalic: 'actionToggleItalic',
  toggleStrike: 'actionToggleStrike',
  toggleCode: 'actionToggleCode',
  toggleHighlight: 'actionToggleHighlight',
  setParagraph: 'actionSetParagraph',
  toggleHeading1: 'actionToggleHeading1',
  toggleHeading2: 'actionToggleHeading2',
  toggleHeading3: 'actionToggleHeading3',
  toggleHeading4: 'actionToggleHeading4',
  toggleHeading5: 'actionToggleHeading5',
  toggleHeading6: 'actionToggleHeading6',
  toggleBulletList: 'actionToggleBulletList',
  toggleOrderedList: 'actionToggleOrderedList',
  toggleTaskList: 'actionToggleTaskList',
  toggleBlockquote: 'actionToggleBlockquote',
  insertCallout: 'actionInsertCallout',
  toggleCodeBlock: 'actionToggleCodeBlock',
  setHorizontalRule: 'actionSetHorizontalRule',
  insertTable: 'actionInsertTable',
  insertImage: 'actionInsertImage',
  insertInlineMath: 'actionInsertInlineMath',
  insertBlockMath: 'actionInsertBlockMath',
  setLink: 'actionSetLink',
  unsetLink: 'actionUnsetLink',
  exitLink: 'actionExitLink',
} as const satisfies Record<EditorActionId, keyof UmeanMessages>;

/** 取动作的本地化显示名（工具栏 / 快捷键说明共用）。 */
export function getActionLabel(
  action: EditorActionId,
  messages: UmeanMessages = ZH_CN,
): string {
  const key = ACTION_MESSAGE_KEYS[action];
  return messages[key];
}

export { ZH_CN, EN };
