import type { JSONContent } from '@tiptap/core';
import type { EditorOptions } from '@tiptap/core';
import type { CodeBlockLowlightOptions } from '@tiptap/extension-code-block-lowlight';
import type { ImageOptions } from '@tiptap/extension-image';
import type { TableOptions } from '@tiptap/extension-table';
import type { TaskItemOptions } from '@tiptap/extension-task-item';
import type { TaskListOptions } from '@tiptap/extension-task-list';
import type { MarkdownExtensionOptions } from '@tiptap/markdown';
import type { StarterKitOptions } from '@tiptap/starter-kit';

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
  /** Image / TaskList / Table / CodeBlockLowlight，默认全部启用 */
  rich?: RichExtensionsOptions | false;
}

export interface TransformOptions {
  extensions?: EditorOptions['extensions'];
  extensionOptions?: DefaultExtensionsOptions;
}

export const emptyDoc: JSONContent = { type: 'doc', content: [] };

export const demoDoc: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Rich Editor Demo' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '支持 Image / TaskList / Table / CodeBlockLowlight' }],
    },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '已完成任务' }],
            },
          ],
        },
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '待办任务' }],
            },
          ],
        },
      ],
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableHeader',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Name' }] }],
            },
            {
              type: 'tableHeader',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Role' }] }],
            },
          ],
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Alice' }] }],
            },
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Editor' }] }],
            },
          ],
        },
      ],
    },
    {
      type: 'codeBlock',
      attrs: { language: 'javascript' },
      content: [{ type: 'text', text: "console.log('Hello lowlight')" }],
    },
  ],
};
