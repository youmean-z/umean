import { describe, it, expect } from 'vitest';

import {
  createDefaultExtensions,
  createTenTapSupplementalExtensions,
} from './defaultExtensions';

describe('createTenTapSupplementalExtensions', () => {
  it('does not register the block drag handle by default', () => {
    const names = createTenTapSupplementalExtensions().map((e) => e.name);
    expect(names).not.toContain('umeanBlockDragHandle');
  });

  it('registers the handle when explicitly configured', () => {
    const names = createTenTapSupplementalExtensions({
      blockDragHandle: {},
    }).map((e) => e.name);
    expect(names).toContain('umeanBlockDragHandle');
  });

  it('does not register the handle when set to false', () => {
    const names = createTenTapSupplementalExtensions({
      blockDragHandle: false,
    }).map((e) => e.name);
    expect(names).not.toContain('umeanBlockDragHandle');
  });

  it('registers linkExit so typing after a link is plain text', () => {
    expect(createTenTapSupplementalExtensions().map((e) => e.name)).toContain(
      'linkExit',
    );
  });

  it('registers trailingParagraph so a block image is never the last node', () => {
    expect(createTenTapSupplementalExtensions().map((e) => e.name)).toContain(
      'trailingParagraph',
    );
  });
});

describe('createDefaultExtensions', () => {
  it('still registers the block drag handle by default on Web', () => {
    expect(createDefaultExtensions().map((e) => e.name)).toContain(
      'umeanBlockDragHandle',
    );
  });
});
