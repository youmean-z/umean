import { Extension } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';

import type { HeadingPolicyMode } from '../types';
import {
  DEFAULT_PLACEHOLDER_CONTENT,
  DEFAULT_PLACEHOLDER_TITLE,
} from '../types';
import { createEmptyParagraphDoc } from '../utils/headingPolicyUtils';

export interface EditorPlaceholderOptions {
  mode?: HeadingPolicyMode;
  placeholderTitle?: string;
  placeholderContent?: string;
}

export function createEditorPlaceholder(
  options: EditorPlaceholderOptions = {},
) {
  const mode = options.mode ?? 'free';
  const placeholderTitle =
    options.placeholderTitle ?? DEFAULT_PLACEHOLDER_TITLE;
  const placeholderContent =
    options.placeholderContent ?? DEFAULT_PLACEHOLDER_CONTENT;

  const placeholder = Placeholder.configure({
    // document：首行空标题在光标位于正文时也要显示 placeholder
    showOnlyCurrent: mode !== 'document',
    placeholder: ({ editor, node, pos }) => {
      if (mode === 'document') {
        if (
          pos !== 0
          || node.type.name !== 'heading'
          || node.attrs.level !== 1
        ) {
          return '';
        }

        return placeholderTitle;
      }

      if (!editor.isEmpty) {
        return '';
      }

      if (node.type.name === 'paragraph') {
        return placeholderContent;
      }

      return '';
    },
  });

  const init = Extension.create<EditorPlaceholderOptions>({
    name: 'editorPlaceholderInit',

    onCreate() {
      if (mode === 'document') {
        return;
      }

      const json = this.editor.getJSON();
      if (!json.content?.length) {
        this.editor.commands.setContent(createEmptyParagraphDoc());
      }
    },
  });

  return [init, placeholder];
}
