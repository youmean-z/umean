import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';

export interface HeadingItem {
  /** 运行时 id，不写入文档；形如 `h-{pos}`，仅供本次会话 UI */
  id: string;
  level: number;
  text: string;
  /** 标题节点在文档中的位置（可交给 scrollToHeading） */
  pos: number;
  children: HeadingItem[];
}

export interface FlatHeading {
  id: string;
  level: number;
  text: string;
  pos: number;
}

/** 遍历文档，按出现顺序收集标题（扁平） */
export function collectFlatHeadings(doc: ProseMirrorNode): FlatHeading[] {
  const items: FlatHeading[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name !== 'heading') {
      return;
    }
    const level = Number(node.attrs.level) || 1;
    items.push({
      id: `h-${pos}`,
      level,
      text: node.textContent,
      pos,
    });
  });

  return items;
}

/** 将扁平标题列表建成树（按 level 嵌套） */
export function buildHeadingTree(flat: FlatHeading[]): HeadingItem[] {
  const root: HeadingItem[] = [];
  const stack: HeadingItem[] = [];

  for (const item of flat) {
    const node: HeadingItem = {
      ...item,
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return root;
}

export function getHeadings(editor: Editor): HeadingItem[] {
  return buildHeadingTree(collectFlatHeadings(editor.state.doc));
}

/**
 * 跳转到标题位置并滚动进视口。
 * @param pos 标题节点起始位置（来自 HeadingItem.pos）
 */
export function scrollToHeading(editor: Editor, pos: number): boolean {
  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== 'heading') {
    return false;
  }

  const selectionPos = Math.min(pos + 1, pos + node.nodeSize - 1);
  const { tr } = editor.state;
  const selection = TextSelection.create(
    editor.state.doc,
    selectionPos,
    selectionPos,
  );
  editor.view.dispatch(tr.setSelection(selection).scrollIntoView());
  editor.view.focus();
  return true;
}
