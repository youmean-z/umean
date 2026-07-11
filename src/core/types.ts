import type { JSONContent } from '@tiptap/core';
import type { EditorOptions } from '@tiptap/core';
import type { CodeBlockLowlightOptions } from '@tiptap/extension-code-block-lowlight';
import type { ImageOptions } from '@tiptap/extension-image';
import type { TableOptions } from '@tiptap/extension-table';
import type { TaskItemOptions } from '@tiptap/extension-task-item';
import type { TaskListOptions } from '@tiptap/extension-task-list';
import type { MarkdownExtensionOptions } from '@tiptap/markdown';
import type { StarterKitOptions } from '@tiptap/starter-kit';

export type HeadingPolicyMode = 'free' | 'document' | 'chunk';

export interface HeadingPolicyOptions {
  mode?: HeadingPolicyMode;
  /** document 模式：空文档或首块非 h1 时的默认标题文案 */
  placeholderTitle?: string;
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
