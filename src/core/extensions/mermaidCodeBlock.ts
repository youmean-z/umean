import { Extension } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import type { EditorView, NodeView, ViewMutationRecord } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface MermaidCodeBlockOptions {
  /** 是否启用 Mermaid 实时渲染 */
  enabled?: boolean;
  /** Mermaid 图表主题，默认 dark（适配暗色编辑器） */
  theme?: 'default' | 'base' | 'dark' | 'forest' | 'neutral' | null;
}

export interface MermaidNodeViewOptions {
  theme?: MermaidCodeBlockOptions['theme'];
}

let mermaidInitialized = false;
let mermaidTheme: MermaidCodeBlockOptions['theme'] = 'dark';

async function ensureMermaidInitialized(
  theme: MermaidCodeBlockOptions['theme'] = mermaidTheme,
): Promise<typeof import('mermaid')['default']> {
  const { default: mermaid } = await import('mermaid');
  const nextTheme = theme ?? 'dark';

  if (!mermaidInitialized || mermaidTheme !== nextTheme) {
    mermaid.initialize({
      startOnLoad: false,
      theme: nextTheme,
      suppressErrorRendering: true,
    });
    mermaidInitialized = true;
    mermaidTheme = nextTheme;
  }

  return mermaid;
}


/**
 * 为 language=mermaid 的 codeBlock 创建 NodeView：
 * - 工具栏「图表 / 源码」切换预览与源码编辑，右侧复制按钮
 * - 空块默认源码态；已有内容默认图表预览
 */
export class MermaidNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;

  private toolbar: HTMLElement;
  private tabs: HTMLElement;
  private previewButton: HTMLButtonElement;
  private sourceButton: HTMLButtonElement;
  private copyButton: HTMLButtonElement;
  private previewDom: HTMLElement;
  private node: ProseMirrorNode;
  private view: EditorView;
  private getPos: () => number | undefined;
  private isPreview = false;
  destroyed = false;
  private renderSeq = 0;
  private copyResetTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    options: MermaidNodeViewOptions = {},
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    if (options.theme !== undefined) {
      mermaidTheme = options.theme;
    }

    this.dom = document.createElement('div');
    this.dom.className = 'mermaid-nodeview';

    this.toolbar = document.createElement('div');
    this.toolbar.className = 'mermaid-toolbar';
    this.toolbar.setAttribute('contenteditable', 'false');

    this.tabs = document.createElement('div');
    this.tabs.className = 'mermaid-toolbar__tabs';

    this.previewButton = document.createElement('button');
    this.previewButton.type = 'button';
    this.previewButton.className = 'mermaid-toolbar__button';
    this.previewButton.textContent = '图表';
    this.previewButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.enterPreviewMode();
    });

    this.sourceButton = document.createElement('button');
    this.sourceButton.type = 'button';
    this.sourceButton.className = 'mermaid-toolbar__button';
    this.sourceButton.textContent = '源码';
    this.sourceButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.enterEditMode();
    });

    this.copyButton = document.createElement('button');
    this.copyButton.type = 'button';
    this.copyButton.className = 'mermaid-toolbar__button mermaid-toolbar__copy';
    this.copyButton.textContent = '复制';
    this.copyButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      void this.copySource();
    });

    this.tabs.append(this.previewButton, this.sourceButton);
    this.toolbar.append(this.tabs, this.copyButton);
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
    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
    }
  }

  private syncMode(): void {
    this.dom.classList.toggle('mermaid-nodeview--preview', this.isPreview);
    this.dom.classList.toggle('mermaid-nodeview--code', !this.isPreview);
    this.previewButton.setAttribute('aria-pressed', String(this.isPreview));
    this.sourceButton.setAttribute('aria-pressed', String(!this.isPreview));
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

  private async copySource(): Promise<void> {
    const text = this.node.textContent;

    try {
      await navigator.clipboard.writeText(text);
      this.copyButton.textContent = '已复制';
    } catch {
      this.copyButton.textContent = '复制失败';
    }

    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
    }

    this.copyResetTimer = setTimeout(() => {
      this.copyButton.textContent = '复制';
    }, 2000);

    this.focusSource();
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
 * Mermaid 配置扩展（保留名称以兼容旧配置）。
 *
 * **注意**：NodeView 注册已迁移至 CodeBlockToolbar，此扩展不再注册任何
 * Plugin 或 NodeView。`enabled` / `theme` 选项仅作为配置值存储，实际
 * 行为由 CodeBlockToolbar 控制。直接使用此扩展（绕过 createRichExtensions）
 * 时，`enabled: false` 不会禁用 Mermaid 渲染。
 */
export const MermaidCodeBlock = Extension.create<MermaidCodeBlockOptions>({
  name: 'mermaidCodeBlock',

  addOptions() {
    return {
      enabled: true,
      theme: 'dark' as const,
    };
  },
});

/** @internal 测试用：重置 mermaid 初始化状态 */
export function resetMermaidInitializedForTests(): void {
  mermaidInitialized = false;
  mermaidTheme = 'dark';
}
