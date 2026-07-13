import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import type { EditorView, NodeView, ViewMutationRecord } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

import { getSharedLowlight } from '../utils/lowlight';
import {
  MermaidNodeView,
  type MermaidCodeBlockOptions,
} from './mermaidCodeBlock';

export interface CodeBlockToolbarOptions {
  /** 是否启用代码块 NodeView（工具栏 + Mermaid 路由），默认 true */
  enabled?: boolean;
  /** 非 Mermaid 代码块顶栏（语言下拉、复制），默认 true */
  toolbar?: {
    enabled?: boolean;
  };
  /** Mermaid 代码块图表预览，默认 true */
  mermaid?: {
    enabled?: boolean;
    theme?: MermaidCodeBlockOptions['theme'];
  };
}

const codeBlockToolbarPluginKey = new PluginKey('codeBlockToolbar');

const LANGUAGE_LABELS: Record<string, string> = {
  text: 'Plain Text',
  bash: 'Bash',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  css: 'CSS',
  go: 'Go',
  graphql: 'GraphQL',
  java: 'Java',
  javascript: 'JavaScript',
  json: 'JSON',
  kotlin: 'Kotlin',
  lua: 'Lua',
  makefile: 'Makefile',
  markdown: 'Markdown',
  objectivec: 'Objective-C',
  php: 'PHP',
  python: 'Python',
  ruby: 'Ruby',
  rust: 'Rust',
  scss: 'SCSS',
  shell: 'Shell',
  sql: 'SQL',
  swift: 'Swift',
  typescript: 'TypeScript',
  vbnet: 'VB.NET',
  xml: 'XML',
  yaml: 'YAML',
};

function formatLanguageLabel(language: string): string {
  return LANGUAGE_LABELS[language] ?? language.charAt(0).toUpperCase() + language.slice(1);
}

function normalizeLanguage(language: string | null | undefined): string {
  return language?.trim() || 'text';
}

function getCodeBlockLanguages(): string[] {
  return getSharedLowlight().listLanguages().slice().sort((a, b) => {
    return formatLanguageLabel(a).localeCompare(formatLanguageLabel(b));
  });
}

/**
 * 普通代码块 NodeView：顶栏语言下拉 + 复制按钮，下方为可编辑源码。
 */
export class CodeBlockToolbarNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;

  private toolbar: HTMLElement;
  private languageSelect: HTMLSelectElement;
  private copyButton: HTMLButtonElement;
  private node: ProseMirrorNode;
  private view: EditorView;
  private getPos: () => number | undefined;
  private languages: string[];
  destroyed = false;
  private copyResetTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    languages: string[],
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.languages = languages;

    this.dom = document.createElement('div');
    this.dom.className = 'code-block-nodeview';

    this.toolbar = document.createElement('div');
    this.toolbar.className = 'code-block-toolbar';
    this.toolbar.setAttribute('contenteditable', 'false');

    this.languageSelect = document.createElement('select');
    this.languageSelect.className = 'code-block-toolbar__select';
    this.languageSelect.setAttribute('aria-label', '代码块语言');
    this.populateLanguageOptions(node.attrs.language);
    this.languageSelect.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });
    this.languageSelect.addEventListener('change', () => {
      this.setLanguage(this.languageSelect.value);
    });

    this.copyButton = document.createElement('button');
    this.copyButton.type = 'button';
    this.copyButton.className = 'code-block-toolbar__button';
    this.copyButton.textContent = '复制';
    this.copyButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      void this.copySource();
    });

    this.toolbar.append(this.languageSelect, this.copyButton);
    this.dom.appendChild(this.toolbar);

    const sourceDom = document.createElement('pre');
    sourceDom.className = 'code-block-source';
    this.contentDOM = document.createElement('code');
    this.syncLanguageClass(node.attrs.language);
    this.contentDOM.spellcheck = false;
    sourceDom.appendChild(this.contentDOM);
    this.dom.appendChild(sourceDom);
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.syncLanguageSelect(node.attrs.language);
    this.syncLanguageClass(node.attrs.language);
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
    return this.toolbar.contains(target);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
    }
  }

  private populateLanguageOptions(currentLanguage: string | null | undefined): void {
    const selected = normalizeLanguage(currentLanguage);

    this.languageSelect.replaceChildren();

    const textOption = document.createElement('option');
    textOption.value = 'text';
    textOption.textContent = formatLanguageLabel('text');
    this.languageSelect.appendChild(textOption);

    for (const language of this.languages) {
      const option = document.createElement('option');
      option.value = language;
      option.textContent = formatLanguageLabel(language);
      this.languageSelect.appendChild(option);
    }

    this.languageSelect.value = selected === 'text' ? 'text' : selected;
    if (this.languageSelect.selectedIndex < 0) {
      const customOption = document.createElement('option');
      customOption.value = selected;
      customOption.textContent = formatLanguageLabel(selected);
      this.languageSelect.appendChild(customOption);
      this.languageSelect.value = selected;
    }
  }

  private syncLanguageSelect(language: string | null | undefined): void {
    const normalized = normalizeLanguage(language);
    if (this.languageSelect.value !== normalized) {
      this.populateLanguageOptions(language);
    }
  }

  private syncLanguageClass(language: string | null | undefined): void {
    const normalized = normalizeLanguage(language);
    this.contentDOM.className = normalized === 'text' ? '' : `language-${normalized}`;
  }

  private setLanguage(language: string): void {
    const pos = this.getPos();
    if (pos == null) return;

    const nextLanguage = language === 'text' ? null : language;
    if (nextLanguage === this.node.attrs.language) return;

    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        language: nextLanguage,
      }),
    );
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
}

