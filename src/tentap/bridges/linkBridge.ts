import { BridgeExtension } from '@10play/tentap-editor';
import type { Editor } from '@tiptap/core';
import Link from '@tiptap/extension-link';

import {
  applyLinkHref,
  type LinkApplyRange,
} from '../../core/utils/applyLinkHref';

export enum LinkEditorActionType {
  SetLink = 'set-link',
}

type SetLinkPayload =
  | string
  | (LinkApplyRange & { href: string })
  | null;

type LinkBridgeMessage = {
  type: LinkEditorActionType.SetLink;
  payload: SetLinkPayload;
};

function parseSetLinkPayload(payload: Exclude<SetLinkPayload, null>): {
  href: string;
  range?: LinkApplyRange;
} {
  if (typeof payload === 'string') {
    return { href: payload };
  }

  if (payload.from != null && payload.to != null && payload.to >= payload.from) {
    return {
      href: payload.href,
      range: { from: payload.from, to: payload.to },
    };
  }

  return { href: payload.href };
}

/**
 * 替换 TenTap LinkBridge。原生栏会先记下选区再填 URL（输入框会抢焦点）。
 */
export const LinkBridge = new BridgeExtension({
  forceName: 'linkBridge',
  tiptapExtension: Link.configure({
    openOnClick: false,
    autolink: true,
  }),
  onBridgeMessage: (editor: Editor, message: LinkBridgeMessage) => {
    if (message.type === LinkEditorActionType.SetLink) {
      if (message.payload === null) {
        return false;
      }
      const { href, range } = parseSetLinkPayload(message.payload);
      applyLinkHref(editor, href, range);
    }

    return false;
  },
  extendEditorInstance: (
    sendBridgeMessage: (message: LinkBridgeMessage) => void,
  ) => ({
    setLink: (link: string | null, range?: LinkApplyRange | null) => {
      if (link === null) {
        sendBridgeMessage({
          type: LinkEditorActionType.SetLink,
          payload: null,
        });
        return;
      }

      sendBridgeMessage({
        type: LinkEditorActionType.SetLink,
        payload: range
          ? { href: link, from: range.from, to: range.to }
          : link,
      });
    },
  }),
  extendEditorState: (editor: Editor) => ({
    canSetLink: true,
    isLinkActive: editor.isActive('link'),
    activeLink: editor.getAttributes('link').href as string | undefined,
    linkSelection: {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    },
  }),
});
