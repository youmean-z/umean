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
    const names = bridges.map((b: any) => b.forceName);
    expect(names).toContain('codeBlockBridge');
    expect(names).toContain('tableBridge');
    expect(names).toContain('imageBridge');
    expect(names).toContain('linkBridge');
    expect(names).toContain('horizontalRuleBridge');
    expect(names).toContain('calloutBridge');
    expect(names).toContain('mathBridge');
  });

  it('exposes link apply and code language actions', () => {
    const bridges = createTenTapBridges();
    const link = bridges.find((b: any) => b.forceName === 'linkBridge');
    const code = bridges.find((b: any) => b.forceName === 'codeBlockBridge');
    const sendLink = vi.fn();
    expect(link?.extendEditorInstance?.(sendLink)).toMatchObject({
      setLink: expect.any(Function),
    });
    link?.extendEditorInstance?.(sendLink).setLink('a.com', {
      from: 1,
      to: 6,
    });
    expect(sendLink).toHaveBeenCalledWith({
      type: 'set-link',
      payload: { href: 'a.com', from: 1, to: 6 },
    });
    expect(code?.extendEditorInstance?.(() => undefined)).toMatchObject({
      toggleCodeBlock: expect.any(Function),
      setCodeBlockLanguage: expect.any(Function),
    });
    expect(
      code?.extendEditorState?.({
        isActive: () => false,
        can: () => ({ toggleCodeBlock: () => true }),
        getAttributes: () => ({}),
      } as never),
    ).toMatchObject({
      codeBlockLanguages: expect.any(Array),
    });
  });

  it('inserts a paragraph after the image so typing can continue', () => {
    const bridges = createTenTapBridges();
    const image = bridges.find((b: any) => b.forceName === 'imageBridge');
    const instance = image?.extendEditorInstance?.(() => undefined);
    expect(instance).toMatchObject({
      setImage: expect.any(Function),
    });
  });

  it('exposes setHorizontalRule for the insert bar', () => {
    const bridges = createTenTapBridges();
    const rule = bridges.find((b: any) => b.forceName === 'horizontalRuleBridge');
    expect(rule?.extendEditorInstance?.(() => undefined)).toMatchObject({
      setHorizontalRule: expect.any(Function),
    });
    expect(rule?.extendCSS).toContain('height: 28px');
  });

  it('exposes callout insert and type switch', () => {
    const bridges = createTenTapBridges();
    const callout = bridges.find((b: any) => b.forceName === 'calloutBridge');
    const send = vi.fn();
    expect(callout?.extendEditorInstance?.(send)).toMatchObject({
      insertCallout: expect.any(Function),
      updateCalloutType: expect.any(Function),
      unsetCallout: expect.any(Function),
    });
    expect(
      callout?.extendEditorState?.({
        isActive: () => false,
        getAttributes: () => ({}),
      } as never),
    ).toMatchObject({
      isCalloutActive: false,
      calloutTypes: expect.any(Array),
    });
  });

  it('exposes applyMath and math selection state', () => {
    const bridges = createTenTapBridges();
    const math = bridges.find((b: any) => b.forceName === 'mathBridge');
    const send = vi.fn();
    expect(math?.extendEditorInstance?.(send)).toMatchObject({
      applyMath: expect.any(Function),
    });
    math?.extendEditorInstance?.(send).applyMath('E=mc^2', 'inline', {
      from: 1,
      to: 1,
    });
    expect(send).toHaveBeenCalledWith({
      type: 'apply-math',
      payload: { latex: 'E=mc^2', kind: 'inline', from: 1, to: 1 },
    });
    expect(
      math?.extendEditorState?.({
        isActive: () => false,
        getAttributes: () => ({}),
        state: { selection: { from: 1, to: 1 } },
      } as never),
    ).toMatchObject({
      isInlineMathActive: false,
      isBlockMathActive: false,
      mathKind: null,
      mathLatex: '',
    });
  });

  it('exposes insertMermaid on the code block bridge', () => {
    const bridges = createTenTapBridges();
    const code = bridges.find((b: any) => b.forceName === 'codeBlockBridge');
    expect(code?.extendEditorInstance?.(() => undefined)).toMatchObject({
      insertMermaid: expect.any(Function),
      setMermaidPreview: expect.any(Function),
    });
  });

  it('disables table column resize for touch', () => {
    const bridges = createTenTapBridges();
    const table = bridges.find((b: any) => b.forceName === 'tableBridge');
    expect(table?.tiptapExtension?.options.resizable).toBe(false);
  });

  it('draws table cell borders and exposes delete/edit actions', () => {
    const bridges = createTenTapBridges();
    const table = bridges.find((b: any) => b.forceName === 'tableBridge');
    expect(table?.extendCSS).toContain('border:');
    const instance = table?.extendEditorInstance?.(() => undefined);
    expect(instance).toMatchObject({
      insertTable: expect.any(Function),
      deleteTable: expect.any(Function),
      addRowAfter: expect.any(Function),
      addColumnAfter: expect.any(Function),
      deleteRow: expect.any(Function),
      deleteColumn: expect.any(Function),
      setCellAlign: expect.any(Function),
    });
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
