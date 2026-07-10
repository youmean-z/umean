import { BridgeExtension } from '@10play/tentap-editor';
import type { Editor } from '@tiptap/core';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';

export enum TableEditorActionType {
  InsertTable = 'insert-table',
}

/** WebView 内最小功能性样式，主题样式请使用 umean/styles/*.css */
const tableBridgeCSS = `
  table {
    border-collapse: collapse;
    width: 100%;
  }

  th,
  td {
    vertical-align: top;
  }
`;

export const TableBridge = new BridgeExtension({
  forceName: 'tableBridge',
  tiptapExtension: Table.configure({ resizable: true }),
  tiptapExtensionDeps: [TableRow, TableHeader, TableCell],
  onBridgeMessage: (editor: Editor, message: { type: TableEditorActionType }) => {
    if (message.type === TableEditorActionType.InsertTable) {
      (editor.chain().focus() as unknown as { insertTable: (options: {
        rows: number;
        cols: number;
        withHeaderRow: boolean;
      }) => { run: () => boolean } })
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage: (message: { type: TableEditorActionType }) => void) => ({
    insertTable: () =>
      sendBridgeMessage({ type: TableEditorActionType.InsertTable }),
  }),
  extendEditorState: (editor: Editor) => ({
    canInsertTable: (editor.can() as unknown as { insertTable: () => boolean }).insertTable(),
  }),
  extendCSS: tableBridgeCSS,
} as any);
