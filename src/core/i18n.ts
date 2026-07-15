/**
 * 编辑器国际化文案。
 * 默认 zh-CN，通过 `DefaultExtensionsOptions.locale` 切换。
 * 切换语言需重建编辑器（库级不支持运行时热切换）。
 */
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
  slashCalloutWarning: string;
  slashCodeBlock: string;
  slashHorizontalRule: string;
  slashTable: string;
  slashInlineMath: string;
  slashBlockMath: string;
  slashImage: string;
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
  slashCallout: '提示块',
  slashCalloutWarning: '警告块',
  slashCodeBlock: '代码块',
  slashHorizontalRule: '分割线',
  slashTable: '表格',
  slashInlineMath: '行内公式',
  slashBlockMath: '块级公式',
  slashImage: '图片',
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
  slashCallout: 'Callout',
  slashCalloutWarning: 'Warning Callout',
  slashCodeBlock: 'Code Block',
  slashHorizontalRule: 'Horizontal Rule',
  slashTable: 'Table',
  slashInlineMath: 'Inline Math',
  slashBlockMath: 'Block Math',
  slashImage: 'Image',
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

export { ZH_CN, EN };
