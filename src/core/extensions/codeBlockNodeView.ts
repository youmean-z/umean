import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView, NodeView, ViewMutationRecord } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

import { ZH_CN, type UmeanMessages } from '../i18n';
import {
  findResolvedCodeBlockLanguage,
  resolveCodeBlockLanguageId,
  type ResolvedCodeBlockLanguage,
} from '../utils/codeBlockLanguages';
import { copyToClipboard, focusProseMirrorNodeEnd } from '../utils/clipboard';
import { positionFloatingMenu } from '../utils/floatingMenuPosition';
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
  /** 已解析的代码块语言列表（由 createRichExtensions 注入） */
  languages?: ResolvedCodeBlockLanguage[];
  /** 语言别名 → 规范 id 映射 */
  aliasToId?: ReadonlyMap<string, string>;
  /** 国际化文案，默认 zh-CN */
  messages?: UmeanMessages;
}

const codeBlockToolbarPluginKey = new PluginKey('codeBlockToolbar');
const codeBlockEnterPluginKey = new PluginKey('codeBlockEnter');

function shouldExitCodeBlockOnEnter(view: EditorView): boolean {
  const { $from, empty } = view.state.selection;
  if (!empty || $from.parent.type.name !== 'codeBlock') {
    return false;
  }

  const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
  return isAtEnd && $from.parent.textContent.endsWith('\n\n');
}

function insertCodeBlockNewline(view: EditorView): boolean {
  const { state, dispatch } = view;
  const { $from, empty } = state.selection;

  if ($from.parent.type.name !== 'codeBlock' || !empty) {
    return false;
  }

  if (shouldExitCodeBlockOnEnter(view)) {
    return false;
  }

  dispatch(state.tr.insertText('\n').scrollIntoView());
  return true;
}

/** 代码块内 Enter 插入 \\n，避免浏览器把 <html> 等解析成 DOM 标签后无法换行 */
export function createCodeBlockEnterPlugin() {
  return new Plugin({
    key: codeBlockEnterPluginKey,

    props: {
      handleDOMEvents: {
        beforeinput(view, event) {
          const inputEvent = event as InputEvent;
          if (
            inputEvent.inputType !== 'insertParagraph' &&
            inputEvent.inputType !== 'insertLineBreak'
          ) {
            return false;
          }

          if (shouldExitCodeBlockOnEnter(view)) {
            return false;
          }

          const { $from, empty } = view.state.selection;
          if ($from.parent.type.name !== 'codeBlock' || !empty) {
            return false;
          }

          event.preventDefault();
          return insertCodeBlockNewline(view);
        },
      },

      handleKeyDown(view, event) {
        if (event.key !== 'Enter' || event.isComposing) {
          return false;
        }

        if (shouldExitCodeBlockOnEnter(view)) {
          return false;
        }

        const { $from, empty } = view.state.selection;
        if ($from.parent.type.name !== 'codeBlock' || !empty) {
          return false;
        }

        event.preventDefault();
        return insertCodeBlockNewline(view);
      },
    },
  });
}

function ensurePlainTextContentEditable(element: HTMLElement): void {
  // 阻止浏览器把 <html> 等输入解析成真实 DOM 标签（Chromium 支持）
  if (element.contentEditable !== 'plaintext-only') {
    element.contentEditable = 'plaintext-only';
  }
}

function formatLanguageLabel(language: string): string {
  return language.charAt(0).toUpperCase() + language.slice(1);
}

function normalizeLanguage(
  language: string | null | undefined,
  aliasToId: ReadonlyMap<string, string>,
): string {
  return resolveCodeBlockLanguageId({ aliasToId }, language);
}

function shouldHighlightLanguage(
  language: string | null | undefined,
  languages: ResolvedCodeBlockLanguage[],
  aliasToId: ReadonlyMap<string, string>,
): boolean {
  const id = normalizeLanguage(language, aliasToId);
  if (id === 'text') {
    return false;
  }

  const resolved = findResolvedCodeBlockLanguage(languages, id);
  return resolved?.highlight ?? true;
}

/**
 * 普通代码块 NodeView：顶栏语言下拉 + 复制按钮，下方为可编辑源码。
 */
