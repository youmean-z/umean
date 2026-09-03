import { BridgeExtension } from '@10play/tentap-editor';
import type { Editor } from '@tiptap/core';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';

import { normalizeTableAlign, type TableAlign } from '../../core/utils/tableUtils';

export enum TableEditorActionType {
  InsertTable = 'insert-table',
  DeleteTable = 'delete-table',
  AddRowAfter = 'add-row-after',
  AddColumnAfter = 'add-column-after',
  DeleteRow = 'delete-row',
  DeleteColumn = 'delete-column',
  SetCellAlign = 'set-cell-align',
}

type TableBridgeMessage =
  | { type: Exclude<TableEditorActionType, TableEditorActionType.SetCellAlign> }
  | { type: TableEditorActionType.SetCellAlign; payload: TableAlign };

/** WebView 内最小功能性样式，主题样式请使用 umean/styles/*.css */
const tableBridgeCSS = `
  table {
    border-collapse: collapse;
    width: 100%;
    table-layout: fixed;
    margin: 0.75rem 0;
  }

  th,
  td {
    border: 1px solid #cbd5e1;
    padding: 0.4rem 0.5rem;
    vertical-align: top;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  th {
    background: #f8fafc;
    font-weight: 600;
  }
`;

function readCellAlign(editor: Editor): TableAlign | null {
  if (editor.isActive('tableHeader')) {
    return normalizeTableAlign(editor.getAttributes('tableHeader').align);
  }

  if (editor.isActive('tableCell')) {
    return normalizeTableAlign(editor.getAttributes('tableCell').align);
  }

  return null;
}

export const TableBridge = new BridgeExtension({
  forceName: 'tableBridge',
  tiptapExtension: Table.configure({ resizable: false }),
  tiptapExtensionDeps: [TableRow, TableHeader, TableCell],
  onBridgeMessage: (editor: Editor, message: TableBridgeMessage) => {
    switch (message.type) {
      case TableEditorActionType.InsertTable:
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
        break;
      case TableEditorActionType.DeleteTable:
        editor.chain().focus().deleteTable().run();
        break;
      case TableEditorActionType.AddRowAfter:
        editor.chain().focus().addRowAfter().run();
        break;
      case TableEditorActionType.AddColumnAfter:
        editor.chain().focus().addColumnAfter().run();
        break;
      case TableEditorActionType.DeleteRow:
        editor.chain().focus().deleteRow().run();
        break;
      case TableEditorActionType.DeleteColumn:
        editor.chain().focus().deleteColumn().run();
        break;
      case TableEditorActionType.SetCellAlign:
        editor.chain().focus().setCellAttribute('align', message.payload).run();
        break;
      default:
        break;
    }

    return false;
  },
  extendEditorInstance: (
    sendBridgeMessage: (message: TableBridgeMessage) => void,
  ) => ({
    insertTable: () =>
      sendBridgeMessage({ type: TableEditorActionType.InsertTable }),
    deleteTable: () =>
      sendBridgeMessage({ type: TableEditorActionType.DeleteTable }),
    addRowAfter: () =>
      sendBridgeMessage({ type: TableEditorActionType.AddRowAfter }),
    addColumnAfter: () =>
      sendBridgeMessage({ type: TableEditorActionType.AddColumnAfter }),
    deleteRow: () =>
      sendBridgeMessage({ type: TableEditorActionType.DeleteRow }),
    deleteColumn: () =>
      sendBridgeMessage({ type: TableEditorActionType.DeleteColumn }),
    setCellAlign: (align: TableAlign) =>
      sendBridgeMessage({
        type: TableEditorActionType.SetCellAlign,
        payload: align,
      }),
  }),
  extendEditorState: (editor: Editor) => ({
    canInsertTable: editor.can().insertTable(),
    isTableActive: editor.isActive('table'),
    canDeleteTable: editor.can().deleteTable(),
    canAddRowAfter: editor.can().addRowAfter(),
    canAddColumnAfter: editor.can().addColumnAfter(),
    canDeleteRow: editor.can().deleteRow(),
    canDeleteColumn: editor.can().deleteColumn(),
    canSetCellAlign: editor.can().setCellAttribute('align', 'left'),
    cellAlign: readCellAlign(editor),
  }),
  extendCSS: tableBridgeCSS,
});
