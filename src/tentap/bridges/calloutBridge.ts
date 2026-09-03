import { BridgeExtension } from '@10play/tentap-editor';
import type { Editor } from '@tiptap/core';

import {
  Callout,
  CALLOUT_TYPES,
  type CalloutType,
} from '../../core/extensions/callout';
import { ZH_CN } from '../../core/i18n';

export enum CalloutEditorActionType {
  InsertCallout = 'insert-callout',
  UpdateCalloutType = 'update-callout-type',
  UnsetCallout = 'unset-callout',
}

type CalloutBridgeMessage =
  | {
      type: CalloutEditorActionType.InsertCallout;
      payload: CalloutType | null;
    }
  | {
      type: CalloutEditorActionType.UpdateCalloutType;
      payload: CalloutType;
    }
  | { type: CalloutEditorActionType.UnsetCallout };

const calloutBridgeCSS = `
  .umean-callout {
    margin: 0.85rem 0;
    padding: 0.65rem 0.85rem 0.65rem 0.9rem;
    border-radius: 0.5rem;
    border: 1px solid transparent;
    border-left-width: 4px;
    background: rgba(148, 163, 184, 0.08);
  }

  .umean-callout::before {
    content: attr(data-callout-label);
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    opacity: 0.9;
  }

  .umean-callout > *:first-child {
    margin-top: 0;
  }

  .umean-callout > *:last-child {
    margin-bottom: 0;
  }

  .umean-callout--info {
    border-left-color: #38bdf8;
    border-color: rgba(56, 189, 248, 0.25);
    background: rgba(56, 189, 248, 0.08);
  }

  .umean-callout--tip {
    border-left-color: #34d399;
    border-color: rgba(52, 211, 153, 0.25);
    background: rgba(52, 211, 153, 0.08);
  }

  .umean-callout--warning {
    border-left-color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.28);
    background: rgba(251, 191, 36, 0.1);
  }

  .umean-callout--danger {
    border-left-color: #f87171;
    border-color: rgba(248, 113, 113, 0.28);
    background: rgba(248, 113, 113, 0.1);
  }
`;

const calloutTypeChoices = CALLOUT_TYPES.map((id) => ({
  id,
  label: {
    info: ZH_CN.calloutInfo,
    tip: ZH_CN.calloutTip,
    warning: ZH_CN.calloutWarning,
    danger: ZH_CN.calloutDanger,
  }[id],
}));

/** 插入栏提示块：栏内切换类型，不要弹系统面板。 */
export const CalloutBridge = new BridgeExtension({
  forceName: 'calloutBridge',
  tiptapExtension: Callout.configure({ messages: ZH_CN }),
  onBridgeMessage: (editor: Editor, message: CalloutBridgeMessage) => {
    if (message.type === CalloutEditorActionType.InsertCallout) {
      editor
        .chain()
        .focus()
        .setCallout({ type: message.payload ?? 'info' })
        .run();
    }

    if (message.type === CalloutEditorActionType.UpdateCalloutType) {
      editor.chain().focus().updateCalloutType(message.payload).run();
    }

    if (message.type === CalloutEditorActionType.UnsetCallout) {
      editor.chain().focus().unsetCallout().run();
    }

    return false;
  },
  extendEditorInstance: (
    sendBridgeMessage: (message: CalloutBridgeMessage) => void,
  ) => ({
    insertCallout: (type: CalloutType | null = 'info') =>
      sendBridgeMessage({
        type: CalloutEditorActionType.InsertCallout,
        payload: type,
      }),
    updateCalloutType: (type: CalloutType) =>
      sendBridgeMessage({
        type: CalloutEditorActionType.UpdateCalloutType,
        payload: type,
      }),
    unsetCallout: () =>
      sendBridgeMessage({ type: CalloutEditorActionType.UnsetCallout }),
  }),
  extendEditorState: (editor: Editor) => ({
    isCalloutActive: editor.isActive('callout'),
    calloutType: editor.isActive('callout')
      ? ((editor.getAttributes('callout').type as CalloutType | undefined) ??
        'info')
      : null,
    calloutTypes: calloutTypeChoices,
  }),
  extendCSS: calloutBridgeCSS,
});
