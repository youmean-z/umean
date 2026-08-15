import { Extension } from '@tiptap/core';
import type { Node as PMNode, ResolvedPos } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import { liftTarget } from '@tiptap/pm/transform';

/** 删除空行时会被 ProseMirror liftEmptyBlock 拆开的容器 */
const CONTAINER_NAMES = new Set(['blockquote', 'callout']);

function findContainer($pos: ResolvedPos): {
  depth: number;
  node: PMNode;
  pos: number;
} | null {
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);
    if (CONTAINER_NAMES.has(node.type.name)) {
      return { depth, node, pos: $pos.before(depth) };
    }
  }
  return null;
}

function isEmptyTextblock(node: PMNode): boolean {
  return node.isTextblock && node.content.size === 0;
}

function prevSibling($from: ResolvedPos): { node: PMNode; pos: number } | null {
  const index = $from.index($from.depth - 1);
  if (index <= 0) {
    return null;
  }
  const parent = $from.node($from.depth - 1);
  const node = parent.child(index - 1);
  const pos = $from.before($from.depth) - node.nodeSize;
  return { node, pos };
}

function nextSibling($from: ResolvedPos): { node: PMNode; pos: number } | null {
  const parent = $from.node($from.depth - 1);
  const index = $from.index($from.depth - 1);
  if (index + 1 >= parent.childCount) {
    return null;
  }
  const node = parent.child(index + 1);
  const pos = $from.after($from.depth);
  return { node, pos };
}

/**
 * 引用 / Callout 删除手感：
 * - 空的中间段 Backspace / Enter 不再把一块拆成两块
 * - 引用解开成正文后，Backspace 不会再拼回引用里
 */
export const BlockquoteKeys = Extension.create({
  name: 'blockquoteKeys',
  priority: 120,

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;
        if (!empty || !$from.parent.isTextblock) {
          return false;
        }

        const container = findContainer($from);

        if (container && $from.parentOffset === 0) {
          const current = $from.parent;
          const currentPos = $from.before($from.depth);

          if (isEmptyTextblock(current)) {
            if (container.node.childCount === 1) {
              return editor.commands.lift(container.node.type.name);
            }
            const tr = state.tr.delete(currentPos, currentPos + current.nodeSize);
            const dir = $from.index(container.depth) === 0 ? 1 : -1;
            tr.setSelection(
              TextSelection.near(tr.doc.resolve(tr.mapping.map(currentPos, dir)), dir),
            );
            editor.view.dispatch(tr.scrollIntoView());
            return true;
          }

          if ($from.index(container.depth) === 0) {
            return editor.commands.lift(container.node.type.name);
          }

          return false;
        }

        if ($from.parentOffset !== 0) {
          return false;
        }

        const prev = prevSibling($from);
        if (!prev || !CONTAINER_NAMES.has(prev.node.type.name)) {
          return false;
        }

        const current = $from.parent;
        const currentPos = $from.before($from.depth);

        if (isEmptyTextblock(current)) {
          const tr = state.tr.delete(currentPos, currentPos + current.nodeSize);
          tr.setSelection(
            TextSelection.near(tr.doc.resolve(tr.mapping.map(currentPos, -1)), -1),
          );
          editor.view.dispatch(tr.scrollIntoView());
          return true;
        }

        const innerFrom = prev.pos + 1;
        const innerTo = prev.pos + prev.node.nodeSize - 1;
        const range = state.doc.resolve(innerFrom).blockRange(state.doc.resolve(innerTo));
        if (!range) {
          return false;
        }
        const target = liftTarget(range);
        if (target == null) {
          return false;
        }

        const tr = state.tr.lift(range, target);
        const joinPos = tr.mapping.map(currentPos, -1);
        if (joinPos > 0 && tr.doc.resolve(joinPos).nodeBefore) {
          tr.join(joinPos);
        }
        editor.view.dispatch(tr.scrollIntoView());
        return true;
      },

      Enter: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;
        if (!empty || !$from.parent.isTextblock || $from.parent.content.size > 0) {
          return false;
        }

        const container = findContainer($from);
        if (!container) {
          return false;
        }

        if (container.node.childCount === 1) {
          return editor.commands.lift(container.node.type.name);
        }

        const childIndex = $from.index(container.depth);
        if (childIndex === container.node.childCount - 1) {
          return editor.commands.lift(container.node.type.name);
        }

        const currentPos = $from.before($from.depth);
        const current = $from.parent;
        const tr = state.tr.delete(currentPos, currentPos + current.nodeSize);
        tr.setSelection(
          TextSelection.near(tr.doc.resolve(tr.mapping.map(currentPos, 1)), 1),
        );
        editor.view.dispatch(tr.scrollIntoView());
        return true;
      },

      Delete: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;
        if (!empty || !$from.parent.isTextblock) {
          return false;
        }
        if ($from.parentOffset !== $from.parent.content.size) {
          return false;
        }

        const container = findContainer($from);
        if (!container) {
          return false;
        }

        const childIndex = $from.index(container.depth);
        if (childIndex !== container.node.childCount - 1) {
          return false;
        }

        const after = nextSibling($from);
        if (!after) {
          return false;
        }

        if (isEmptyTextblock(after.node)) {
          const tr = state.tr.delete(after.pos, after.pos + after.node.nodeSize);
          editor.view.dispatch(tr.scrollIntoView());
          return true;
        }

        if (!after.node.isTextblock) {
          return false;
        }

        return editor.commands.lift(container.node.type.name);
      },
    };
  },
});
