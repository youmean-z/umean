import { BridgeExtension } from '@10play/tentap-editor';
import type { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';

import { insertImageWithCaret } from '../../core/utils/insertImageWithCaret';

export enum ImageEditorActionType {
  SetImage = 'set-image',
}

type ImageBridgeMessage = {
  type: ImageEditorActionType.SetImage;
  payload: string;
};

const imageBridgeCSS = `
  img {
    height: auto;
    max-width: 100%;
  }

  img.ProseMirror-selectednode {
    outline: 3px solid #68cef8;
  }
`;

/**
 * 替换 TenTap ImageBridge：插图后补空段落，光标落在图下，方便继续输入。
 */
export const ImageBridge = new BridgeExtension({
  forceName: 'imageBridge',
  tiptapExtension: Image.configure({
    allowBase64: true,
  }),
  onBridgeMessage: (editor: Editor, message: ImageBridgeMessage) => {
    if (message.type === ImageEditorActionType.SetImage) {
      insertImageWithCaret(editor, message.payload);
    }

    return false;
  },
  extendEditorInstance: (
    sendBridgeMessage: (message: ImageBridgeMessage) => void,
  ) => ({
    setImage: (src: string) =>
      sendBridgeMessage({
        type: ImageEditorActionType.SetImage,
        payload: src,
      }),
  }),
  extendEditorState: () => ({}),
  extendCSS: imageBridgeCSS,
});
