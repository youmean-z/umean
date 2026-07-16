import { Extension, type Editor } from '@tiptap/core';
import { Plugin, PluginKey, type EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

import { ZH_CN, type UmeanMessages } from '../i18n';
import { runEditorAction } from '../commands/runAction';
import {
  filterSlashItems,
  resolveSlashItems,
} from '../commands/slashItems';
import type {
  SlashCommandOptions,
  SlashItem,
  SlashMatch,
  SlashState,
} from '../commands/slashTypes';
import {
  computeFloatingMenuPosition,
  positionFloatingMenu,
} from '../utils/floatingMenuPosition';

export const slashPluginKey = new PluginKey<SlashState>('umeanSlash');

const BLOCKED_PARENTS = new Set([
  'codeBlock',
  'inlineMath',
  'blockMath',
]);

export function findSlashMatch(
  state: EditorState,
  trigger = '/',
): SlashMatch | null {
  const { selection } = state;
  if (!selection.empty) {
    return null;
  }

  const { $from } = selection;
  if ($from.parent.type.spec.code) {
    return null;
  }
  if (BLOCKED_PARENTS.has($from.parent.type.name)) {
    return null;
  }

  const parentStart = $from.start();
  const textBefore = $from.parent.textBetween(
    0,
    $from.parentOffset,
    undefined,
    '\0',
  );

  const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?:^|\\s)(${escaped}([^\\s]*))$`);
  const match = pattern.exec(textBefore);
  if (!match) {
    return null;
  }

  const matched = match[1];
  const query = match[2] ?? '';
  const from = parentStart + $from.parentOffset - matched.length;
  const to = $from.pos;

  if (from < parentStart) {
    return null;
  }

  return { from, to, query };
}

function createInitialSlashState(): SlashState {
  return {
    active: false,
    from: 0,
    to: 0,
    query: '',
    items: [],
    activeIndex: 0,
  };
}

function computeSlashState(
  editor: Editor,
  state: EditorState,
  options: SlashCommandOptions,
  prev: SlashState | undefined,
  messages: UmeanMessages,
): SlashState {
  const trigger = options.trigger ?? '/';
  const match = findSlashMatch(state, trigger);
  if (!match) {
    return createInitialSlashState();
  }

  const allItems = resolveSlashItems(
    editor,
    options.items ?? 'default',
    options.extendItems ?? [],
    messages,
  );
  const items = filterSlashItems(allItems, match.query);
  const prevIndex = prev?.active ? prev.activeIndex : 0;
  const activeIndex =
    items.length === 0
      ? 0
      : Math.min(prevIndex, items.length - 1);

  return {
    active: true,
    from: match.from,
    to: match.to,
    query: match.query,
    items,
    activeIndex,
  };
}

function deleteSlashRange(view: EditorView, from: number, to: number): void {
  const { state, dispatch } = view;
  dispatch(state.tr.delete(from, to).scrollIntoView());
}

function executeSlashItem(
  editor: Editor,
  view: EditorView,
  item: SlashItem,
  range: { from: number; to: number },
  options: SlashCommandOptions,
): boolean {
  const apply = (payload = item.payload) => {
    deleteSlashRange(view, range.from, range.to);
    return runEditorAction(editor, item.action, payload);
  };

  const dismiss = () => {
    deleteSlashRange(view, range.from, range.to);
  };

  if (item.needsRequest) {
    const handled = options.onRequest?.({
      editor,
      item,
      apply,
      dismiss,
    });
    if (handled) {
      return true;
    }
    return false;
  }

  return apply(item.payload);
}

function getClientRect(view: EditorView, from: number): DOMRect | null {
  try {
    const coords = view.coordsAtPos(from);
    return new DOMRect(
      coords.left,
      coords.bottom,
      0,
      Math.max(0, coords.bottom - coords.top),
    );
  } catch {
    return null;
  }
}

function createSlashMenuElement(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'umean-slash';
  root.setAttribute('role', 'listbox');
  root.style.display = 'none';
  return root;
}

function renderSlashMenuDom(
  root: HTMLElement,
  state: SlashState,
  onPick: (index: number) => void,
  messages: UmeanMessages,
): void {
  root.replaceChildren();

  if (!state.active || state.items.length === 0) {
    root.style.display = 'none';
    return;
  }

  root.style.display = 'block';

  let lastGroup = '';
  state.items.forEach((item, index) => {
    const group = item.group ?? '';
    if (group && group !== lastGroup) {
      lastGroup = group;
      const label = document.createElement('div');
      label.className = 'umean-slash-group';
      label.textContent = groupLabel(group, messages);
      root.appendChild(label);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'umean-slash-item';
    button.setAttribute('role', 'option');
    button.dataset.index = String(index);
    if (index === state.activeIndex) {
      button.classList.add('is-active');
      button.setAttribute('aria-selected', 'true');
    }
    button.textContent = item.title;
    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
      onPick(index);
    });
    root.appendChild(button);
  });

  const active = root.querySelector<HTMLElement>('.umean-slash-item.is-active');
  active?.scrollIntoView({ block: 'nearest' });
}

function groupLabel(group: string, messages: UmeanMessages): string {
  switch (group) {
    case 'basic':
      return messages.slashGroupBasic;
    case 'list':
      return messages.slashGroupList;
    case 'callout':
      return messages.slashGroupCallout;
    case 'insert':
      return messages.slashGroupInsert;
    case 'media':
      return messages.slashGroupMedia;
    default:
      return group;
  }
}

/** @deprecated 使用 computeFloatingMenuPosition；保留别名以免破坏现有测试引用 */
export function computeSlashMenuPosition(options: {
  caret: { top: number; bottom: number; left: number };
  menu: { width: number; height: number };
  viewport: { width: number; height: number };
  gap?: number;
  margin?: number;
}): { top: number; left: number; preferAbove: boolean } {
  return computeFloatingMenuPosition({
    anchor: options.caret,
    menu: options.menu,
    viewport: options.viewport,
    gap: options.gap,
    margin: options.margin,
  });
}

function positionSlashMenu(
  root: HTMLElement,
  view: EditorView,
  from: number,
): void {
  const rect = getClientRect(view, from);
  if (!rect) {
    return;
  }

  positionFloatingMenu(root, rect);
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    slashCommand: {
      /** 关闭 Slash 菜单（通过插入零宽变动或元数据；实际由插件重算） */
      closeSlash: () => ReturnType;
    };
  }
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'umeanSlashCommand',

  addOptions() {
    return {
      trigger: '/',
      items: 'default' as const,
      extendItems: [] as SlashItem[],
      render: 'dom' as const,
      onRequest: undefined,
      onUpdate: undefined,
      messages: ZH_CN,
    };
  },

  addCommands() {
    return {
      closeSlash:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            dispatch(tr.setMeta(slashPluginKey, { close: true }));
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const options = this.options;

    return [
      new Plugin<SlashState>({
        key: slashPluginKey,
        state: {
          init: () => createInitialSlashState(),
          apply: (tr, prev, _oldState, newState) => {
            const meta = tr.getMeta(slashPluginKey) as
              | { close?: boolean; activeIndex?: number }
              | undefined;

            if (meta?.close) {
              return createInitialSlashState();
            }

            if (typeof meta?.activeIndex === 'number' && prev.active) {
              return {
                ...prev,
                activeIndex: Math.max(
                  0,
                  Math.min(meta.activeIndex, Math.max(0, prev.items.length - 1)),
                ),
              };
            }

            if (!tr.docChanged && !tr.selectionSet) {
              return prev;
            }

            const messages = options.messages ?? ZH_CN;
            return computeSlashState(editor, newState, options, prev, messages);
          },
        },
        props: {
          handleKeyDown(view, event) {
            const slash = slashPluginKey.getState(view.state);
            if (!slash?.active) {
              return false;
            }

            if (event.key === 'Escape') {
              editor.commands.closeSlash();
              return true;
            }

            if (slash.items.length === 0) {
              return false;
            }

            if (event.key === 'ArrowDown') {
              const next = (slash.activeIndex + 1) % slash.items.length;
              view.dispatch(
                view.state.tr.setMeta(slashPluginKey, { activeIndex: next }),
              );
              return true;
            }

            if (event.key === 'ArrowUp') {
              const next =
                (slash.activeIndex - 1 + slash.items.length) % slash.items.length;
              view.dispatch(
                view.state.tr.setMeta(slashPluginKey, { activeIndex: next }),
              );
              return true;
            }

            if (event.key === 'Enter') {
              const item = slash.items[slash.activeIndex];
              if (!item) {
                return false;
              }
              event.preventDefault();
              executeSlashItem(
                editor,
                view,
                item,
                { from: slash.from, to: slash.to },
                options,
              );
              return true;
            }

            return false;
          },
        },
        view(view) {
          if (options.render === false) {
            return {
              update(updatedView) {
                const slash =
                  slashPluginKey.getState(updatedView.state) ??
                  createInitialSlashState();
                options.onUpdate?.({
                  ...slash,
                  clientRect: slash.active
                    ? () => getClientRect(updatedView, slash.from)
                    : null,
                });
              },
              destroy() {},
            };
          }

          const root = createSlashMenuElement();
          // 挂到 body，避免被编辑器容器 overflow:hidden 裁切
          document.body.appendChild(root);

          const pick = (index: number) => {
            const slash = slashPluginKey.getState(view.state);
            if (!slash?.active) {
              return;
            }
            const item = slash.items[index];
            if (!item) {
              return;
            }
            executeSlashItem(
              editor,
              view,
              item,
              { from: slash.from, to: slash.to },
              options,
            );
          };

          const sync = (updatedView: EditorView) => {
            const slash =
              slashPluginKey.getState(updatedView.state) ??
              createInitialSlashState();
            const messages = options.messages ?? ZH_CN;

            renderSlashMenuDom(root, slash, pick, messages);
            if (slash.active) {
              positionSlashMenu(root, updatedView, slash.from);
            }

            options.onUpdate?.({
              ...slash,
              clientRect: slash.active
                ? () => getClientRect(updatedView, slash.from)
                : null,
            });
          };

          return {
            update(updatedView) {
              sync(updatedView);
            },
            destroy() {
              root.remove();
            },
          };
        },
      }),
    ];
  },
});
