import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, TextSelection, type Transaction } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface FindMatch {
  from: number;
  to: number;
}

export interface FindReplacePluginState {
  query: string;
  caseSensitive: boolean;
  matches: FindMatch[];
  /** 当前高亮项下标；无匹配时为 -1 */
  activeIndex: number;
  decorations: DecorationSet;
}

export interface SetFindQueryOptions {
  caseSensitive?: boolean;
  /**
   * 设置查询后是否选中首个匹配（或光标后第一个）。
   * @default true
   */
  select?: boolean;
  /**
   * 是否把焦点移回编辑器。默认与 `select` 相同：
   * 在外部输入框里边打字边预览高亮时应传 `select: false`（或 `focus: false`）。
   */
  focus?: boolean;
}

export interface FindReplaceOptions {
  /** 普通匹配 class，默认 `umean-find-match` */
  matchClass?: string;
  /** 当前匹配 class，默认 `umean-find-match is-current` */
  currentMatchClass?: string;
}

type FindReplaceMeta =
  | { type: 'setQuery'; query: string; caseSensitive: boolean; from: number }
  | { type: 'clear' }
  | { type: 'setActiveIndex'; index: number }
  | { type: 'refresh'; from: number };

export const findReplacePluginKey = new PluginKey<FindReplacePluginState>(
  'umeanFindReplace',
);

const EMPTY_STATE: FindReplacePluginState = {
  query: '',
  caseSensitive: false,
  matches: [],
  activeIndex: -1,
  decorations: DecorationSet.empty,
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 在文本节点内搜集字面量匹配（不跨文本节点）。 */
export function collectFindMatches(
  doc: ProseMirrorNode,
  query: string,
  caseSensitive: boolean,
): FindMatch[] {
  if (!query) {
    return [];
  }

  const flags = caseSensitive ? 'g' : 'gi';
  const pattern = new RegExp(escapeRegExp(query), flags);
  const matches: FindMatch[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) {
      return;
    }

    pattern.lastIndex = 0;
    let match = pattern.exec(node.text);
    while (match) {
      const text = match[0];
      if (!text) {
        break;
      }
      const from = pos + match.index;
      matches.push({ from, to: from + text.length });
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex += 1;
      }
      match = pattern.exec(node.text);
    }
  });

  return matches;
}

function buildDecorations(
  doc: ProseMirrorNode,
  matches: FindMatch[],
  activeIndex: number,
  matchClass: string,
  currentMatchClass: string,
): DecorationSet {
  if (matches.length === 0) {
    return DecorationSet.empty;
  }

  const decorations = matches.map((match, index) =>
    Decoration.inline(match.from, match.to, {
      class: index === activeIndex ? currentMatchClass : matchClass,
    }),
  );

  return DecorationSet.create(doc, decorations);
}

function resolveActiveIndex(
  matches: FindMatch[],
  from: number,
  preferredIndex?: number,
): number {
  if (matches.length === 0) {
    return -1;
  }

  if (
    preferredIndex !== undefined &&
    preferredIndex >= 0 &&
    preferredIndex < matches.length
  ) {
    return preferredIndex;
  }

  const next = matches.findIndex((match) => match.from >= from);
  return next >= 0 ? next : 0;
}

function createState(
  doc: ProseMirrorNode,
  query: string,
  caseSensitive: boolean,
  from: number,
  matchClass: string,
  currentMatchClass: string,
  preferredIndex?: number,
): FindReplacePluginState {
  const matches = collectFindMatches(doc, query, caseSensitive);
  const activeIndex = resolveActiveIndex(matches, from, preferredIndex);
  return {
    query,
    caseSensitive,
    matches,
    activeIndex,
    decorations: buildDecorations(
      doc,
      matches,
      activeIndex,
      matchClass,
      currentMatchClass,
    ),
  };
}

