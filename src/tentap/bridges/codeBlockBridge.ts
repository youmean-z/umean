import { BridgeExtension } from '@10play/tentap-editor';
import type { Editor } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';

import type { CodeBlockLanguageInput } from '../../core/types';
import { TenTapMermaidPreview } from '../../core/extensions/tentapMermaidPreview';
import { CodeBlockEnter } from '../../core/extensions/codeBlockNodeView';
import { applyCodeBlockLanguage } from '../../core/utils/applyCodeBlockLanguage';
import { insertMermaidCodeBlock } from '../../core/utils/insertMermaidCodeBlock';
import {
  isMermaidCodeBlockActive,
  isMermaidPreviewActive,
  setMermaidPreview,
} from '../../core/utils/setMermaidPreview';
import { createCodeBlockLowlight } from '../../core/utils/lowlight';

export enum CodeBlockEditorActionType {
  ToggleCodeBlock = 'toggle-code-block',
  SetLanguage = 'set-code-block-language',
  InsertMermaid = 'insert-mermaid',
  SetMermaidPreview = 'set-mermaid-preview',
}

type CodeBlockBridgeMessage =
  | { type: CodeBlockEditorActionType.ToggleCodeBlock }
  | {
      type: CodeBlockEditorActionType.SetLanguage;
      payload: string | null;
    }
  | { type: CodeBlockEditorActionType.InsertMermaid }
  | {
      type: CodeBlockEditorActionType.SetMermaidPreview;
      payload: boolean;
    };

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

  .mermaid-nodeview--tentap .mermaid-preview,
  .umean-editor .ProseMirror .mermaid-nodeview--tentap .mermaid-preview {
    pointer-events: auto;
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
  const languageChoices = codeBlockLanguageConfig.languages.map((item) => ({
    id: item.id,
    label: item.label,
  }));

  return new BridgeExtension({
    forceName: 'codeBlockBridge',
    tiptapExtension: CodeBlockLowlight.configure({
      lowlight: codeBlockLanguageConfig.lowlight,
      defaultLanguage: codeBlockLanguageConfig.defaultLanguageId,
    }),
    tiptapExtensionDeps: [TenTapMermaidPreview, CodeBlockEnter],
    onBridgeMessage: (editor: Editor, message: CodeBlockBridgeMessage) => {
      if (message.type === CodeBlockEditorActionType.ToggleCodeBlock) {
        editor.chain().focus().toggleCodeBlock().run();
      }

      if (message.type === CodeBlockEditorActionType.SetLanguage) {
        applyCodeBlockLanguage(editor, message.payload);
      }

      if (message.type === CodeBlockEditorActionType.InsertMermaid) {
        insertMermaidCodeBlock(editor);
        setMermaidPreview(editor, true);
      }

      if (message.type === CodeBlockEditorActionType.SetMermaidPreview) {
        setMermaidPreview(editor, message.payload);
      }

      return false;
    },
    extendEditorInstance: (
      sendBridgeMessage: (message: CodeBlockBridgeMessage) => void,
    ) => ({
      toggleCodeBlock: () =>
        sendBridgeMessage({ type: CodeBlockEditorActionType.ToggleCodeBlock }),
      setCodeBlockLanguage: (language: string | null) =>
        sendBridgeMessage({
          type: CodeBlockEditorActionType.SetLanguage,
          payload: language,
        }),
      insertMermaid: () =>
        sendBridgeMessage({ type: CodeBlockEditorActionType.InsertMermaid }),
      setMermaidPreview: (preview: boolean) =>
        sendBridgeMessage({
          type: CodeBlockEditorActionType.SetMermaidPreview,
          payload: preview,
        }),
    }),
    extendEditorState: (editor: Editor) => ({
      canToggleCodeBlock: editor.can().toggleCodeBlock(),
      isCodeBlockActive: editor.isActive('codeBlock'),
      isMermaidActive: isMermaidCodeBlockActive(editor),
      isMermaidPreview: isMermaidPreviewActive(editor),
      codeBlockLanguage: editor.isActive('codeBlock')
        ? ((editor.getAttributes('codeBlock').language as string | null) ??
          null)
        : null,
      codeBlockLanguages: languageChoices,
    }),
    extendCSS: codeBlockBridgeCSS,
  });
}

/** 默认代码块 Bridge（内置 js/ts/html/css/markdown 高亮） */
export const CodeBlockBridge = createCodeBlockBridge();
