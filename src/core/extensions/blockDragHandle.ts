import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection, Plugin, PluginKey, type Transaction } from '@tiptap/pm/state';
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view';

import type { HeadingPolicyMode } from '../types';
import { getEditorHeadingPolicyMode } from '../utils/headingPolicyUtils';

export interface BlockDragHandleOptions {
  /** 是否显示左侧手柄，默认 true */
  showHandle?: boolean;
}

/**
 * `document` 模式下标题固定在首块，其它块的落点不能早于标题结束位置。
 * 非 document 或空文档返回 0。
 */
export function getMinTopLevelDropPos(
  doc: ProseMirrorNode,
  mode: HeadingPolicyMode,
): number {
  if (mode !== 'document' || !doc.firstChild) {
    return 0;
  }
  return doc.firstChild.nodeSize;
}

/** `document` 下首块是策略托管的标题，不可拖。 */
export function isDocumentTitleBlockPos(
  doc: ProseMirrorNode,
  blockPos: number,
  mode: HeadingPolicyMode,
): boolean {
  return mode === 'document' && blockPos === 0 && doc.firstChild != null;
}

export interface BlockDragHandlePluginState {
  /** 手柄拖拽中的顶层块起点；null 表示未在手柄拖拽 */
  draggingFrom: number | null;
}

export const blockDragHandlePluginKey = new PluginKey<BlockDragHandlePluginState>(
  'umeanBlockDragHandle',
);

type DragHandleMeta = Partial<BlockDragHandlePluginState>;

/**
 * Widget 放在顶层 block 之前（与节点 DOM 兄弟），因此 atom / 自定义 NodeView
 *（公式、代码块、Mermaid）也能显示手柄；不会塞进 contentDOM。
 */
function resolveTopLevelBlockPos(
  doc: ProseMirrorNode,
  pos: number,
): number | null {
  if (pos < 0 || pos > doc.content.size) {
    return null;
  }

  // widget 在节点前：pos 即为顶层 block 起点
  if (pos < doc.content.size) {
    const $at = doc.resolve(pos);
    if ($at.depth === 0 && $at.nodeAfter) {
      return pos;
    }
  }

  const $pos = doc.resolve(Math.min(pos, doc.content.size));
  if ($pos.depth < 1) {
    return null;
  }
  return $pos.before(1);
}

/**
 * 将任意落点吸附为「顶层块之间的间隙」：
 * 悬停某顶层块上半 → 插到该块前；下半 → 插到该块后。
 * 不会落到 callout / blockquote 等容器内部。
 */
export function resolveTopLevelDropPos(
  view: EditorView,
  pos: number,
  clientY: number,
): number {
  const { doc } = view.state;
  const clamped = Math.min(Math.max(pos, 0), doc.content.size);
  const $pos = doc.resolve(clamped);

  let blockStart: number;
  let blockNode: ProseMirrorNode;

  if ($pos.depth === 0) {
    if ($pos.nodeAfter) {
      blockStart = $pos.pos;
      blockNode = $pos.nodeAfter;
    } else if ($pos.nodeBefore) {
      return $pos.pos;
    } else {
      return 0;
    }
  } else {
    blockStart = $pos.before(1);
    blockNode = $pos.node(1);
  }

  const blockEnd = blockStart + blockNode.nodeSize;
  const dom = view.nodeDOM(blockStart);

  if (dom instanceof Element) {
    const rect = dom.getBoundingClientRect();
    // happy-dom / 未布局时 rect 可能全 0，回退到文档位置中点
    if (rect.height > 0) {
      return clientY < rect.top + rect.height / 2 ? blockStart : blockEnd;
    }
  }

  return clamped < blockStart + blockNode.nodeSize / 2 ? blockStart : blockEnd;
}

/**
 * 在顶层兄弟之间移动整块。toPos 必须是 depth=0 的间隙位置。
 * @returns 是否发生了文档变更
 */