function selectMatch(tr: Transaction, match: FindMatch | undefined): Transaction {
  if (!match) {
    return tr;
  }
  return tr
    .setSelection(TextSelection.create(tr.doc, match.from, match.to))
    .scrollIntoView();
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    findReplace: {
      /** 设置搜索词并高亮全部匹配 */
      setFindQuery: (
        query: string,
        options?: SetFindQueryOptions,
      ) => ReturnType;
      /** 清除搜索高亮 */
      clearFind: () => ReturnType;
      /** 跳到下一处匹配（循环） */
      findNext: () => ReturnType;
      /** 跳到上一处匹配（循环） */
      findPrevious: () => ReturnType;
      /** 替换当前匹配，并选中下一处 */
      replaceCurrent: (replacement: string) => ReturnType;
      /** 替换全部匹配 */
      replaceAll: (replacement: string) => ReturnType;
    };
  }
}

export function getFindReplaceState(
  editor: Editor,
): FindReplacePluginState | undefined {
  return findReplacePluginKey.getState(editor.state);
}

export const FindReplace = Extension.create<FindReplaceOptions>({
  name: 'umeanFindReplace',

  addOptions() {
    return {
      matchClass: 'umean-find-match',
      currentMatchClass: 'umean-find-match is-current',
    };
  },

  addCommands() {
    return {
      setFindQuery:
        (query, options) =>
        ({ state, dispatch, view }) => {
          const caseSensitive = options?.caseSensitive ?? false;
          const select = options?.select !== false;
          const focus = options?.focus ?? select;
          const from = state.selection.from;
          const next = createState(
            state.doc,
            query,
            caseSensitive,
            from,
            this.options.matchClass ?? 'umean-find-match',
            this.options.currentMatchClass ?? 'umean-find-match is-current',
          );

          if (!dispatch) {
            return true;
          }

          let tr = state.tr.setMeta(findReplacePluginKey, {
            type: 'setQuery',
            query,
            caseSensitive,
            from,
          } satisfies FindReplaceMeta);

          if (select && next.activeIndex >= 0) {
            tr = selectMatch(tr, next.matches[next.activeIndex]);
          }

          dispatch(tr);
          if (focus) {
            view.focus();
          }
          return true;
        },

      clearFind:
        () =>
        ({ state, dispatch }) => {
          const current = findReplacePluginKey.getState(state);
          if (!current?.query && current?.matches.length === 0) {
            return true;
          }
          if (dispatch) {
            dispatch(
              state.tr.setMeta(findReplacePluginKey, {
                type: 'clear',
              } satisfies FindReplaceMeta),
            );
          }
          return true;
        },

      findNext:
        () =>
        ({ state, dispatch, view }) => {
          const current = findReplacePluginKey.getState(state);
          if (!current?.query || current.matches.length === 0) {
            return false;
          }

          const active =
            current.activeIndex < 0 ? 0 : current.activeIndex;
          const activeMatch = current.matches[active];
          const onActive =
            !!activeMatch &&
            state.selection.from === activeMatch.from &&
            state.selection.to === activeMatch.to;
          const index = onActive
            ? (active + 1) % current.matches.length
            : active;

          if (!dispatch) {
            return true;
          }

          let tr = state.tr.setMeta(findReplacePluginKey, {
            type: 'setActiveIndex',
            index,
          } satisfies FindReplaceMeta);
          tr = selectMatch(tr, current.matches[index]);
          dispatch(tr);
          view.focus();
          return true;
        },

      findPrevious:
        () =>
        ({ state, dispatch, view }) => {
          const current = findReplacePluginKey.getState(state);
          if (!current?.query || current.matches.length === 0) {
            return false;
          }

          const active =
            current.activeIndex < 0
              ? current.matches.length - 1
              : current.activeIndex;
          const activeMatch = current.matches[active];
          const onActive =
            !!activeMatch &&
            state.selection.from === activeMatch.from &&
            state.selection.to === activeMatch.to;
          const index = onActive
            ? (active - 1 + current.matches.length) % current.matches.length
            : active;

          if (!dispatch) {
            return true;
          }

          let tr = state.tr.setMeta(findReplacePluginKey, {
            type: 'setActiveIndex',
            index,
          } satisfies FindReplaceMeta);
          tr = selectMatch(tr, current.matches[index]);
          dispatch(tr);
          view.focus();
          return true;
        },

      replaceCurrent:
        (replacement) =>
        ({ state, dispatch, view }) => {
          const current = findReplacePluginKey.getState(state);
          if (
            !current?.query ||
            current.matches.length === 0 ||
            current.activeIndex < 0
          ) {
            return false;
          }

          const match = current.matches[current.activeIndex];
          if (!match) {
            return false;
          }

          if (!dispatch) {
            return true;
          }

          let tr = state.tr.insertText(replacement, match.from, match.to);
          const from = match.from + replacement.length;
          const nextMatches = collectFindMatches(
            tr.doc,
            current.query,
            current.caseSensitive,
          );
          const nextIndex = resolveActiveIndex(nextMatches, from);
          tr = tr.setMeta(findReplacePluginKey, {
            type: 'refresh',
            from,
          } satisfies FindReplaceMeta);
          if (nextIndex >= 0) {
            tr = selectMatch(tr, nextMatches[nextIndex]);
          }
          dispatch(tr);
          view.focus();
          return true;
        },

      replaceAll:
        (replacement) =>
        ({ state, dispatch, view }) => {
          const current = findReplacePluginKey.getState(state);
          if (!current?.query || current.matches.length === 0) {
            return false;
          }

          if (!dispatch) {
            return true;
          }

          let tr = state.tr;
          // 从后往前替换，避免位置偏移
          for (let i = current.matches.length - 1; i >= 0; i -= 1) {
            const match = current.matches[i];
            tr = tr.insertText(replacement, match.from, match.to);
          }

          tr = tr.setMeta(findReplacePluginKey, {
            type: 'refresh',
            from: state.selection.from,
          } satisfies FindReplaceMeta);

          dispatch(tr);
          view.focus();
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const matchClass = this.options.matchClass ?? 'umean-find-match';
    const currentMatchClass =
      this.options.currentMatchClass ?? 'umean-find-match is-current';

    return [
      new Plugin<FindReplacePluginState>({
        key: findReplacePluginKey,
        state: {
          init: () => ({ ...EMPTY_STATE }),
          apply(tr, value) {
            const meta = tr.getMeta(findReplacePluginKey) as
              | FindReplaceMeta
              | undefined;

            if (meta?.type === 'clear') {
              return { ...EMPTY_STATE };
            }

            if (meta?.type === 'setQuery') {
              return createState(
                tr.doc,
                meta.query,
                meta.caseSensitive,
                meta.from,
                matchClass,
                currentMatchClass,
              );
            }

            if (meta?.type === 'setActiveIndex') {
              if (value.matches.length === 0) {
                return value;
              }
              const index = Math.max(
                0,
                Math.min(meta.index, value.matches.length - 1),
              );
              return {
                ...value,
                activeIndex: index,
                decorations: buildDecorations(
                  tr.doc,
                  value.matches,
                  index,
                  matchClass,
                  currentMatchClass,
                ),
              };
            }

            if (meta?.type === 'refresh' || (tr.docChanged && value.query)) {
              const from =
                meta?.type === 'refresh' ? meta.from : tr.selection.from;
              return createState(
                tr.doc,
                value.query,
                value.caseSensitive,
                from,
                matchClass,
                currentMatchClass,
              );
            }

            if (tr.docChanged && value.decorations !== DecorationSet.empty) {
              return {
                ...value,
                decorations: value.decorations.map(tr.mapping, tr.doc),
              };
            }

            return value;
          },
        },
        props: {
          decorations(state) {
            return findReplacePluginKey.getState(state)?.decorations;
          },
        },
      }),
    ];
  },
});
