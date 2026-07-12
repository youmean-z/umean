import { describe, it, expect, vi } from 'vitest';

// Mock @10play/tentap-editor to avoid react-native Flow syntax parsing issue.
// BridgeExtension class is needed because codeBlockBridge and tableBridge import it.
vi.mock('@10play/tentap-editor', () => {
  class BridgeExtension {
    forceName: string;
    tiptapExtension: any;
    [key: string]: any;

    constructor(opts: Record<string, any>) {
      Object.assign(this, opts);
      this.forceName = opts.forceName ?? opts.name;
    }

    configureExtension(config: any): BridgeExtension {
      return new BridgeExtension({ ...this, ...config });
    }
  }

  const PlaceholderBridge = new BridgeExtension({
    name: 'placeholder',
    tiptapExtension: { name: 'placeholder' },
  });

  const HeadingBridge = new BridgeExtension({
    name: 'heading',
    tiptapExtension: { name: 'heading' },
  });

  const TenTapStartKit = [
    PlaceholderBridge,
    HeadingBridge,
    new BridgeExtension({ name: 'bold', tiptapExtension: { name: 'bold' } }),
    new BridgeExtension({ name: 'italic', tiptapExtension: { name: 'italic' } }),
    new BridgeExtension({ name: 'bulletList', tiptapExtension: { name: 'bulletList' } }),
    new BridgeExtension({ name: 'history', tiptapExtension: { name: 'history' } }),
  ];

  return {
    BridgeExtension,
    TenTapStartKit,
    PlaceholderBridge,
    HeadingBridge,
  };
});

import {
  PlaceholderBridge,
} from '@10play/tentap-editor';
import { createTenTapBridges } from './createTenTapBridges';

describe('createTenTapBridges', () => {
  it('returns an array of bridges', () => {
    const bridges = createTenTapBridges();
    expect(Array.isArray(bridges)).toBe(true);
    expect(bridges.length).toBeGreaterThan(0);
  });

  it('includes our custom bridges at the end', () => {
    const bridges = createTenTapBridges();
    const lastTwo = bridges.slice(-2);
    const names = lastTwo.map((b: any) => b.forceName);
    expect(names).toContain('codeBlockBridge');
    expect(names).toContain('tableBridge');
  });

  it('headingPolicy: false keeps PlaceholderBridge', () => {
    const defaultBridges = createTenTapBridges();
    const noPolicyBridges = createTenTapBridges({ headingPolicy: false });
    expect(noPolicyBridges.length).toBe(defaultBridges.length + 1);
  });

  it('chunk mode produces bridges without crashing', () => {
    const bridges = createTenTapBridges({ headingPolicy: { mode: 'chunk' } });
    expect(bridges.length).toBeGreaterThan(0);
  });

  it('free mode (default) filters out PlaceholderBridge', () => {
    const bridges = createTenTapBridges();
    expect(bridges).not.toContain(PlaceholderBridge);
  });
});
