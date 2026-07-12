import { describe, it, expect } from 'vitest';
import { parseAlignSuffix } from './tableUtils';

describe('parseAlignSuffix', () => {
  it('returns center for "c"', () => {
    expect(parseAlignSuffix('c')).toBe('center');
  });

  it('returns left for "l"', () => {
    expect(parseAlignSuffix('l')).toBe('left');
  });

  it('returns right for "r"', () => {
    expect(parseAlignSuffix('r')).toBe('right');
  });

  it('returns null for undefined', () => {
    expect(parseAlignSuffix()).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseAlignSuffix('')).toBeNull();
  });

  it('returns null for invalid suffix', () => {
    expect(parseAlignSuffix('x')).toBeNull();
  });

  it('returns null for numeric suffix', () => {
    expect(parseAlignSuffix('3')).toBeNull();
  });

  it('returns null for multi-char suffix', () => {
    expect(parseAlignSuffix('left')).toBeNull();
  });
});
