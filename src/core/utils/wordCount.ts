import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/core';

/** 提取节点纯文本（块之间用换行分隔）。 */
export function getNodePlainText(doc: ProseMirrorNode): string {
  return doc.textBetween(0, doc.content.size, '\n', '\n');
}

/**
 * 字数：拉丁词按空白/标点分词；每个 CJK 字符计 1 词。
 * 适合中英混合笔记。
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  const cjkMatches = trimmed.match(/[\u3400-\u9fff\uf900-\ufaff]+/g);
  const cjkCount = cjkMatches
    ? cjkMatches.reduce((sum, part) => sum + part.length, 0)
    : 0;

  const latin = trimmed
    .replace(/[\u3400-\u9fff\uf900-\ufaff]+/g, ' ')
    .match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g);

  return cjkCount + (latin?.length ?? 0);
}

/** 字符数（默认含空白与换行；excludeWhitespace 时去掉所有空白）。 */
export function countChars(
  text: string,
  options: { excludeWhitespace?: boolean } = {},
): number {
  if (options.excludeWhitespace) {
    return text.replace(/\s/g, '').length;
  }
  return text.length;
}

export function getWordCount(editor: Editor): number {
  return countWords(getNodePlainText(editor.state.doc));
}

export function getCharCount(
  editor: Editor,
  options: { excludeWhitespace?: boolean } = {},
): number {
  return countChars(getNodePlainText(editor.state.doc), options);
}

export function getSelectedWordCount(editor: Editor): number {
  const { from, to, empty } = editor.state.selection;
  if (empty) {
    return 0;
  }
  const text = editor.state.doc.textBetween(from, to, '\n', '\n');
  return countWords(text);
}

export function getSelectedCharCount(
  editor: Editor,
  options: { excludeWhitespace?: boolean } = {},
): number {
  const { from, to, empty } = editor.state.selection;
  if (empty) {
    return 0;
  }
  const text = editor.state.doc.textBetween(from, to, '\n', '\n');
  return countChars(text, options);
}
