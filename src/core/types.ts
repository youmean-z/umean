import type { JSONContent } from '@tiptap/core';
import type { EditorOptions } from '@tiptap/core';
import type { CodeBlockLowlightOptions } from '@tiptap/extension-code-block-lowlight';
import type { ImageOptions } from '@tiptap/extension-image';
import type { KatexOptions } from 'katex';
import type { TableOptions } from '@tiptap/extension-table';
import type { TaskItemOptions } from '@tiptap/extension-task-item';
import type { TaskListOptions } from '@tiptap/extension-task-list';
import type { MarkdownExtensionOptions } from '@tiptap/markdown';
import type { StarterKitOptions } from '@tiptap/starter-kit';

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

export interface RichExtensionsOptions {
  image?: Partial<ImageOptions> | false;
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
  /** 标题策略：free 随意 / document 笔记 / chunk 随记 */
  headingPolicy?: HeadingPolicyOptions | false;
  /** Image / TaskList / Table / CodeBlockLowlight，默认全部启用 */
  rich?: RichExtensionsOptions | false;
}

export interface TransformOptions {
  extensions?: EditorOptions['extensions'];
  extensionOptions?: DefaultExtensionsOptions;
}

export const emptyDoc: JSONContent = { type: 'doc', content: [] };
