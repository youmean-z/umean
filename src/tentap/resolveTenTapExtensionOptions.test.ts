import { describe, it, expect } from 'vitest';

import { UMEAN_CONFIG_BRIDGE_NAME } from './umeanConfigName';
import { resolveTenTapExtensionOptions } from './resolveTenTapExtensionOptions';

describe('resolveTenTapExtensionOptions', () => {
  it('defaults to free when nothing is provided', () => {
    expect(resolveTenTapExtensionOptions()).toEqual({
      headingPolicy: { mode: 'free' },
      codeBlockLanguages: undefined,
    });
  });

  it('reads headingPolicy and codeBlockLanguages from bridge config map', () => {
    const map = JSON.stringify({
      [UMEAN_CONFIG_BRIDGE_NAME]: {
        optionsConfig: {
          headingPolicy: {
            mode: 'document',
            placeholderTitle: '标题',
          },
          codeBlockLanguages: ['js', 'python'],
        },
      },
    });

    expect(
      resolveTenTapExtensionOptions({ bridgeExtensionConfigMap: map }),
    ).toEqual({
      headingPolicy: {
        mode: 'document',
        placeholderTitle: '标题',
      },
      codeBlockLanguages: ['js', 'python'],
    });
  });

  it('keeps headingPolicy false from bridge config', () => {
    const map = JSON.stringify({
      [UMEAN_CONFIG_BRIDGE_NAME]: {
        optionsConfig: { headingPolicy: false },
      },
    });

    expect(
      resolveTenTapExtensionOptions({ bridgeExtensionConfigMap: map }),
    ).toEqual({
      headingPolicy: false,
      codeBlockLanguages: undefined,
    });
  });

  it('allows URL ?mode= to override bridge mode (DEV)', () => {
    const map = JSON.stringify({
      [UMEAN_CONFIG_BRIDGE_NAME]: {
        optionsConfig: { headingPolicy: { mode: 'free' } },
      },
    });

    expect(
      resolveTenTapExtensionOptions({
        search: '?mode=chunk',
        bridgeExtensionConfigMap: map,
      }).headingPolicy,
    ).toEqual({ mode: 'chunk' });
  });

  it('uses URL mode when bridge config is missing', () => {
    expect(
      resolveTenTapExtensionOptions({ search: '?mode=document' }),
    ).toEqual({
      headingPolicy: { mode: 'document' },
      codeBlockLanguages: undefined,
    });
  });
});
