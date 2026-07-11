import type { Transaction } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { ResolvedPos } from '@tiptap/pm/model';

export type TableAlign = 'left' | 'center' | 'right';

const ALIGN_SUFFIX_MAP: Record<string, TableAlign> = {
  c: 'center',
  l: 'left',
  r: 'right',
};

export function parseAlignSuffix(suffix?: string): TableAlign | null {
  if (!suffix) {
    return null;
  }

  return ALIGN_SUFFIX_MAP[suffix] ?? null;
}

export function applyAlignToTable(
  tr: Transaction,
  tablePos: number,
  align: TableAlign,
): void {
  const table = tr.doc.nodeAt(tablePos);
  if (!table || table.type.name !== 'table') {
    return;
  }

  table.descendants((node, relativePos) => {
    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      tr.setNodeMarkup(tablePos + 1 + relativePos, undefined, {
        ...node.attrs,
        align,
      });
    }
  });
}

export function findCellAtPos(
  $pos: ResolvedPos,
): { pos: number; node: ProseMirrorNode } | null {
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      return { pos: $pos.before(depth), node };
    }
  }

  return null;
}
