import { BlockMath } from '@tiptap/extension-mathematics';
import { InputRule } from '@tiptap/core';
import type { KatexOptions } from 'katex';
import katex from 'katex';
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView, NodeView, ViewMutationRecord } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface BlockMathNodeViewOptions {
  katexOptions?: KatexOptions;
}

const blockMathNodeViewPluginKey = new PluginKey('blockMathNodeView');
const activeBlockMathNodeViews = new Set<BlockMathNodeView>();

/**
 * 块级公式 NodeView：工具栏「公式 / LaTeX」切换预览与源码编辑。
 * 空块默认 LaTeX 编辑；Backspace 选中块时进入编辑态。
 */
class BlockMathNodeView implements NodeView {
  dom: HTMLElement;

  private toolbar: HTMLElement;
  private previewButton: HTMLButtonElement;
  private latexButton: HTMLButtonElement;
  private sourceArea: HTMLTextAreaElement;
  private previewDom: HTMLElement;
  private node: ProseMirrorNode;
  private view: EditorView;
  private getPos: () => number | undefined;
  private katexOptions: KatexOptions | undefined;
  private isPreview = false;
  destroyed = false;

  constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    katexOptions?: KatexOptions,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.katexOptions = katexOptions;

    this.dom = document.createElement('div');
    this.dom.className = 'block-math-nodeview';

    this.toolbar = document.createElement('div');
    this.toolbar.className = 'block-math-toolbar';
    this.toolbar.setAttribute('contenteditable', 'false');

    this.previewButton = document.createElement('button');
    this.previewButton.type = 'button';
    this.previewButton.className = 'block-math-toolbar__button';
    this.previewButton.textContent = '公式';
    this.previewButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.enterPreviewMode();
    });

    this.latexButton = document.createElement('button');
    this.latexButton.type = 'button';
    this.latexButton.className = 'block-math-toolbar__button';
    this.latexButton.textContent = 'LaTeX';
    this.latexButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.enterEditMode();
    });

    this.toolbar.append(this.previewButton, this.latexButton);
    this.dom.appendChild(this.toolbar);

    this.sourceArea = document.createElement('textarea');
    this.sourceArea.className = 'block-math-source';
    this.sourceArea.spellcheck = false;
    this.sourceArea.placeholder = '多行公式用 \\\\ 换行，例如：E=mc^2 \\\\ \\sum_{i=1}^{n} i';
    this.sourceArea.value = node.attrs.latex ?? '';
    this.sourceArea.addEventListener('input', () => {
      this.commitLatex(this.sourceArea.value);
    });
    this.dom.appendChild(this.sourceArea);

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
  }

  matchesPos(pos: number): boolean {
    return this.getPos() === pos;
  }

  enterEditMode(): void {
    if (!this.isPreview) {
      this.sourceArea.focus();
      return;
    }

    this.isPreview = false;
    this.sourceArea.value = String(this.node.attrs.latex ?? '');
    this.syncMode();
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
    this.latexButton.setAttribute('aria-pressed', String(!this.isPreview));
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
      this.previewDom.textContent = '(LaTeX 为空)';
      return;
    }

    try {
      katex.render(latex, this.previewDom, {
        displayMode: true,
        throwOnError: false,
        ...this.katexOptions,
      });
    } catch {
      this.previewDom.textContent = `(LaTeX 解析错误)\n${latex}`;
    }
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
    const { katexOptions } = this.options;

    return ({ node, view, getPos }) =>
      new BlockMathNodeView(node, view, getPos, katexOptions);
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