export class CodeBlockToolbarNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;

  private toolbar: HTMLElement;
  private languagePicker: HTMLElement;
  private languageTrigger: HTMLButtonElement;
  private languageMenu: HTMLUListElement;
  private copyButton: HTMLButtonElement;
  private node: ProseMirrorNode;
  private view: EditorView;
  private getPos: () => number | undefined;
  private languages: ResolvedCodeBlockLanguage[];
  private aliasToId: ReadonlyMap<string, string>;
  private languageMenuOpen = false;
  private documentClickHandler?: (event: MouseEvent) => void;
  destroyed = false;
  private messages: UmeanMessages;
  private copyResetTimer: { current: ReturnType<typeof setTimeout> | undefined } = { current: undefined };

  constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    languages: ResolvedCodeBlockLanguage[],
    aliasToId: ReadonlyMap<string, string>,
    messages: UmeanMessages = ZH_CN,
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.languages = languages;
    this.aliasToId = aliasToId;
    this.messages = messages;

    this.dom = document.createElement('div');
    this.dom.className = 'code-block-nodeview';
    this.dom.draggable = false;

    this.toolbar = document.createElement('div');
    this.toolbar.className = 'code-block-toolbar';
    this.toolbar.setAttribute('contenteditable', 'false');

    this.languagePicker = document.createElement('div');
    this.languagePicker.className = 'code-block-toolbar__lang';

    this.languageTrigger = document.createElement('button');
    this.languageTrigger.type = 'button';
    this.languageTrigger.className = 'code-block-toolbar__lang-trigger';
    this.languageTrigger.setAttribute('aria-label', this.messages.codeBlockLanguage);
    this.languageTrigger.setAttribute('aria-haspopup', 'listbox');
    this.languageTrigger.setAttribute('aria-expanded', 'false');

    this.languageMenu = document.createElement('ul');
    this.languageMenu.className = 'code-block-toolbar__lang-menu';
    this.languageMenu.setAttribute('role', 'listbox');
    this.languageMenu.hidden = true;

    this.languageTrigger.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggleLanguageMenu();
    });

    this.languagePicker.append(this.languageTrigger, this.languageMenu);
    this.syncLanguagePicker(node.attrs.language);

    this.documentClickHandler = (event) => {
      const target = event.target as Node;
      if (
        this.languagePicker.contains(target) ||
        this.languageMenu.contains(target)
      ) {
        return;
      }
      this.closeLanguageMenu();
    };
    document.addEventListener('mousedown', this.documentClickHandler);

    this.copyButton = document.createElement('button');
    this.copyButton.type = 'button';
    this.copyButton.className = 'code-block-toolbar__button';
    this.copyButton.textContent = this.messages.copy;
    this.copyButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
      void this.copySource();
    });

    this.toolbar.append(this.languagePicker, this.copyButton);
    this.dom.appendChild(this.toolbar);

    const sourceDom = document.createElement('pre');
    sourceDom.className = 'code-block-source';
    this.contentDOM = document.createElement('code');
    this.syncLanguageClass(node.attrs.language);
    this.contentDOM.spellcheck = false;
    ensurePlainTextContentEditable(this.contentDOM);
    sourceDom.appendChild(this.contentDOM);
    this.dom.appendChild(sourceDom);
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.syncLanguagePicker(node.attrs.language);
    this.syncLanguageClass(node.attrs.language);
    ensurePlainTextContentEditable(this.contentDOM);
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
    if (
      event.type === 'dragstart' ||
      event.type === 'drag' ||
      event.type === 'dragend' ||
      event.type === 'drop'
    ) {
      return true;
    }

    const target = event.target as Node;
    return (
      this.toolbar.contains(target) || this.languageMenu.contains(target)
    );
  }

  destroy(): void {
    this.destroyed = true;
    this.closeLanguageMenu();
    if (this.documentClickHandler) {
      document.removeEventListener('mousedown', this.documentClickHandler);
    }
    if (this.copyResetTimer.current) {
      clearTimeout(this.copyResetTimer.current);
    }
  }

  private getLanguageLabel(languageId: string): string {
    if (languageId === 'text') {
      return this.messages.codeBlockPlainText;
    }

    const resolved = findResolvedCodeBlockLanguage(this.languages, languageId);
    return resolved?.label ?? formatLanguageLabel(languageId);
  }

  private buildLanguageMenuItems(
    currentLanguage: string | null | undefined,
  ): Array<{ id: string; label: string }> {
    const selected = normalizeLanguage(currentLanguage, this.aliasToId);
    const items: Array<{ id: string; label: string }> = [
      { id: 'text', label: this.messages.codeBlockPlainText },
      ...this.languages.map((language) => ({
        id: language.id,
        label: language.label,
      })),
    ];

    if (
      selected !== 'text' &&
      !items.some((item) => item.id === selected)
    ) {
      items.push({ id: selected, label: formatLanguageLabel(selected) });
    }

    return items;
  }

  private syncLanguagePicker(language: string | null | undefined): void {
    const selected = normalizeLanguage(language, this.aliasToId);
    this.languageTrigger.textContent = this.getLanguageLabel(selected);
    this.languageTrigger.setAttribute(
      'aria-expanded',
      this.languageMenuOpen ? 'true' : 'false',
    );

    this.languageMenu.replaceChildren();

    for (const item of this.buildLanguageMenuItems(language)) {
      const option = document.createElement('li');
      option.className = 'code-block-toolbar__lang-option';
      option.setAttribute('role', 'option');
      option.dataset.value = item.id;
      option.textContent = item.label;
      option.setAttribute('aria-selected', item.id === selected ? 'true' : 'false');

      if (item.id === selected) {
        option.classList.add('is-active');
      }

      option.addEventListener('mousedown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.setLanguage(item.id);
        this.closeLanguageMenu();
      });

      this.languageMenu.appendChild(option);
    }

    if (this.languageMenuOpen) {
      this.positionLanguageMenu();
    }
  }

  private toggleLanguageMenu(): void {
    if (this.languageMenuOpen) {
      this.closeLanguageMenu();
      return;
    }

    this.openLanguageMenu();
  }

  private openLanguageMenu(): void {
    this.languageMenuOpen = true;
    this.languageMenu.hidden = false;
    this.languageMenu.classList.add('is-portal');
    this.languagePicker.classList.add('is-open');
    this.dom.classList.add('is-lang-open');
    this.languageTrigger.setAttribute('aria-expanded', 'true');
    this.copyPanelCssVariables(this.languageMenu);
    document.body.appendChild(this.languageMenu);
    this.positionLanguageMenu();
  }

  private positionLanguageMenu(): void {
    if (!this.languageMenuOpen) {
      return;
    }

    positionFloatingMenu(
      this.languageMenu,
      this.languageTrigger.getBoundingClientRect(),
    );
  }

  private copyPanelCssVariables(target: HTMLElement): void {
    const source = getComputedStyle(this.dom);
    const keys = [
      '--umean-panel-border',
      '--umean-panel-toolbar-bg',
      '--umean-panel-button-hover-bg',
      '--umean-panel-button-hover-color',
      '--umean-panel-button-active-bg',
      '--umean-panel-button-active-color',
    ];

    for (const key of keys) {
      const value = source.getPropertyValue(key).trim();
      if (value) {
        target.style.setProperty(key, value);
      }
    }
  }

  private closeLanguageMenu(): void {
    if (!this.languageMenuOpen) {
      return;
    }

    this.languageMenuOpen = false;
    this.languageMenu.hidden = true;
    this.languageMenu.classList.remove('is-portal');
    this.languageMenu.style.position = '';
    this.languageMenu.style.left = '';
    this.languageMenu.style.top = '';
    this.languageMenu.style.zIndex = '';
    this.languageMenu.style.visibility = '';
    this.languagePicker.classList.remove('is-open');
    this.dom.classList.remove('is-lang-open');
    this.languageTrigger.setAttribute('aria-expanded', 'false');

    if (this.languageMenu.parentElement !== this.languagePicker) {
      this.languagePicker.appendChild(this.languageMenu);
    }
  }

  private syncLanguageClass(language: string | null | undefined): void {
    const normalized = normalizeLanguage(language, this.aliasToId);
    const highlight = shouldHighlightLanguage(
      language,
      this.languages,
      this.aliasToId,
    );

    this.contentDOM.className =
      normalized === 'text' || !highlight ? '' : `language-${normalized}`;
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
    this.syncLanguagePicker(nextLanguage);
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
}

