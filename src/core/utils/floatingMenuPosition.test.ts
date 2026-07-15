import { describe, it, expect } from 'vitest';

import { computeFloatingMenuPosition } from './floatingMenuPosition';

describe('computeFloatingMenuPosition', () => {
  it('opens below when there is enough space', () => {
    const pos = computeFloatingMenuPosition({
      anchor: { top: 40, bottom: 56, left: 20 },
      menu: { width: 220, height: 200 },
      viewport: { width: 800, height: 600 },
    });
    expect(pos.preferAbove).toBe(false);
    expect(pos.top).toBe(62);
  });

  it('flips above when near viewport bottom', () => {
    const pos = computeFloatingMenuPosition({
      anchor: { top: 150, bottom: 170, left: 20 },
      menu: { width: 180, height: 160 },
      viewport: { width: 800, height: 180 },
    });
    expect(pos.preferAbove).toBe(true);
    expect(pos.top).toBeLessThan(150);
  });
});
