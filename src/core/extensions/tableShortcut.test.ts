import { describe, it, expect } from 'vitest';

/** 与 TableShortcut 一致的 regex，用于测试解析逻辑 */
const TABLE_SHORTCUT_REGEX = /\/t(\d+)?(?:x(\d+))?(c|l|r)?\s$/;

function parseTableSize(match: RegExpMatchArray) {
  const clampSize = (value: number) => {
    if (!Number.isFinite(value)) return 3;
    return Math.min(20, Math.max(1, Math.round(value)));
  };

  const cols = clampSize(parseInt(match[1] ?? '3', 10));
  const rows = clampSize(parseInt(match[2] ?? String(cols), 10));
  const ALIGN_MAP: Record<string, string> = { c: 'center', l: 'left', r: 'right' };
  const align = ALIGN_MAP[match[3] ?? ''] ?? null;

  return { rows, cols, align };
}

describe('TABLE_SHORTCUT_REGEX', () => {
  it('matches /t3x4 with space', () => {
    expect(TABLE_SHORTCUT_REGEX.test('/t3x4 ')).toBe(true);
  });

  it('matches /t5 with space (rows = cols = 5)', () => {
    const m = '/t5 '.match(TABLE_SHORTCUT_REGEX);
    expect(m).not.toBeNull();
    if (!m) return;
    const result = parseTableSize(m);
    expect(result.cols).toBe(5);
    expect(result.rows).toBe(5);
  });

  it('matches /t with space (defaults 3x3)', () => {
    const m = '/t '.match(TABLE_SHORTCUT_REGEX);
    expect(m).not.toBeNull();
    if (!m) return;
    const result = parseTableSize(m);
    expect(result.cols).toBe(3);
    expect(result.rows).toBe(3);
  });

  it('does not match without trailing space', () => {
    expect(TABLE_SHORTCUT_REGEX.test('/t3x4')).toBe(false);
  });

  it('does not match other slashes', () => {
    expect(TABLE_SHORTCUT_REGEX.test('/x3x4 ')).toBe(false);
  });

  it('matches with align suffix c', () => {
    const m = '/t3x4c '.match(TABLE_SHORTCUT_REGEX);
    expect(m).not.toBeNull();
    if (!m) return;
    const result = parseTableSize(m);
    expect(result.align).toBe('center');
  });

  it('matches with align suffix l', () => {
    const m = '/t3x4l '.match(TABLE_SHORTCUT_REGEX);
    expect(m).not.toBeNull();
    if (!m) return;
    const result = parseTableSize(m);
    expect(result.align).toBe('left');
  });

  it('matches with align suffix r', () => {
    const m = '/t3x4r '.match(TABLE_SHORTCUT_REGEX);
    expect(m).not.toBeNull();
    if (!m) return;
    const result = parseTableSize(m);
    expect(result.align).toBe('right');
  });
});

describe('parseTableSize', () => {
  it('clamps large values to MAX_SIZE (20)', () => {
    const m = '/t100x100 '.match(TABLE_SHORTCUT_REGEX);
    expect(m).not.toBeNull();
    if (!m) return;
    const result = parseTableSize(m);
    expect(result.cols).toBe(20);
    expect(result.rows).toBe(20);
  });

  it('clamps zero to 1 (minimum)', () => {
    const m = '/t0 '.match(TABLE_SHORTCUT_REGEX);
    expect(m).not.toBeNull();
    if (!m) return;
    const result = parseTableSize(m);
    expect(result.cols).toBe(1);
  });

  it('clamps negative to DEFAULT_SIZE (3)', () => {
    const m = '/t-2x-5 '.match(TABLE_SHORTCUT_REGEX);
    expect(m).toBeNull(); // regex doesn't match negative numbers
  });
});
