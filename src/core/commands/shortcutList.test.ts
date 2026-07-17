import { describe, it, expect } from 'vitest';

import { DEFAULT_SHORTCUT_BINDINGS } from './defaultShortcuts';
import { getShortcutList } from './shortcutList';

describe('getShortcutList', () => {
  it('exports default bindings with i18n labels', () => {
    const list = getShortcutList();
    expect(list.length).toBe(Object.keys(DEFAULT_SHORTCUT_BINDINGS).length);
    expect(list.find((i) => i.keys === 'Mod-b')).toEqual({
      keys: 'Mod-b',
      action: 'toggleBold',
      label: '加粗',
      disabled: false,
      custom: false,
    });
  });

  it('uses English labels when locale is en', () => {
    const list = getShortcutList({}, { locale: 'en' });
    expect(list.find((i) => i.keys === 'Mod-b')?.label).toBe('Bold');
  });

  it('marks disabled and custom bindings', () => {
    const list = getShortcutList({
      bindings: {
        'Mod-b': false,
        'Mod-k': () => true,
      },
    });
    expect(list.find((i) => i.keys === 'Mod-b')).toMatchObject({
      disabled: true,
      action: null,
      label: '已禁用',
    });
    expect(list.find((i) => i.keys === 'Mod-k')).toMatchObject({
      custom: true,
      action: null,
      label: '自定义',
    });
  });

  it('returns empty when shortcuts disabled', () => {
    expect(getShortcutList(false)).toEqual([]);
  });
});
