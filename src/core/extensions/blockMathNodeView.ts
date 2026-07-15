import { BlockMath } from '@tiptap/extension-mathematics';
import { InputRule } from '@tiptap/core';
import type { KatexOptions } from 'katex';
import katex from 'katex';
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView, NodeView, ViewMutationRecord } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

import { ZH_CN, type UmeanMessages } from '../i18n';
import { copyToClipboard } from '../utils/clipboard';

export interface BlockMathNodeViewOptions {
  katexOptions?: KatexOptions;
  /** 国际化文案，默认 zh-CN */
  messages?: UmeanMessages;
}

const blockMathNodeViewPluginKey = new PluginKey('blockMathNodeView');
const activeBlockMathNodeViews = new Set<BlockMathNodeView>();

/** 根据内容自动调整块级公式源码 textarea 高度，避免内部滚动条 */
export function resizeBlockMathSourceArea(sourceArea: HTMLTextAreaElement): void {
  sourceArea.style.height = 'auto';

  let nextHeight = sourceArea.scrollHeight;
  if (nextHeight <= 0) {
    const styles = getComputedStyle(sourceArea);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 21;
    const paddingY =
      (Number.parseFloat(styles.paddingTop) || 0) +
      (Number.parseFloat(styles.paddingBottom) || 0);
    const lineCount = Math.max(1, sourceArea.value.split('\n').length);
    nextHeight = lineCount * lineHeight + paddingY;
  }

  sourceArea.style.height = `${nextHeight}px`;
}

/**
 * 块级公式 NodeView：工具栏「公式 / 源码」切换预览与源码编辑，右侧复制按钮。
 * 空块默认源码编辑；Backspace 选中块时进入编辑态。
 */
class BlockMathNodeView implements NodeView {
  dom: HTMLElement;

  private toolbar: HTMLElement;
  private tabs: HTMLElement;
  private previewButton: HTMLButtonElement;
  private sourceButton: HTMLButtonElement;
  private copyButton: HTMLButtonElement;
  private sourceArea: HTMLTextAreaElement;
  private previewDom: HTMLElement;
  private node: ProseMirrorNode;
  private view: EditorView;
  private getPos: () => number | undefined;
  private katexOptions: KatexOptions | undefined;
  private messages: UmeanMessages;
  private isPreview = false;
  destroyed = false;
  private copyResetTimer: { current: ReturnType<typeof setTimeout> | undefined } = { current: undefined };

  constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    katexOptions?: KatexOptions,
    messages?: UmeanMessages,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.katexOptions = katexOptions;
    this.messages = messages ?? ZH_CN;

    this.dom = document.createElement('div');
    this.dom.className = 'block-math-nodeview';

    this.toolbar = document.createElement('div');
    this.toolbar.className = 'block-math-toolbar';
    this.toolbar.setAttribute('contenteditable', 'false');

    this.tabs = document.createElement('div');
    this.tabs.className = 'block-math-toolbar__tabs';

