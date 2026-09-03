import { Extension } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import {
  NodeSelection,
  Plugin,
  PluginKey,
  TextSelection,
  type EditorState,
  type Transaction,
} from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

import { skipDirtyTracking } from './dirtyState';

export const trailingParagraphPluginKey = new PluginKey('umeanTrailingParagraph');

/** 图 / 分割线等不可内编辑的块：后面没有文本块时既点不进光标，手机换行也经常被吞。 */
export function isBlockAtom(node: PMNode | null | undefined): boolean {
  if (!node?.isBlock || node.isTextblock) {
    return false;
  }

  return node.isAtom || node.childCount === 0;
}

export function needsTrailingParagraph(doc: PMNode): boolean {
  const last = doc.lastChild;
  if (!last) {
    return false;
  }

  return isBlockAtom(last) || last.type.name === 'table';
}

function insertParagraphAt(
  state: EditorState,
  pos: number,
  dispatch?: (tr: Transaction) => void,
  options: { focus?: boolean } = {},
): boolean {
  const type = state.schema.nodes.paragraph;
  if (!type || pos < 0 || pos > state.doc.content.size) {
    return false;
  }

  const $pos = state.doc.resolve(pos);
  if (!$pos.parent.canReplaceWith($pos.index(), $pos.index(), type)) {
    return false;
  }

  if (dispatch) {
    let tr = state.tr.insert(pos, type.create());
    if (options.focus !== false) {
      tr = tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1)));
    }
    dispatch(tr.scrollIntoView());
  }

  return true;
}

/**
 * 图被选中、Gapcursor 停在块后、或空段落紧挨 atom 时，插入新段落并放光标。
 * 供 Enter / 手机 beforeinput 共用。
 */
export function breakAfterBlockAtom(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean {
  const { selection } = state;
  const paragraph = state.schema.nodes.paragraph;
  if (!paragraph) {
    return false;
  }

  if (selection instanceof NodeSelection && isBlockAtom(selection.node)) {
    return insertParagraphAt(state, selection.to, dispatch);
  }

  const { $from, empty } = selection;
  if (empty && !$from.parent.isTextblock) {
    return insertParagraphAt(state, selection.from, dispatch);
  }

  if (
    !empty ||
    $from.parent.type.name !== 'paragraph' ||
    $from.parent.content.size > 0
  ) {
    return false;
  }

  const index = $from.index($from.depth - 1);
  if (index <= 0) {
    return false;
  }

  const prev = $from.node($from.depth - 1).child(index - 1);
  if (!isBlockAtom(prev)) {
    return false;
  }

  return insertParagraphAt(state, $from.after(), dispatch);
}

function handleBreakEvent(view: EditorView): boolean {
  return breakAfterBlockAtom(view.state, view.dispatch);
}

function appendTrailingParagraph(
  transactions: readonly Transaction[],
  newState: EditorState,
): Transaction | null {
  if (!transactions.some((transaction) => transaction.docChanged)) {
    return null;
  }

  if (!needsTrailingParagraph(newState.doc)) {
    return null;
  }

  const type = newState.schema.nodes.paragraph;
  if (!type) {
    return null;
  }

  const pos = newState.doc.content.size;
  const stealFocus =
    newState.selection instanceof NodeSelection ||
    !newState.selection.$from.parent.isTextblock;

  let appended: Transaction | null = null;
  const inserted = insertParagraphAt(
    newState,
    pos,
    (tr) => {
      appended = tr;
    },
    { focus: stealFocus },
  );

  if (!inserted || !appended) {
    return null;
  }

  skipDirtyTracking(appended);
  return appended;
}

/**
 * 文末始终留一个段落；图后空段 / 选中图片时接管换行（含手机 beforeinput）。
 */
export const TrailingParagraph = Extension.create({
  name: 'trailingParagraph',
  priority: 110,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: trailingParagraphPluginKey,
        view(editorView) {
          const apply = () => {
            if (!needsTrailingParagraph(editorView.state.doc)) {
              return;
            }

            const stealFocus =
              editorView.state.selection instanceof NodeSelection ||
              !editorView.state.selection.$from.parent.isTextblock;

            insertParagraphAt(
              editorView.state,
              editorView.state.doc.content.size,
              (tr) => {
                skipDirtyTracking(tr);
                editorView.dispatch(tr);
              },
              { focus: stealFocus },
            );
          };

          apply();
          return { update: apply };
        },
        appendTransaction: (transactions, _oldState, newState) =>
          appendTrailingParagraph(transactions, newState),
        props: {
          handleDOMEvents: {
            beforeinput(view, event) {
              const inputEvent = event as InputEvent;
              if (
                inputEvent.inputType !== 'insertParagraph' &&
                inputEvent.inputType !== 'insertLineBreak'
              ) {
                return false;
              }

              if (!breakAfterBlockAtom(view.state)) {
                return false;
              }

              event.preventDefault();
              return handleBreakEvent(view);
            },
          },
          handleKeyDown(view, event) {
            if (event.key !== 'Enter' || event.isComposing || event.defaultPrevented) {
              return false;
            }

            return handleBreakEvent(view);
          },
        },
      }),
    ];
  },
});
