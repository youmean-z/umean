import type { AnyExtension } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { InlineMath } from '@tiptap/extension-mathematics';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';

import { ZH_CN, type UmeanMessages } from '../i18n';
import type { RichExtensionsOptions } from '../types';
import { createCodeBlockLowlight } from '../utils/lowlight';
import { Callout } from './callout';
import { CodeBlockEnter, CodeBlockToolbar } from './codeBlockNodeView';
import { MermaidCodeBlock } from './mermaidCodeBlock';
import { BlockMathWithNodeView } from './blockMathNodeView';
import { InlineMathUnwrap } from './inlineMathUnwrap';
import { TableAlignShortcut } from './tableAlignShortcut';
import { TableShortcut } from './tableShortcut';

/** 若 option 未显式设为 `false`，则用 resolver 生成配置并推送扩展。 */
function pushIfEnabled<O>(
  extensions: AnyExtension[],
  option: O | false | undefined,
  resolver: (config: O | undefined) => AnyExtension | AnyExtension[],
): void {
  if (option === false) return;
  const result = resolver(option);
  if (Array.isArray(result)) {
    extensions.push(...result);
  } else {
    extensions.push(result);
  }
}

export function createRichExtensions(
  options: RichExtensionsOptions = {},
  messages: UmeanMessages = ZH_CN,
): AnyExtension[] {
  const extensions: AnyExtension[] = [];
  const mermaidOptions = options.mermaid === false ? undefined : options.mermaid;

  pushIfEnabled(extensions, options.image, (cfg) =>
    Image.configure(cfg ?? { allowBase64: true }),
  );

  pushIfEnabled(extensions, options.highlight, (cfg) =>
    Highlight.configure({
      multicolor: false,
      HTMLAttributes: { class: 'umean-highlight' },
      ...cfg,
    }),
  );

  pushIfEnabled(extensions, options.callout, (cfg) =>
    Callout.configure({ messages, ...(cfg || {}) }),
  );

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
    const codeBlockLanguageConfig = createCodeBlockLowlight(
      options.codeBlockLanguages,
    );
    const defaultLanguage =
      options.codeBlockLowlight &&
      'defaultLanguage' in options.codeBlockLowlight &&
      options.codeBlockLowlight.defaultLanguage
        ? options.codeBlockLowlight.defaultLanguage
        : codeBlockLanguageConfig.defaultLanguageId;

    extensions.push(
      options.codeBlockLowlight
        ? CodeBlockLowlight.configure({
            lowlight: codeBlockLanguageConfig.lowlight,
            defaultLanguage,
            ...options.codeBlockLowlight,
          })
        : CodeBlockLowlight.configure({
            lowlight: codeBlockLanguageConfig.lowlight,
            defaultLanguage,
          }),
      CodeBlockEnter,
    );

    const mermaidEnabled =
      options.mermaid !== false && mermaidOptions?.enabled !== false;
    const toolbarEnabled =
      options.codeBlockToolbar !== false &&
      options.codeBlockToolbar?.enabled !== false;

    if (mermaidEnabled || toolbarEnabled) {
      extensions.push(
        CodeBlockToolbar.configure({
          enabled: true,
          toolbar: {
            enabled: toolbarEnabled,
          },
          mermaid: {
            enabled: mermaidEnabled,
            theme: mermaidOptions?.theme ?? 'dark',
          },
          languages: codeBlockLanguageConfig.languages,
          aliasToId: codeBlockLanguageConfig.aliasToId,
          messages,
        }),
      );
    }
  }

  if (options.math !== false) {
    const katexOptions = {
      throwOnError: false,
      ...options.math?.katexOptions,
    };

    extensions.push(
      InlineMath.configure({ katexOptions }),
      BlockMathWithNodeView.configure({
        katexOptions: {
          displayMode: true,
          ...katexOptions,
        },
        messages,
      }),
      InlineMathUnwrap,
    );
  }

  if (options.mermaid !== false && mermaidOptions?.enabled !== false) {
    extensions.push(
      MermaidCodeBlock.configure({
        enabled: mermaidOptions?.enabled ?? true,
        theme: mermaidOptions?.theme ?? 'dark',
        messages,
      }),
    );
  }

  return extensions;
}
