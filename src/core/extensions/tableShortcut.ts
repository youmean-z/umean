import { Extension, InputRule } from '@tiptap/core';
import { createTable } from '@tiptap/extension-table';
import { TextSelection } from '@tiptap/pm/state';

import {
  applyAlignToTable,
  parseAlignSuffix,
  type TableAlign,
} from '../utils/tableUtils';

/**
 * 段落内输入 /t3x4 + 空格 → 插入表格（前列后行）。
 * 可选后缀 c/l/r：/t3x4c=3列4行且全表居中，/t3x4l=左对齐，/t3x4r=右对齐。
 */
const TABLE_SHORTCUT_REGEX = /\/t(\d+)?(?:x(\d+))?(c|l|r)?\s$/;

const DEFAULT_SIZE = 3;
const MAX_SIZE = 20;

function clampSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SIZE;
  }

  return Math.min(MAX_SIZE, Math.max(1, Math.round(value)));
}

function parseTableSize(match: RegExpMatchArray): {
  rows: number;
  cols: number;
  align: TableAlign | null;
} {
  const cols = clampSize(parseInt(match[1] ?? String(DEFAULT_SIZE), 10));
  const rows = clampSize(parseInt(match[2] ?? String(cols), 10));

  return { rows, cols, align: parseAlignSuffix(match[3]) };
}

export const TableShortcut = Extension.create({
  name: 'tableShortcut',
  priority: 1000,

  addInputRules() {
    return [
      new InputRule({
        find: TABLE_SHORTCUT_REGEX,
        handler: ({ state, range, match }) => {
          const { rows, cols, align } = parseTableSize(match);
          const { tr, schema } = state;
          const $from = tr.doc.resolve(range.from);
          const $to = tr.doc.resolve(range.to);
          const table = createTable(schema, rows, cols, true);

          const blockStart = $from.before();
          const blockEnd = $to.after();
          const block = tr.doc.nodeAt(blockStart);
          const shortcutText = match[0].trim();
          const isOnlyShortcut = block?.textContent.trim() === shortcutText;

          let tablePos: number;

          if (isOnlyShortcut) {
            tr.replaceRangeWith(blockStart, blockEnd, table);
            tablePos = blockStart;
            tr.setSelection(TextSelection.near(tr.doc.resolve(tablePos + 1)));
          } else {
            tr.delete(range.from, range.to);
            tablePos = tr.mapping.map(blockEnd);
            tr.insert(tablePos, table);
            tr.setSelection(TextSelection.near(tr.doc.resolve(tablePos + 1)));
          }

          if (align) {
            applyAlignToTable(tr, tablePos, align);
          }

          tr.scrollIntoView();
        },
      }),
    ];
  },
});