let toolbarOptions: Required<Pick<CodeBlockToolbarOptions, 'enabled'>> & {
  toolbar: { enabled: boolean };
  mermaid: { enabled: boolean; theme: MermaidCodeBlockOptions['theme'] };
} = {
  enabled: true,
  toolbar: { enabled: true },
  mermaid: { enabled: true, theme: 'dark' },
};

/**
 * 统一 codeBlock NodeView：Mermaid 走图表预览，其余代码块显示语言下拉与复制按钮。
 */
export const CodeBlockToolbar = Extension.create<CodeBlockToolbarOptions>({
  name: 'codeBlockToolbar',

  addOptions() {
    return {
      enabled: true,
      toolbar: {
        enabled: true,
      },
      mermaid: {
        enabled: true,
        theme: 'dark' as const,
      },
    };
  },

  addProseMirrorPlugins() {
    toolbarOptions = {
      enabled: this.options.enabled ?? true,
      toolbar: {
        enabled: this.options.toolbar?.enabled ?? true,
      },
      mermaid: {
        enabled: this.options.mermaid?.enabled ?? true,
        theme: this.options.mermaid?.theme ?? 'dark',
      },
    };

    if (!toolbarOptions.enabled) return [];
    if (!toolbarOptions.toolbar.enabled && !toolbarOptions.mermaid.enabled) return [];

    const languages = getCodeBlockLanguages();

    return [
      new Plugin({
        key: codeBlockToolbarPluginKey,

        props: {
          nodeViews: {
            codeBlock: ((node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) => {
              if (node.attrs.language === 'mermaid') {
                if (!toolbarOptions.mermaid.enabled) {
                  if (!toolbarOptions.toolbar.enabled) return undefined;
                  return new CodeBlockToolbarNodeView(node, view, getPos, languages);
                }

                return new MermaidNodeView(node, view, getPos, {
                  theme: toolbarOptions.mermaid.theme,
                });
              }

              if (!toolbarOptions.toolbar.enabled) return undefined;
              return new CodeBlockToolbarNodeView(node, view, getPos, languages);
            }) as any,
          },
        },
      }),
    ];
  },
});

/** @internal 测试用：读取当前工具栏配置 */
export function getCodeBlockToolbarOptionsForTests() {
  return toolbarOptions;
}