export function moveTopLevelBlock(
  view: EditorView,
  fromPos: number,
  toPos: number,
  mode: HeadingPolicyMode = 'free',
): boolean {
  const { doc } = view.state;
  const node = doc.nodeAt(fromPos);
  if (!node || doc.resolve(fromPos).depth !== 0) {
    return false;
  }

  if (isDocumentTitleBlockPos(doc, fromPos, mode)) {
    return false;
  }

  const minDrop = getMinTopLevelDropPos(doc, mode);
  const clampedTo = Math.max(toPos, minDrop);

  const fromEnd = fromPos + node.nodeSize;
  if (clampedTo === fromPos || clampedTo === fromEnd) {
    return false;
  }

  // 目标必须是顶层间隙
  if (clampedTo < 0 || clampedTo > doc.content.size) {
    return false;
  }
  if (doc.resolve(clampedTo).depth !== 0) {
    return false;
  }

  let tr: Transaction;
  if (clampedTo > fromPos) {
    tr = view.state.tr.delete(fromPos, fromEnd);
    const insertAt = clampedTo - node.nodeSize;
    tr = tr.insert(insertAt, node);
    tr = tr.setSelection(NodeSelection.create(tr.doc, insertAt));
  } else {
    tr = view.state.tr.delete(fromPos, fromEnd);
    tr = tr.insert(clampedTo, node);
    tr = tr.setSelection(NodeSelection.create(tr.doc, clampedTo));
  }

  tr = tr.setMeta(blockDragHandlePluginKey, { draggingFrom: null } satisfies DragHandleMeta);
  tr = tr.setMeta('uiEvent', 'drop');
  view.dispatch(tr);
  return true;
}

function setDraggingFrom(view: EditorView, draggingFrom: number | null): void {
  view.dispatch(
    view.state.tr.setMeta(blockDragHandlePluginKey, {
      draggingFrom,
    } satisfies DragHandleMeta),
  );
}

function startBlockDrag(
  view: EditorView,
  event: DragEvent,
  blockPos: number,
): void {
  const node = view.state.doc.nodeAt(blockPos);
  if (!node || !event.dataTransfer) {
    return;
  }

  const selection = NodeSelection.create(view.state.doc, blockPos);
  view.dispatch(
    view.state.tr
      .setSelection(selection)
      .setMeta(blockDragHandlePluginKey, {
        draggingFrom: blockPos,
      } satisfies DragHandleMeta),
  );

  const slice = (view.state.selection as NodeSelection).content();
  const serialized = view.serializeForClipboard(slice);

  event.dataTransfer.clearData();
  event.dataTransfer.setData('text/html', serialized.dom.innerHTML);
  event.dataTransfer.setData('text/plain', serialized.text);
  event.dataTransfer.effectAllowed = 'copyMove';

  view.dragging = { slice, move: true };
}

function createDragHandle(
  view: EditorView,
  getPos: (() => number | undefined) | boolean,
  mode: HeadingPolicyMode,
): HTMLElement {
  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'umean-drag-handle';
  handle.setAttribute('contenteditable', 'false');
  handle.setAttribute('draggable', 'true');
  handle.setAttribute('data-drag-handle', '');
  handle.setAttribute('aria-label', '拖动块');
  handle.tabIndex = -1;

  handle.addEventListener('dragstart', (event) => {
    // 阻止冒泡到 ProseMirror 默认 dragstart，避免重复序列化 / 环境缺 files 时报错
    event.stopPropagation();

    const widgetPos = typeof getPos === 'function' ? getPos() : undefined;
    if (widgetPos == null) {
      event.preventDefault();
      return;
    }

    const blockPos = resolveTopLevelBlockPos(view.state.doc, widgetPos);
    if (blockPos == null) {
      event.preventDefault();
      return;
    }

    if (isDocumentTitleBlockPos(view.state.doc, blockPos, mode)) {
      event.preventDefault();
      return;
    }

    startBlockDrag(view, event, blockPos);
  });

  handle.addEventListener('dragend', () => {
    view.dragging = null;
    const state = blockDragHandlePluginKey.getState(view.state);
    if (state?.draggingFrom != null) {
      setDraggingFrom(view, null);
    }
  });

  return handle;
}

