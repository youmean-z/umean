import { Editor, type JSONContent } from '@tiptap/core';

import {
  canRunEditorAction,
  isEditorActionActive,
  runEditorAction,
} from '../core/commands/runAction';
import type {
  EditorActionId,
  EditorActionPayload,
  KeyboardShortcutsOptions,
} from '../core/commands/types';
import { createDefaultExtensions } from '../core/extensions/defaultExtensions';
import { getDirtyState } from '../core/extensions/dirtyState';
import {
  emptyDoc,
  type DefaultExtensionsOptions,
} from '../core/types';
import {
  getHeadings,
  scrollToHeading,
  type HeadingItem,
} from '../core/utils/headings';
import type { EditorCoreOptions, EditorSelectionPayload } from './types';

function mergeExtensionOptions(
  extensionOptions: DefaultExtensionsOptions | undefined,
  shortcuts: KeyboardShortcutsOptions | false | undefined,
): DefaultExtensionsOptions | undefined {
  if (shortcuts === undefined) {
    return extensionOptions;
  }

  if (shortcuts === false) {
    return { ...extensionOptions, shortcuts: false };
  }

  const base =
    extensionOptions?.shortcuts &&
    typeof extensionOptions.shortcuts === 'object'
      ? extensionOptions.shortcuts
      : undefined;

  return {
    ...extensionOptions,
    shortcuts: {
      defaults: shortcuts.defaults ?? base?.defaults,
      bindings: {
        ...base?.bindings,
        ...shortcuts.bindings,
      },
    },
  };
}

export class EditorCore {
  readonly editor: Editor;
  private _onDestroy?: () => void;
  private _onSelectionUpdate?: EditorCoreOptions['onSelectionUpdate'];

  constructor(options: EditorCoreOptions = {}) {
    const {
      extensions,
      extensionOptions,
      content = emptyDoc,
      contentType = 'json',
      onUpdate,
      onSelectionUpdate,
      onDestroy,
      shortcuts,
      ...editorOptions
    } = options;

    this._onDestroy = onDestroy;
    this._onSelectionUpdate = onSelectionUpdate;

    this.editor = new Editor({
      ...editorOptions,
      extensions:
        extensions ??
        createDefaultExtensions(
          mergeExtensionOptions(extensionOptions, shortcuts),
        ),
      content,
      contentType,
      onUpdate: ({ editor }) => {
        onUpdate?.({
          editor,
          json: editor.getJSON(),
          html: editor.getHTML(),
          markdown: editor.getMarkdown(),
        });
      },
      onSelectionUpdate: ({ editor }) => {
        this._onSelectionUpdate?.(this.buildSelectionPayload(editor));
      },
    });
  }

  private buildSelectionPayload(editor: Editor): EditorSelectionPayload {
    return {
      editor,
      from: editor.state.selection.from,
      to: editor.state.selection.to,
      empty: editor.state.selection.empty,
      isActive: (action) => isEditorActionActive(editor, action),
      can: (action, payload) => canRunEditorAction(editor, action, payload),
    };
  }

  getJSON(): JSONContent {
    return this.editor.getJSON();
  }

  setJSON(json: JSONContent): void {
    this.editor.commands.setContent(json);
    this.markClean();
  }

  getHTML(): string {
    return this.editor.getHTML();
  }

  setHTML(html: string): void {
    this.editor.commands.setContent(html, { contentType: 'html' });
    this.markClean();
  }

  getMarkdown(): string {
    return this.editor.getMarkdown();
  }

  setMarkdown(markdown: string): void {
    this.editor.commands.setContent(markdown, { contentType: 'markdown' });
    this.markClean();
  }

  /** 文档是否有未保存变更（需启用 dirtyState 扩展）。 */
  isDirty(): boolean {
    return getDirtyState(this.editor);
  }

  /** 标记为已保存/干净（保存成功或主动加载内容后调用）。 */
  markClean(): boolean {
    return this.editor.commands.markClean();
  }

  /** 提取标题树（运行时 id，不写入文档）。 */
  getHeadings(): HeadingItem[] {
    return getHeadings(this.editor);
  }

  /** 跳转到标题位置并滚动进视口。 */
  scrollToHeading(pos: number): boolean {
    return scrollToHeading(this.editor, pos);
  }

  /** 执行标准动作（工具栏 / Slash / 快捷键共用同一套 ID）。 */
  run<A extends EditorActionId>(
    action: A,
    payload?: EditorActionPayload<A>,
  ): boolean {
    return runEditorAction(this.editor, action, payload);
  }

  /** 当前是否可执行该动作。 */
  can<A extends EditorActionId>(
    action: A,
    payload?: EditorActionPayload<A>,
  ): boolean {
    return canRunEditorAction(this.editor, action, payload);
  }

  /** 该动作对应标记/节点是否激活。 */
  isActive(action: EditorActionId): boolean {
    return isEditorActionActive(this.editor, action);
  }

  /** 为当前选区设置链接；空选区且在已有链接内时会扩展到整段链接。 */
  setLink(
    href: string,
    attributes?: {
      target?: string | null;
      rel?: string | null;
      class?: string | null;
    },
  ): boolean {
    return this.run('setLink', { href, ...attributes });
  }

  /** 移除当前选区（或光标所在整段）链接。 */
  unsetLink(): boolean {
    return this.run('unsetLink');
  }

  /**
   * 退出链接输入态：不删除已有链接文字，仅让后续键入变为普通文本。
   * 链末也可按 `→`。
   */
  exitLink(): boolean {
    return this.run('exitLink');
  }

  /** 当前光标/选区是否在链接上。 */
  isLinkActive(): boolean {
    return this.isActive('setLink');
  }

  /** 当前链接的 href；不在链接上时返回 `null`。 */
  getLinkHref(): string | null {
    const href = this.editor.getAttributes('link').href;
    return typeof href === 'string' && href.length > 0 ? href : null;
  }

  /** @deprecated TipTap v3 no longer supports manual mount — pass `element` in constructor options instead. */
  mount(_element: HTMLElement): void {
    throw new Error(
      'EditorCore.mount() is not supported in TipTap v3. Pass `element` in constructor options instead.',
    );
  }

  /** @deprecated TipTap v3 no longer supports manual unmount. */
  unmount(): void {
    throw new Error(
      'EditorCore.unmount() is not supported in TipTap v3. The editor is automatically unmounted on destroy.',
    );
  }

  focus(): void {
    this.editor.commands.focus();
  }

  destroy(): void {
    this._onDestroy?.();
    this.editor.destroy();
  }
}
