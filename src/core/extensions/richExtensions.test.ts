import { describe, it, expect } from 'vitest';
import { createRichExtensions } from './richExtensions';

describe('createRichExtensions', () => {
  it('includes math extensions by default', () => {
    const exts = createRichExtensions();
    const names = exts.map((e: any) => e.name);
    expect(names).toContain('inlineMath');
    expect(names).toContain('blockMath');
    expect(names).toContain('inlineMathUnwrap');
  });

  it('includes MermaidCodeBlock by default', () => {
    const exts = createRichExtensions();
    const names = exts.map((e: any) => e.name);
    expect(names).toContain('mermaidCodeBlock');
  });

  it('excludes math when math: false', () => {
    const exts = createRichExtensions({ math: false });
    const names = exts.map((e: any) => e.name);
    expect(names).not.toContain('inlineMath');
    expect(names).not.toContain('blockMath');
    expect(names).not.toContain('inlineMathUnwrap');
  });

  it('excludes MermaidCodeBlock when mermaid: false', () => {
    const exts = createRichExtensions({ mermaid: false });
    const names = exts.map((e: any) => e.name);
    expect(names).not.toContain('mermaidCodeBlock');
  });

  it('excludes MermaidCodeBlock when mermaid: { enabled: false }', () => {
    const exts = createRichExtensions({ mermaid: { enabled: false } });
    const names = exts.map((e: any) => e.name);
    expect(names).not.toContain('mermaidCodeBlock');
  });

  it('configures block math with katexOptions', () => {
    const exts = createRichExtensions({
      math: { katexOptions: { throwOnError: true } },
    });
    const blockMath = exts.find((e: any) => e.name === 'blockMath') as any;
    expect(blockMath).toBeDefined();
    expect(blockMath.options?.katexOptions?.throwOnError).toBe(true);
  });

  it('configures MermaidCodeBlock with enabled', () => {
    const exts = createRichExtensions({ mermaid: { enabled: true } });
    const mermaid = exts.find((e: any) => e.name === 'mermaidCodeBlock') as any;
    expect(mermaid).toBeDefined();
    expect(mermaid.options?.enabled).toBe(true);
  });

  it('still includes image, taskList, table, codeBlock', () => {
    const exts = createRichExtensions();
    const names = exts.map((e: any) => e.name);
    expect(names).toContain('image');
    expect(names).toContain('taskList');
    expect(names).toContain('taskItem');
    expect(names).toContain('table');
    expect(names).toContain('codeBlock');
  });
});
