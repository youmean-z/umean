import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import type { EditorView, NodeView, ViewMutationRecord } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface MermaidCodeBlockOptions {
  /** 是否启用 Mermaid 实时渲染 */
  enabled?: boolean;
  /** Mermaid 图表主题，默认 dark（适配暗色编辑器） */
  theme?: 'default' | 'base' | 'dark' | 'forest' | 'neutral' | null;
}

const mermaidPluginKey = new PluginKey('mermaidCodeBlock');

let mermaidInitialized = false;
let mermaidTheme: MermaidCodeBlockOptions['theme'] = 'dark';

async function ensureMermaidInitialized(): Promise<typeof import('mermaid')['default']> {
  const { default: mermaid } = await import('mermaid');

  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme ?? 'dark',
      suppressErrorRendering: true,
    });
    mermaidInitialized = true;
  }

  return mermaid;
}


/**
 * 为 language=mermaid 的 codeBlock 创建 NodeView：
 * - 工具栏「图表 / 代码」按钮手动切换预览与源码编辑
 * - 空块默认代码态；已有内容默认图表预览
 */
class MermaidNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;

  private toolbar: HTMLElement;
  private previewButton: HTMLButtonElement;
  private codeButton: HTMLButtonElement;
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

    this.toolbar = document.createElement('div');
    this.toolbar.className = 'mermaid-toolbar';
    this.toolbar.setAttribute('contenteditable', 'false');

    this.previewButton = document.createElement('button');
    this.previewButton.type = 'button';
    this.previewButton.className = 'mermaid-toolbar__button';
    this.previewButton.textContent = '图表';
    this.previewButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.enterPreviewMode();
    });

    this.codeButton = document.createElement('button');
    this.codeButton.type = 'button';
    this.codeButton.className = 'mermaid-toolbar__button';
    this.codeButton.textContent = '代码';
    this.codeButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.enterEditMode();
    });

    this.toolbar.append(this.previewButton, this.codeButton);
    this.dom.appendChild(this.toolbar);

    const sourceDom = document.createElement('pre');
    sourceDom.className = 'mermaid-source';
    this.contentDOM = document.createElement('code');
    this.contentDOM.className = 'language-mermaid';
    this.contentDOM.spellcheck = false;
    sourceDom.appendChild(this.contentDOM);
    this.dom.appendChild(sourceDom);

    this.previewDom = document.createElement('div');
    this.previewDom.className = 'mermaid-preview';
    this.previewDom.setAttribute('contenteditable', 'false');
    this.dom.appendChild(this.previewDom);

    this.syncMode();

    queueMicrotask(() => {
      if (this.destroyed || !this.dom.isConnected) return;
      if (this.node.textContent.trim()) {
        this.enterPreviewMode();
      }
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
    if (mutation.type === 'selection') {
      return false;
    }

    const target = mutation.target as Node;
    if (this.contentDOM.contains(target) || target === this.contentDOM) {
      return false;
    }

    return true;
  }

  stopEvent(event: Event): boolean {
    const target = event.target as Node;
    if (this.toolbar.contains(target)) {
      return true;
    }

    if (this.isPreview && this.previewDom.contains(target)) {
      return true;
    }

    return false;
  }

  destroy(): void {
    this.destroyed = true;
  }

  private syncMode(): void {
    this.dom.classList.toggle('mermaid-nodeview--preview', this.isPreview);
    this.dom.classList.toggle('mermaid-nodeview--code', !this.isPreview);
    this.previewButton.setAttribute('aria-pressed', String(this.isPreview));
    this.codeButton.setAttribute('aria-pressed', String(!this.isPreview));
  }

  private enterEditMode(): void {
    if (!this.isPreview) {
      this.focusSource();
      return;
    }

    this.isPreview = false;
    this.syncMode();
    this.focusSource();
  }

  enterPreviewMode(): void {
    if (this.isPreview) return;

    this.isPreview = true;
    this.syncMode();
    this.renderPreview();
  }

  private focusSource(): void {
    const pos = this.getPos();
    if (pos == null) return;

    const { doc } = this.view.state;
    const innerFrom = pos + 1;
    const innerTo = pos + this.node.nodeSize - 1;
    const selection =
      innerTo > innerFrom
        ? TextSelection.create(doc, innerTo)
        : TextSelection.near(doc.resolve(innerFrom));

    this.view.dispatch(this.view.state.tr.setSelection(selection));
    this.view.focus();
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
      if (seq !== this.renderSeq) return;
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
 * 使用 NodeView 实现图表/代码双态切换（工具栏按钮控制）。
 */
export const MermaidCodeBlock = Extension.create<MermaidCodeBlockOptions>({
  name: 'mermaidCodeBlock',

  addOptions() {
    return {
      enabled: true,
      theme: 'dark' as const,
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.enabled) return [];

    mermaidTheme = this.options.theme;

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
      }),
    ];
  },
});

/** @internal 测试用：重置 mermaid 初始化状态 */
export function resetMermaidInitializedForTests(): void {
  mermaidInitialized = false;
  mermaidTheme = 'dark';
}
