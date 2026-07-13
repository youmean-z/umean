import { BridgeExtension } from '@10play/tentap-editor';
import type { Editor } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';

import type { CodeBlockLanguageInput } from '../../core/types';
import { createCodeBlockLowlight } from '../../core/utils/lowlight';

export enum CodeBlockEditorActionType {
  ToggleCodeBlock = 'toggle-code-block',
}

/** WebView 内最小功能性样式，主题样式请使用 umean/styles/*.css */
const codeBlockBridgeCSS = `
  pre {
    overflow-x: auto;
  }

  pre code {
    background: none;
    padding: 0;
    font-size: 0.9em;
  }
`;

export interface CreateCodeBlockBridgeOptions {
  /** 代码块语言与高亮 grammar 配置，默认 js/ts/html/css/markdown */
  languages?: CodeBlockLanguageInput[];
}

export function createCodeBlockBridge(
  options: CreateCodeBlockBridgeOptions = {},
) {
  const codeBlockLanguageConfig = createCodeBlockLowlight(options.languages);

  return new BridgeExtension({
    forceName: 'codeBlockBridge',
    tiptapExtension: CodeBlockLowlight.configure({
      lowlight: codeBlockLanguageConfig.lowlight,
      defaultLanguage: codeBlockLanguageConfig.defaultLanguageId,
    }),
    onBridgeMessage: (editor: Editor, message: { type: CodeBlockEditorActionType }) => {
      if (message.type === CodeBlockEditorActionType.ToggleCodeBlock) {
        editor.chain().focus().toggleCodeBlock().run();
      }

      return false;
    },
    extendEditorInstance: (sendBridgeMessage: (message: { type: CodeBlockEditorActionType }) => void) => ({
      toggleCodeBlock: () =>
        sendBridgeMessage({ type: CodeBlockEditorActionType.ToggleCodeBlock }),
    }),
    extendEditorState: (editor: Editor) => ({
      canToggleCodeBlock: editor.can().toggleCodeBlock(),
      isCodeBlockActive: editor.isActive('codeBlock'),
    }),
    extendCSS: codeBlockBridgeCSS,
  });
}

/** 默认代码块 Bridge（内置 js/ts/html/css/markdown 高亮） */
export const CodeBlockBridge = createCodeBlockBridge();