function buildHandleDecorations(
  doc: ProseMirrorNode,
  mode: HeadingPolicyMode,
): DecorationSet {
  const decorations: Decoration[] = [];

  doc.forEach((node, offset, index) => {
    if (node.nodeSize < 1) {
      return;
    }

    // document：首块标题不挂手柄
    if (mode === 'document' && index === 0) {
      return;
    }

    decorations.push(
      Decoration.widget(
        offset,
        (view, getPos) => createDragHandle(view, getPos, mode),
        {
          // side >= 0：挂在该位置之后的节点上，作为块前的兄弟节点
          // （side < 0 会挂到前一个节点末尾，atom/NodeView 上会丢）
          side: 1,
          key: `umean-drag-handle-${offset}`,
          ignoreSelection: true,
        },
      ),
    );
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * 手柄拖拽时的顶层落点指示条（替代默认 Dropcursor，避免画在容器内部）。
 */
class BlockDropIndicatorView {
  private readonly view: EditorView;
  private readonly getMode: () => HeadingPolicyMode;
  private element: HTMLElement | null = null;
  private dropPos: number | null = null;
  private active = false;
  private readonly onDragOver: (event: DragEvent) => void;
  private readonly onDragLeave: (event: DragEvent) => void;
  private readonly onDragEnd: () => void;
  private readonly onDrop: () => void;

  constructor(view: EditorView, getMode: () => HeadingPolicyMode) {
    this.view = view;
    this.getMode = getMode;
    this.onDragOver = (event) => this.handleDragOver(event);
    this.onDragLeave = (event) => this.handleDragLeave(event);
    this.onDragEnd = () => this.clearIndicator();
    this.onDrop = () => this.clearIndicator();

    view.dom.addEventListener('dragover', this.onDragOver);
    view.dom.addEventListener('dragleave', this.onDragLeave);
    view.dom.addEventListener('dragend', this.onDragEnd);
    view.dom.addEventListener('drop', this.onDrop);
    this.syncActive();
  }

  update(): void {
    this.syncActive();
    if (this.active && this.dropPos != null) {
      this.updateOverlay(this.dropPos);
    }
  }

  destroy(): void {
    this.view.dom.removeEventListener('dragover', this.onDragOver);
    this.view.dom.removeEventListener('dragleave', this.onDragLeave);
    this.view.dom.removeEventListener('dragend', this.onDragEnd);
    this.view.dom.removeEventListener('drop', this.onDrop);
    this.clearIndicator();
    this.view.dom.classList.remove('umean-block-dragging');
  }

  private syncActive(): void {
    const draggingFrom =
      blockDragHandlePluginKey.getState(this.view.state)?.draggingFrom ?? null;
    const next = draggingFrom != null;
    if (next === this.active) {
      return;
    }
    this.active = next;
    this.view.dom.classList.toggle('umean-block-dragging', next);
    if (!next) {
      this.clearIndicator();
    }
  }

  private handleDragOver(event: DragEvent): void {
    this.syncActive();
    if (!this.active) {
      return;
    }

    const coords = this.view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });
    if (!coords) {
      return;
    }

    const mode = this.getMode();
    const toPos = Math.max(
      resolveTopLevelDropPos(this.view, coords.pos, event.clientY),
      getMinTopLevelDropPos(this.view.state.doc, mode),
    );
    this.dropPos = toPos;
    this.updateOverlay(toPos);
  }

  private handleDragLeave(event: DragEvent): void {
    if (!this.active) {
      return;
    }
    const related = event.relatedTarget;
    if (related instanceof Node && this.view.dom.contains(related)) {
      return;
    }
    this.clearIndicator();
  }

  private clearIndicator(): void {
    this.dropPos = null;
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }

  private updateOverlay(pos: number): void {
    const { doc } = this.view.state;
    const $pos = doc.resolve(Math.min(Math.max(pos, 0), doc.content.size));
    if ($pos.depth !== 0) {
      return;
    }

    const editorDOM = this.view.dom;
    const editorRect = editorDOM.getBoundingClientRect();
    const before = $pos.nodeBefore;
    const after = $pos.nodeAfter;

    let top: number | null = null;
    let left = editorRect.left;
    let right = editorRect.right;

    if (before) {
      const beforeDom = this.view.nodeDOM(pos - before.nodeSize);
      if (beforeDom instanceof Element) {
        const rect = beforeDom.getBoundingClientRect();
        top = rect.bottom;
        left = rect.left;
        right = rect.right;
      }
    }
    if (after) {
      const afterDom = this.view.nodeDOM(pos);
      if (afterDom instanceof Element) {
        const rect = afterDom.getBoundingClientRect();
        top = before ? ((top ?? rect.top) + rect.top) / 2 : rect.top;
        left = Math.min(left, rect.left);
        right = Math.max(right, rect.right);
      }
    }

    if (top == null) {
      return;
    }

    const parent = editorDOM.offsetParent;
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = 'umean-block-drop-indicator';
      this.element.setAttribute('contenteditable', 'false');
      ;(parent && parent !== document.body ? parent : document.body).appendChild(
        this.element,
      );
    }

    let parentLeft = 0;
    let parentTop = 0;
    if (
      !parent ||
      (parent === document.body &&
        getComputedStyle(parent).position === 'static')
    ) {
      parentLeft = -window.pageXOffset;
      parentTop = -window.pageYOffset;
    } else {
      const parentRect = parent.getBoundingClientRect();
      parentLeft = parentRect.left - parent.scrollLeft;
      parentTop = parentRect.top - parent.scrollTop;
    }

    const height = 2;
    this.element.style.left = `${left - parentLeft}px`;
    this.element.style.top = `${top - parentTop - height / 2}px`;
    this.element.style.width = `${Math.max(right - left, 0)}px`;
    this.element.style.height = `${height}px`;
  }
}

