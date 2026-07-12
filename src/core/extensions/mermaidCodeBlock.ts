import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import type { EditorView, NodeView, ViewMutationRecord } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface MermaidCodeBlockOptions {
  /** 是否启用 Mermaid 实时渲染 */
  enabled?: boolean;
}

const mermaidPluginKey = new PluginKey('mermaidCodeBlock');

let mermaidInitialized = false;

async function ensureMermaidInitialized(): Promise<typeof import('mermaid')['default']> {
  const { default: mermaid } = await import('mermaid');

  if (!mermaidInitialized) {
    mermaid.initialize({ startOnLoad: false });
    mermaidInitialized = true;
  }

  return mermaid;
}

/**
 * 追踪所有活跃的 MermaidNodeView，用于 Plugin 层面
 * 根据 selection 变化统一管理编辑/预览态切换。
 */
const nodeViews = new Set<MermaidNodeView>();

/**
 * 为 language=mermaid 的 codeBlock 创建 NodeView：
 * - 编辑态：正常 <pre><code> 编辑源码
 * - 预览态：失焦后自动渲染 SVG，点击回到编辑态
 */
class MermaidNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;

  private previewDom: HTMLElement;
  private node: ProseMirrorNode;
  private view: EditorView;
  private getPos: () => number | undefined;
  private isPreview = false;
  destroyed = false;
  private renderSeq = 0;

  constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    this.dom = document.createElement('div');
    this.dom.className = 'mermaid-nodeview';

    const pre = document.createElement('pre');
    this.contentDOM = document.createElement('code');
    this.contentDOM.className = 'language-mermaid';
    this.contentDOM.spellcheck = false;
    pre.appendChild(this.contentDOM);
    this.dom.appendChild(pre);

    this.previewDom = document.createElement('div');
    this.previewDom.className = 'mermaid-preview';
    this.previewDom.style.display = 'none';
    this.previewDom.style.cursor = 'pointer';
    this.previewDom.addEventListener('click', () => this.enterEditMode());
    this.dom.appendChild(this.previewDom);

    // 注册到全局追踪集合
    nodeViews.add(this);

    // 初次加载默认预览（编辑器初始 selection 通常在开头，不反映用户意图）
    queueMicrotask(() => {
      if (this.destroyed || !this.dom.isConnected) return;
      this.enterPreviewMode();
    });
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;

    if (this.isPreview) {
      this.renderPreview();
    }

    return true;
  }

  ignoreMutation(mutation: ViewMutationRecord): boolean {
    return this.dom.contains(mutation.target);
  }

  stopEvent(event: Event): boolean {
    if (this.isPreview && this.previewDom.contains(event.target as Node)) {
      return true;
    }
    return false;
  }

  destroy(): void {
    this.destroyed = true;
    nodeViews.delete(this);
  }

  private enterEditMode(): void {
    if (!this.isPreview) return;

    this.isPreview = false;
    this.contentDOM.parentElement!.style.display = '';
    this.previewDom.style.display = 'none';

    const pos = this.getPos();
    if (pos != null) {
      const resolved = this.view.state.doc.resolve(pos + 1);
      this.view.dispatch(
        this.view.state.tr.setSelection(TextSelection.near(resolved)),
      );
      this.view.focus();
    }
  }

  enterPreviewMode(): void {
    if (this.isPreview) return;

    this.isPreview = true;
    this.contentDOM.parentElement!.style.display = 'none';
    this.previewDom.style.display = '';
    this.renderPreview();
  }

  /** 检查是否进入编辑态（由 Plugin 根据 selection 变化调用） */
  maybeEnterEdit(): void {
    if (!this.isPreview) return;
    const pos = this.getPos();
    if (pos == null) return;
    const selFrom = this.view.state.selection.from;
    if (selFrom >= pos && selFrom <= pos + this.node.nodeSize) {
      this.enterEditMode();
    }
  }

  /** 检查是否应进入预览态（由 Plugin 根据 selection 变化调用） */
  maybeEnterPreview(): void {
    if (this.isPreview) return;
    const pos = this.getPos();
    if (pos == null) return;
    const selFrom = this.view.state.selection.from;
    if (selFrom < pos || selFrom > pos + this.node.nodeSize) {
      this.enterPreviewMode();
    }
  }

  private async renderPreview(): Promise<void> {
    const source = this.node.textContent;
    const seq = ++this.renderSeq;

    if (!source.trim()) {
      this.previewDom.textContent = '(Mermaid 源码为空)';
      return;
    }

    try {
      const mermaid = await ensureMermaidInitialized();
      if (seq !== this.renderSeq) return; // 过时的渲染
      const { svg } = await mermaid.render(
        `mermaid-${Math.random().toString(36).slice(2, 8)}`,
        source,
      );
      if (seq !== this.renderSeq) return;
      this.previewDom.innerHTML = svg;
    } catch {
      if (seq !== this.renderSeq) return;
      this.previewDom.textContent = `(Mermaid 解析错误)\n${source}`;
    }
  }
}

/**
 * Mermaid 流程图 NodeView 扩展。
 *
 * 依赖 CodeBlockLowlight 节点：当代码块语言为 mermaid 时
 * 使用 NodeView 实现编辑/预览双态切换。
 * 编辑/预览切换由 ProseMirror selection 变化驱动，不依赖 DOM focus 事件。
 */
export const MermaidCodeBlock = Extension.create<MermaidCodeBlockOptions>({
  name: 'mermaidCodeBlock',

  addOptions() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.enabled) return [];

    return [
      new Plugin({
        key: mermaidPluginKey,

        props: {
          nodeViews: {
            codeBlock: ((node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) => {
              if (node.attrs.language !== 'mermaid') {
                return undefined;
              }

              return new MermaidNodeView(node, view, getPos);
            }) as any,
          },
        },

        view() {
          return {
            update(_view) {
              // selection 变化时，检查每个 mermaid NodeView 是否需要切换态
              for (const nv of nodeViews.values()) {
                if (nv.destroyed) continue;
                nv.maybeEnterEdit();
                nv.maybeEnterPreview();
              }
            },
          };
        },
      }),
    ];
  },
});

/** @internal 测试用：重置 mermaid 初始化状态 */
export function resetMermaidInitializedForTests(): void {
  mermaidInitialized = false;
}
