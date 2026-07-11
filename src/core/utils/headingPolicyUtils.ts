import type { Node as ProseMirrorNode, Schema } from '@tiptap/pm/model';
import type { Transaction } from '@tiptap/pm/state';

import type { HeadingPolicyMode } from '../types';

export interface ApplyHeadingPolicyOptions {
  mode: HeadingPolicyMode;
}

function demoteHeadingToLevel2(
  tr: Transaction,
  pos: number,
  node: ProseMirrorNode,
): Transaction {
  return tr.setNodeMarkup(pos, undefined, { ...node.attrs, level: 2 });
}

function createTitleHeading(schema: Schema): ProseMirrorNode {
  return schema.nodes.heading.create({ level: 1 });
}

function createEmptyParagraph(schema: Schema): ProseMirrorNode {
  return schema.nodes.paragraph.create();
}

export function applyHeadingPolicy(
  tr: Transaction,
  doc: ProseMirrorNode,
  schema: Schema,
  options: ApplyHeadingPolicyOptions,
): { tr: Transaction; changed: boolean } {
  const { mode } = options;

  if (mode === 'free') {
    return { tr, changed: false };
  }

  let changed = false;
  let nextTr = tr;

  if (mode === 'chunk') {
    const demotePositions: number[] = [];
    doc.forEach((node, offset) => {
      if (node.type.name === 'heading' && node.attrs.level === 1) {
        demotePositions.push(offset);
      }
    });

    for (let index = demotePositions.length - 1; index >= 0; index -= 1) {
      const pos = demotePositions[index];
      const node = nextTr.doc.nodeAt(pos);
      if (node) {
        nextTr = demoteHeadingToLevel2(nextTr, pos, node);
        changed = true;
      }
    }

    return { tr: nextTr, changed };
  }

  // document mode
  const first = doc.firstChild;

  if (!first) {
    const title = createTitleHeading(schema);
    const paragraph = createEmptyParagraph(schema);
    nextTr = nextTr.insert(0, [title, paragraph]);
    return { tr: nextTr, changed: true };
  }

  if (first.type.name === 'heading') {
    if (first.attrs.level !== 1) {
      nextTr = nextTr.setNodeMarkup(0, undefined, { ...first.attrs, level: 1 });
      changed = true;
    }
  } else if (first.type.name === 'paragraph') {
    nextTr = nextTr.setNodeMarkup(0, schema.nodes.heading, { level: 1 });
    changed = true;
  } else {
    const title = createTitleHeading(schema);
    nextTr = nextTr.insert(0, title);
    changed = true;
  }

  const docAfterTitle = changed ? nextTr.doc : doc;
  const demotePositions: number[] = [];
  docAfterTitle.forEach((node, offset, index) => {
    if (index > 0 && node.type.name === 'heading' && node.attrs.level === 1) {
      demotePositions.push(offset);
    }
  });

  for (let index = demotePositions.length - 1; index >= 0; index -= 1) {
    const pos = demotePositions[index];
    const node = nextTr.doc.nodeAt(pos);
    if (node) {
      nextTr = demoteHeadingToLevel2(nextTr, pos, node);
      changed = true;
    }
  }

  return { tr: nextTr, changed };
}

export function createDocumentDoc(): {
  type: 'doc';
  content: Array<Record<string, unknown>>;
} {
  return {
    type: 'doc',
    content: [{ type: 'heading', attrs: { level: 1 } }, { type: 'paragraph' }],
  };
}

export function createEmptyParagraphDoc(): {
  type: 'doc';
  content: Array<Record<string, unknown>>;
} {
  return {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  };
}

export function isEmptyDocContent(doc: ProseMirrorNode): boolean {
  return doc.childCount === 0;
}