/**
 * 顶层块左侧拖拽手柄。
 * 仅通过手柄拖动，且落点只允许顶层兄弟换位（不嵌入 callout / blockquote 等）。
 */
export const BlockDragHandle = Extension.create<BlockDragHandleOptions>({
  name: 'umeanBlockDragHandle',

  addOptions() {
    return {
      showHandle: true,
    };
  },

  addProseMirrorPlugins() {
    if (this.options.showHandle === false) {
      return [];
    }

    const editor = this.editor;

    return [
      new Plugin<BlockDragHandlePluginState>({
        key: blockDragHandlePluginKey,
        state: {
          init(): BlockDragHandlePluginState {
            return { draggingFrom: null };
          },
          apply(tr, value): BlockDragHandlePluginState {
            const meta = tr.getMeta(blockDragHandlePluginKey) as
              | DragHandleMeta
              | undefined;
            if (meta && 'draggingFrom' in meta) {
              return { draggingFrom: meta.draggingFrom ?? null };
            }
            if (value.draggingFrom == null) {
              return value;
            }
            // 文档变更时映射源位置，避免拖拽过程中被其它 transaction 弄乱
            return {
              draggingFrom: tr.mapping.map(value.draggingFrom),
            };
          },
        },
        view(editorView) {
          return new BlockDropIndicatorView(editorView, () =>
            getEditorHeadingPolicyMode(editor),
          );
        },
        props: {
          decorations(state) {
            return buildHandleDecorations(
              state.doc,
              getEditorHeadingPolicyMode(editor),
            );
          },
          handleDrop(view, event, _slice, _moved) {
            const pluginState = blockDragHandlePluginKey.getState(view.state);
            if (pluginState?.draggingFrom == null) {
              return false;
            }

            const mode = getEditorHeadingPolicyMode(editor);
            const fromPos = pluginState.draggingFrom;
            const coords = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            if (!coords) {
              setDraggingFrom(view, null);
              return true;
            }

            const toPos = Math.max(
              resolveTopLevelDropPos(view, coords.pos, event.clientY),
              getMinTopLevelDropPos(view.state.doc, mode),
            );
            moveTopLevelBlock(view, fromPos, toPos, mode);
            // 若未移动也要清状态
            if (blockDragHandlePluginKey.getState(view.state)?.draggingFrom != null) {
              setDraggingFrom(view, null);
            }
            return true;
          },
        },
      }),
    ];
  },
});
