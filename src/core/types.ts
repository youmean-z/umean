import type { JSONContent } from '@tiptap/core';
import type { EditorOptions } from '@tiptap/core';
import type { CodeBlockLowlightOptions } from '@tiptap/extension-code-block-lowlight';
import type { HighlightOptions } from '@tiptap/extension-highlight';
import type { ImageOptions } from '@tiptap/extension-image';
import type { LinkOptions } from '@tiptap/extension-link';
import type { KatexOptions } from 'katex';
import type { TableOptions } from '@tiptap/extension-table';
import type { TaskItemOptions } from '@tiptap/extension-task-item';
import type { TaskListOptions } from '@tiptap/extension-task-list';
import type { MarkdownExtensionOptions } from '@tiptap/markdown';
import type { StarterKitOptions } from '@tiptap/starter-kit';

import type { CalloutOptions } from './extensions/callout';
import type { DirtyStateOptions } from './extensions/dirtyState';
import type { FindReplaceOptions } from './extensions/findReplace';
import type { KeyboardShortcutsOptions } from './commands/types';
import type { SlashCommandOptions } from './commands/slashTypes';
import type { MediaUploadOptions } from './media/uploadTypes';
import type { CodeBlockLanguageInput } from './utils/codeBlockLanguages';
import type { UmeanMessages } from './i18n';

export type HeadingPolicyMode = 'free' | 'document' | 'chunk';

export const DEFAULT_PLACEHOLDER_TITLE = '请输入标题';
export const DEFAULT_PLACEHOLDER_CONTENT = '请输入内容';

export interface HeadingPolicyOptions {
  mode?: HeadingPolicyMode;
  /** 空标题块的 placeholder 文案 */
  placeholderTitle?: string;
  /** 空正文段落的 placeholder 文案 */
  placeholderContent?: string;
}

export interface MathOptions {
  /** KaTeX 渲染选项 */
  katexOptions?: KatexOptions;
}

export interface MermaidOptions {
  /** 是否启用 Mermaid 实时渲染，默认 true */
  enabled?: boolean;
  /** Mermaid 图表主题，默认 dark */
  theme?: 'default' | 'base' | 'dark' | 'forest' | 'neutral' | null;
}

export type { CodeBlockLanguageDefinition, CodeBlockLanguageInput } from './utils/codeBlockLanguages';

export interface RichExtensionsOptions {
  image?: Partial<ImageOptions> | false;
  /** 行内高亮（`<mark>` / `==文本==`），默认启用 */
  highlight?: Partial<HighlightOptions> | false;
  /** 提示块 Callout（`> [!info]` 等），默认启用 */
  callout?: CalloutOptions | false;
  taskList?:
    | false
    | {
        taskList?: Partial<TaskListOptions>;
        taskItem?: Partial<TaskItemOptions>;
      };
  table?:
    | false
    | {
        table?: Partial<TableOptions>;
      };
  codeBlockLowlight?: Partial<CodeBlockLowlightOptions> | false;
  /**
   * 代码块语言与高亮 grammar 配置。
   * 支持简写（如 `'js'`）或完整对象（含 `grammar`、`aliases`、`label`、`highlight`）。
   * 未配置时默认：javascript / typescript / xml(html) / css / markdown。
   */
  codeBlockLanguages?: CodeBlockLanguageInput[];
  /** 普通代码块顶栏（语言下拉、复制），默认启用 */
  codeBlockToolbar?: { enabled?: boolean } | false;
  /** 数学公式（LaTeX），默认启用 */
  math?: MathOptions | false;
  /** Mermaid 流程图渲染，默认启用 */
  mermaid?: MermaidOptions | false;
}

export interface DefaultExtensionsOptions {
  starterKit?: Partial<StarterKitOptions> | false;
  markdown?: Partial<MarkdownExtensionOptions>;
  /**
   * 链接（StarterKit Link）。默认启用：自动识别 URL、粘贴成链、编辑时不点开、外链新窗口。
   * `false` 关闭；对象会与笔记默认值合并。也可通过 `starterKit.link` 配置。
   */
  link?: Partial<LinkOptions> | false;
  /**
   * 快捷键自定义入口。`false` 关闭 umean 统一快捷键（StarterKit 自带绑键仍可能存在）。
   * Slash / 工具栏应优先使用同一套 `EditorActionId`。
   */
  shortcuts?: KeyboardShortcutsOptions | false;
  /**
   * Slash 命令菜单。默认启用内置 DOM 菜单；`false` 关闭。
   * 若同时配置了 `upload.onImageUpload`，Slash「图片」会默认走文件选择 + 上传。
   */
  slash?: SlashCommandOptions | false;
  /**
   * 媒体上传钩子：粘贴 / 拖放 / Slash「图片」共用。
   * 未配置时粘贴图片仍可能落到 Image 的 base64（若 allowBase64）。
   */
  upload?: MediaUploadOptions | false;
  /**
   * 国际化文案。默认 `zh-CN`；内置 `en`；也可传入对象覆盖部分字段。
   * 影响 placeholder、Callout 标签、工具栏按钮、Slash 菜单等所有面向用户的字符串。
   * 切换语言需重建编辑器（不支持运行时热切换）。
   */
  locale?: 'zh-CN' | 'en' | Partial<UmeanMessages>;
  /** 标题策略：free 随意 / document 笔记 / chunk 随记 */
  headingPolicy?: HeadingPolicyOptions | false;
  /**
   * 搜索替换。默认启用；`false` 关闭。
   * 宿主通过 `editor.commands.setFindQuery` 等命令驱动，不内置面板 UI。
   */
  findReplace?: FindReplaceOptions | false;
  /**
   * 脏状态追踪。默认启用；`false` 关闭。
   * `setContent` / 保存成功后请调用 `markClean()`；headingPolicy 自动修正不计脏。
   */
  dirtyState?: DirtyStateOptions | false;
  /** Image / TaskList / Table / CodeBlockLowlight，默认全部启用 */
  rich?: RichExtensionsOptions | false;
}

export interface TransformOptions {
  extensions?: EditorOptions['extensions'];
  extensionOptions?: DefaultExtensionsOptions;
}

export const emptyDoc: JSONContent = { type: 'doc', content: [] };
