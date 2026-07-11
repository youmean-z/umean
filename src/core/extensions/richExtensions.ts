import type { AnyExtension } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';

import type { RichExtensionsOptions } from '../types';
import { getSharedLowlight } from '../utils/lowlight';
import { TableAlignShortcut } from './tableAlignShortcut';
import { TableShortcut } from './tableShortcut';

export function createRichExtensions(
  options: RichExtensionsOptions = {},
): AnyExtension[] {
  const extensions: AnyExtension[] = [];

  if (options.image !== false) {
    extensions.push(
      options.image
        ? Image.configure(options.image)
        : Image.configure({ allowBase64: true }),
    );
  }

  if (options.taskList !== false) {
    extensions.push(
      options.taskList?.taskList
        ? TaskList.configure(options.taskList.taskList)
        : TaskList,
      options.taskList?.taskItem
        ? TaskItem.configure(options.taskList.taskItem)
        : TaskItem.configure({ nested: true }),
    );
  }

  if (options.table !== false) {
    extensions.push(
      options.table?.table
        ? Table.configure(options.table.table)
        : Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TableShortcut,
      TableAlignShortcut,
    );
  }

  if (options.codeBlockLowlight !== false) {
    extensions.push(
      options.codeBlockLowlight
        ? CodeBlockLowlight.configure({
            lowlight: getSharedLowlight(),
            ...options.codeBlockLowlight,
          })
        : CodeBlockLowlight.configure({ lowlight: getSharedLowlight() }),
    );
  }

  return extensions;
}