export const CodeBlockEnter = Extension.create({
  name: 'codeBlockEnter',

  addProseMirrorPlugins() {
    return [createCodeBlockEnterPlugin()];
  },
});

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
      languages: [],
      aliasToId: new Map<string, string>(),
      messages: ZH_CN,
    };
  },

  addProseMirrorPlugins() {
    const opts = {
      enabled: this.options.enabled ?? true,
      toolbar: {
        enabled: this.options.toolbar?.enabled ?? true,
      },
      mermaid: {
        enabled: this.options.mermaid?.enabled ?? true,
        theme: this.options.mermaid?.theme ?? 'dark',
      },
      languages: this.options.languages ?? [],
      aliasToId: this.options.aliasToId ?? new Map<string, string>(),
      messages: this.options.messages ?? ZH_CN,
    };

    if (!opts.enabled) return [];
    if (!opts.toolbar.enabled && !opts.mermaid.enabled) return [];

    const { languages, aliasToId, messages } = opts;

    return [
      new Plugin({
        key: codeBlockToolbarPluginKey,

        props: {
          nodeViews: {
            codeBlock: ((node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) => {
              if (node.attrs.language === 'mermaid') {
                if (!opts.mermaid.enabled) {
                  if (!opts.toolbar.enabled) return undefined;
                  return new CodeBlockToolbarNodeView(node, view, getPos, languages, aliasToId, messages);
                }

                return new MermaidNodeView(node, view, getPos, {
                  theme: opts.mermaid.theme,
                  messages,
                });
              }

              if (!opts.toolbar.enabled) return undefined;
              return new CodeBlockToolbarNodeView(node, view, getPos, languages, aliasToId, messages);
            }) as any,
          },
        },
      }),
    ];
  },
});
