import { Extension } from '@tiptap/core';
import type { EditorView, NodeView, ViewMutationRecord } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

import { ZH_CN, type UmeanMessages } from '../i18n';
import { copyToClipboard, focusProseMirrorNodeEnd } from '../utils/clipboard';

export interface MermaidCodeBlockOptions {
  /** 是否启用 Mermaid 实时渲染 */
  enabled?: boolean;
  /** Mermaid 图表主题，默认 dark（适配暗色编辑器） */
  theme?: 'default' | 'base' | 'dark' | 'forest' | 'neutral' | null;
  /** 国际化文案，默认 zh-CN */
  messages?: UmeanMessages;
}

export interface MermaidNodeViewOptions {
  theme?: MermaidCodeBlockOptions['theme'];
  messages?: UmeanMessages;
}

const _mermaidState: { initialized: boolean; theme: string } = {
  initialized: false,
  theme: 'dark',
};

async function ensureMermaidInitialized(
  theme: MermaidCodeBlockOptions['theme'] = 'dark',
): Promise<typeof import('mermaid')['default']> {
  const { default: mermaid } = await import('mermaid');
  const nextTheme = theme ?? 'dark';

  if (!_mermaidState.initialized || _mermaidState.theme !== nextTheme) {
    mermaid.initialize({
      startOnLoad: false,
      theme: nextTheme,
      suppressErrorRendering: true,
    });
    _mermaidState.initialized = true;
    _mermaidState.theme = nextTheme;
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
  private messages: UmeanMessages;
  private copyResetTimer: { current: ReturnType<typeof setTimeout> | undefined } = { current: undefined };

  constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    options: MermaidNodeViewOptions = {},
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.messages = options.messages ?? ZH_CN;
    if (options.theme != null) {
      _mermaidState.theme = options.theme;
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
    this.previewButton.textContent = this.messages.mermaidChart;
    this.previewButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.enterPreviewMode();
    });

    this.sourceButton = document.createElement('button');
    this.sourceButton.type = 'button';
    this.sourceButton.className = 'mermaid-toolbar__button';
    this.sourceButton.textContent = this.messages.source;
    this.sourceButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.enterEditMode();
    });

    this.copyButton = document.createElement('button');
    this.copyButton.type = 'button';
    this.copyButton.className = 'mermaid-toolbar__button mermaid-toolbar__copy';
    this.copyButton.textContent = this.messages.copy;
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
    if (this.copyResetTimer.current) {
      clearTimeout(this.copyResetTimer.current);
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
    focusProseMirrorNodeEnd(this.view, this.node, this.getPos);
  }

  private async copySource(): Promise<void> {
    await copyToClipboard(
      this.node.textContent,
      this.copyButton,
      this.messages,
      this.copyResetTimer,
      () => this.focusSource(),
    );
  }

  private async renderPreview(): Promise<void> {
    const source = this.node.textContent;
    const seq = ++this.renderSeq;

    if (!source.trim()) {
      this.previewDom.textContent = this.messages.mermaidEmpty;
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
      this.previewDom.textContent = `${this.messages.mermaidError}\n${source}`;
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
  _mermaidState.initialized = false;
  _mermaidState.theme = 'dark';
}