    this.previewButton = document.createElement('button');
    this.previewButton.type = 'button';
    this.previewButton.className = 'block-math-toolbar__button';
    this.previewButton.textContent = this.messages.blockMathPreview;
    this.previewButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.enterPreviewMode();
    });

    this.sourceButton = document.createElement('button');
    this.sourceButton.type = 'button';
    this.sourceButton.className = 'block-math-toolbar__button';
    this.sourceButton.textContent = this.messages.source;
    this.sourceButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.enterEditMode();
    });

    this.copyButton = document.createElement('button');
    this.copyButton.type = 'button';
    this.copyButton.className = 'block-math-toolbar__button block-math-toolbar__copy';
    this.copyButton.textContent = this.messages.copy;
    this.copyButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      void this.copySource();
    });

    this.tabs.append(this.previewButton, this.sourceButton);
    this.toolbar.append(this.tabs, this.copyButton);
    this.dom.appendChild(this.toolbar);

    this.sourceArea = document.createElement('textarea');
    this.sourceArea.className = 'block-math-source';
    this.sourceArea.spellcheck = false;
    this.sourceArea.placeholder = this.messages.blockMathPlaceholder;
    this.sourceArea.value = node.attrs.latex ?? '';
    this.sourceArea.addEventListener('input', () => {
      this.resizeSourceArea();
      this.commitLatex(this.sourceArea.value);
    });
    this.dom.appendChild(this.sourceArea);
    this.resizeSourceArea();

    this.previewDom = document.createElement('div');
    this.previewDom.className = 'block-math-preview';
    this.previewDom.setAttribute('contenteditable', 'false');
    this.dom.appendChild(this.previewDom);

    activeBlockMathNodeViews.add(this);
    this.syncMode();

    queueMicrotask(() => {
      if (this.destroyed || !this.dom.isConnected) return;
      if (String(this.node.attrs.latex ?? '').trim()) {
        this.enterPreviewMode();
      } else {
        this.enterEditMode();
      }
    });
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;

    if (!this.isPreview && document.activeElement !== this.sourceArea) {
      this.sourceArea.value = String(node.attrs.latex ?? '');
      this.resizeSourceArea();
    }

    if (this.isPreview) {
      this.renderPreview();
    }

    return true;
  }

  ignoreMutation(_mutation: ViewMutationRecord): boolean {
    return true;
  }

  stopEvent(event: Event): boolean {
    const target = event.target as Node;
    if (this.toolbar.contains(target)) return true;
    if (!this.isPreview && this.sourceArea.contains(target)) return true;
    if (this.isPreview && this.previewDom.contains(target)) return true;
    return false;
  }

  destroy(): void {
    this.destroyed = true;
    activeBlockMathNodeViews.delete(this);
    if (this.copyResetTimer.current) {
      clearTimeout(this.copyResetTimer.current);
    }
  }

  matchesPos(pos: number): boolean {
    return this.getPos() === pos;
  }

  enterEditMode(): void {
    if (!this.isPreview) {
      this.resizeSourceArea();
      this.sourceArea.focus();
      return;
    }

    this.isPreview = false;
    this.sourceArea.value = String(this.node.attrs.latex ?? '');
    this.syncMode();
    this.resizeSourceArea();
    this.sourceArea.focus();
  }

  private enterPreviewMode(): void {
    if (this.isPreview) return;

    this.commitLatex(this.sourceArea.value);
    this.isPreview = true;
    this.syncMode();
    this.renderPreview();
  }

  private syncMode(): void {
    this.dom.classList.toggle('block-math-nodeview--preview', this.isPreview);
    this.dom.classList.toggle('block-math-nodeview--edit', !this.isPreview);
    this.previewButton.setAttribute('aria-pressed', String(this.isPreview));
    this.sourceButton.setAttribute('aria-pressed', String(!this.isPreview));
  }

  private commitLatex(latex: string): void {
    if (latex === this.node.attrs.latex) return;

    const pos = this.getPos();
    if (pos == null) return;

    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(pos, undefined, { latex }),
    );
  }

  private renderPreview(): void {
    const latex = String(this.node.attrs.latex ?? '');
    this.previewDom.innerHTML = '';

    if (!latex.trim()) {
      this.previewDom.textContent = this.messages.blockMathEmpty;
      return;
    }

    try {
      katex.render(latex, this.previewDom, {
        displayMode: true,
        throwOnError: false,
        ...this.katexOptions,
      });
    } catch {
      this.previewDom.textContent = `${this.messages.blockMathError}\n${latex}`;
    }
  }

  private focusSource(): void {
    if (this.isPreview) {
      this.enterEditMode();
      return;
    }

    this.sourceArea.focus();
    const end = this.sourceArea.value.length;
    this.sourceArea.setSelectionRange(end, end);
  }

  private async copySource(): Promise<void> {
    await copyToClipboard(
      String(this.node.attrs.latex ?? ''),
      this.copyButton,
      this.messages,
      this.copyResetTimer,
      () => this.focusSource(),
    );
  }

  private resizeSourceArea(): void {
    resizeBlockMathSourceArea(this.sourceArea);
  }
}

function enterEditModeForBlockMathAt(view: EditorView, pos: number): boolean {
  for (const nodeView of activeBlockMathNodeViews) {
    if (nodeView.matchesPos(pos)) {
      nodeView.enterEditMode();
      return true;
    }
  }

  return false;
}

/** 覆盖默认 BlockMath NodeView，并追加 $$$ + 空格快捷输入与 Backspace 进编辑 */
export const BlockMathWithNodeView = BlockMath.extend<BlockMathNodeViewOptions>({
  addNodeView() {
    const { katexOptions, messages } = this.options;

    return ({ node, view, getPos }) =>
      new BlockMathNodeView(node, view, getPos, katexOptions, messages);
  },

  addInputRules() {
    const parentRules = this.parent?.() ?? [];

    return [
      ...parentRules,
      new InputRule({
        find: /^\$\$\$\s$/,
        handler: ({ state, range }) => {
          const { schema, tr } = state;
          const blockMath = schema.nodes.blockMath;
          if (!blockMath) return;

          const $from = tr.doc.resolve(range.from);
          const blockStart = $from.before();
          const block = tr.doc.nodeAt(blockStart);
          const node = blockMath.create({ latex: '' });

          if (block?.isTextblock && block.textContent.trim() === '$$$') {
            tr.replaceWith(blockStart, blockStart + block.nodeSize, node);
            tr.setSelection(NodeSelection.create(tr.doc, blockStart));
          } else {
            tr.delete(range.from, range.to);
            const pos = tr.mapping.map(range.from);
            tr.insert(pos, node);
            tr.setSelection(NodeSelection.create(tr.doc, pos));
          }
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    const parentPlugins = this.parent?.() ?? [];

    return [
      ...parentPlugins,
      new Plugin({
        key: blockMathNodeViewPluginKey,
        props: {
          handleKeyDown(view, event) {
            if (event.key !== 'Backspace' && event.key !== 'Delete') {
              return false;
            }

            const { selection } = view.state;

            if (
              selection instanceof NodeSelection &&
              selection.node.type.name === 'blockMath'
            ) {
              event.preventDefault();
              return enterEditModeForBlockMathAt(view, selection.from);
            }

            return false;
          },
        },
      }),
    ];
  },
});

/** @deprecated 使用 BlockMathWithNodeView；保留别名以兼容旧导出 */
export const BlockMathNodeViewExtension = BlockMathWithNodeView;

/** @internal 测试用：清空活跃 NodeView 追踪 */
export function resetBlockMathNodeViewsForTests(): void {
  activeBlockMathNodeViews.clear();
}
