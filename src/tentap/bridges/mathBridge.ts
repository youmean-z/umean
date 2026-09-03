import { BridgeExtension } from '@10play/tentap-editor';
import { Extension, type Editor } from '@tiptap/core';
import { BlockMath, InlineMath } from '@tiptap/extension-mathematics';
import { NodeSelection, Plugin } from '@tiptap/pm/state';

import { InlineMathUnwrap } from '../../core/extensions/inlineMathUnwrap';
import {
  applyMathLatex,
  type MathApplyRange,
  type MathKind,
} from '../../core/utils/applyMathLatex';

export enum MathEditorActionType {
  ApplyMath = 'apply-math',
}

type ApplyMathPayload = {
  latex: string;
  kind: MathKind;
  from?: number;
  to?: number;
};

type MathBridgeMessage = {
  type: MathEditorActionType.ApplyMath;
  payload: ApplyMathPayload;
};

const mathBridgeCSS = `
  .tiptap-mathematics-render {
    cursor: pointer;
  }

  .tiptap-mathematics-render[data-type="inline-math"] {
    padding: 0 0.2em;
    border-radius: 0.2em;
    background: rgba(148, 163, 184, 0.16);
  }

  .tiptap-mathematics-render[data-type="block-math"] {
    display: block;
    box-sizing: border-box;
    min-height: 64px;
    margin: 0.75rem 0;
    padding: 0.85rem 0.75rem;
    overflow-x: auto;
    text-align: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
  }

  .tiptap-mathematics-render[data-type="block-math"] .katex-display {
    margin: 0;
  }

  .tiptap-mathematics-render.ProseMirror-selectednode {
    outline: 2px solid #68cef8;
    outline-offset: 2px;
  }

  .inline-math-error,
  .block-math-error {
    color: #dc2626;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.875rem;
    white-space: pre-wrap;
  }
`;

const MathTapSelect = Extension.create({
  name: 'mathTapSelect',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleClickOn(view, _pos, node, nodePos) {
            if (
              node.type.name !== 'inlineMath' &&
              node.type.name !== 'blockMath'
            ) {
              return false;
            }

            view.dispatch(
              view.state.tr.setSelection(
                NodeSelection.create(view.state.doc, nodePos),
              ),
            );
            return true;
          },
        },
      }),
    ];
  },
});

function parseRange(payload: ApplyMathPayload): MathApplyRange | null {
  if (
    payload.from == null ||
    payload.to == null ||
    payload.to < payload.from
  ) {
    return null;
  }

  return { from: payload.from, to: payload.to };
}

function readMathKind(editor: Editor): MathKind | null {
  if (editor.isActive('blockMath')) {
    return 'block';
  }

  if (editor.isActive('inlineMath')) {
    return 'inline';
  }

  return null;
}

function readMathLatex(editor: Editor, kind: MathKind | null): string {
  if (kind === 'inline') {
    return (editor.getAttributes('inlineMath').latex as string | undefined) ?? '';
  }

  if (kind === 'block') {
    return (editor.getAttributes('blockMath').latex as string | undefined) ?? '';
  }

  return '';
}

/**
 * 行内 / 块级公式。手机在栏内填 LaTeX，不挂 Web 源码工具栏。
 */
export const MathBridge = new BridgeExtension({
  forceName: 'mathBridge',
  tiptapExtension: InlineMath.configure({
    katexOptions: { throwOnError: false },
  }),
  tiptapExtensionDeps: [
    BlockMath.configure({
      katexOptions: { throwOnError: false, displayMode: true },
    }),
    InlineMathUnwrap,
    MathTapSelect,
  ],
  onBridgeMessage: (editor: Editor, message: MathBridgeMessage) => {
    if (message.type === MathEditorActionType.ApplyMath) {
      applyMathLatex(
        editor,
        message.payload.latex,
        message.payload.kind,
        parseRange(message.payload),
      );
    }

    return false;
  },
  extendEditorInstance: (
    sendBridgeMessage: (message: MathBridgeMessage) => void,
  ) => ({
    applyMath: (
      latex: string,
      kind: MathKind,
      range?: MathApplyRange | null,
    ) =>
      sendBridgeMessage({
        type: MathEditorActionType.ApplyMath,
        payload: range
          ? { latex, kind, from: range.from, to: range.to }
          : { latex, kind },
      }),
  }),
  extendEditorState: (editor: Editor) => {
    const mathKind = readMathKind(editor);
    return {
      isInlineMathActive: mathKind === 'inline',
      isBlockMathActive: mathKind === 'block',
      mathKind,
      mathLatex: readMathLatex(editor, mathKind),
      mathSelection: {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      },
    };
  },
  extendCSS: mathBridgeCSS,
});
