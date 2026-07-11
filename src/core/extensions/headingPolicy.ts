import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

import type { HeadingPolicyOptions } from '../types';
import {
  applyHeadingPolicy,
  createDocumentDoc,
} from '../utils/headingPolicyUtils';

const headingPolicyPluginKey = new PluginKey('headingPolicy');

export const HeadingPolicy = Extension.create<HeadingPolicyOptions>({
  name: 'headingPolicy',

  addOptions() {
    return {
      mode: 'free',
    };
  },

  onCreate() {
    const mode = this.options.mode ?? 'free';

    if (mode !== 'document') {
      return;
    }

    const { editor } = this;
    const json = editor.getJSON();

    if (!json.content?.length) {
      editor.commands.setContent(createDocumentDoc());
      return;
    }

    editor.commands.command(({ state, dispatch }) => {
      const { tr: nextTr, changed } = applyHeadingPolicy(
        state.tr,
        state.doc,
        state.schema,
        { mode },
      );

      if (!changed || !dispatch) {
        return false;
      }

      dispatch(nextTr);
      return true;
    });
  },

  addProseMirrorPlugins() {
    const mode = this.options.mode ?? 'free';

    if (mode === 'free') {
      return [];
    }

    return [
      new Plugin({
        key: headingPolicyPluginKey,
        appendTransaction(transactions, _oldState, newState) {
          const docChanged = transactions.some((transaction) => transaction.docChanged);
          if (!docChanged) {
            return null;
          }

          const { tr, changed } = applyHeadingPolicy(
            newState.tr,
            newState.doc,
            newState.schema,
            { mode },
          );

          return changed ? tr : null;
        },
      }),
    ];
  },
});
