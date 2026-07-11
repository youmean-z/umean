import { Extension, InputRule } from '@tiptap/core';

import { findCellAtPos, parseAlignSuffix } from '../utils/tableUtils';

/**
 * 表格单元格内：/ac /al /ar + 空格 → 设置当前格对齐（居中/左/右）。
 */
const CELL_ALIGN_REGEX = /^\/a(c|l|r)\s$/;

export const TableAlignShortcut = Extension.create({
  name: 'tableAlignShortcut',
  priority: 1000,

  addInputRules() {
    return [
      new InputRule({
        find: CELL_ALIGN_REGEX,
        handler: ({ state, range, match }) => {
          const cell = findCellAtPos(state.selection.$from);
          if (!cell) {
            return;
          }

          const align = parseAlignSuffix(match[1]);
          if (!align) {
            return;
          }

          const { tr } = state;
          tr.delete(range.from, range.to);

          const cellAfterDelete = findCellAtPos(tr.selection.$from);
          if (!cellAfterDelete) {
            return;
          }

          tr.setNodeMarkup(cellAfterDelete.pos, undefined, {
            ...cellAfterDelete.node.attrs,
            align,
          });
        },
      }),
    ];
  },
});
