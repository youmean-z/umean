import { BridgeExtension } from '@10play/tentap-editor';
import type { Editor } from '@tiptap/core';
import HorizontalRule from '@tiptap/extension-horizontal-rule';

import { insertHorizontalRuleWithCaret } from '../../core/utils/insertHorizontalRuleWithCaret';

export enum HorizontalRuleEditorActionType {
  SetHorizontalRule = 'set-horizontal-rule',
}

type HorizontalRuleBridgeMessage = {
  type: HorizontalRuleEditorActionType.SetHorizontalRule;
};

const horizontalRuleBridgeCSS = `
  hr {
    border: 0;
    height: 28px;
    margin: calc(1.5rem - 14px) 0;
    padding: 0;
    background-color: transparent;
    background-image: linear-gradient(currentColor, currentColor);
    background-size: 100% 1px;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 0.35;
  }

  hr.ProseMirror-selectednode {
    outline: 3px solid #68cef8;
    outline-offset: -4px;
  }
`;

/** 插入栏「线」：分割线后补空段落，光标在线下。 */
export const HorizontalRuleBridge = new BridgeExtension({
  forceName: 'horizontalRuleBridge',
  tiptapExtension: HorizontalRule,
  onBridgeMessage: (editor: Editor, message: HorizontalRuleBridgeMessage) => {
    if (message.type === HorizontalRuleEditorActionType.SetHorizontalRule) {
      insertHorizontalRuleWithCaret(editor);
    }

    return false;
  },
  extendEditorInstance: (
    sendBridgeMessage: (message: HorizontalRuleBridgeMessage) => void,
  ) => ({
    setHorizontalRule: () =>
      sendBridgeMessage({
        type: HorizontalRuleEditorActionType.SetHorizontalRule,
      }),
  }),
  extendEditorState: () => ({}),
  extendCSS: horizontalRuleBridgeCSS,
});
