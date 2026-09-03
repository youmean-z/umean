import { describe, it, expect } from 'vitest';

import { normalizeTableAlign, parseAlignSuffix } from './tableUtils';

describe('normalizeTableAlign', () => {
  it('accepts left / center / right', () => {
    expect(normalizeTableAlign('left')).toBe('left');
    expect(normalizeTableAlign('center')).toBe('center');
    expect(normalizeTableAlign('right')).toBe('right');
  });

  it('rejects unknown values', () => {
    expect(normalizeTableAlign(null)).toBeNull();
    expect(normalizeTableAlign(undefined)).toBeNull();
    expect(normalizeTableAlign('justify')).toBeNull();
  });
});

describe('parseAlignSuffix', () => {
  it('maps c/l/r', () => {
    expect(parseAlignSuffix('c')).toBe('center');
    expect(parseAlignSuffix('l')).toBe('left');
    expect(parseAlignSuffix('r')).toBe('right');
  });

  it('returns null without a suffix', () => {
    expect(parseAlignSuffix()).toBeNull();
    expect(parseAlignSuffix('')).toBeNull();
    expect(parseAlignSuffix('x')).toBeNull();
  });
});
