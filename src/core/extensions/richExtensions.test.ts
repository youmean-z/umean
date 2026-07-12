import { describe, it, expect } from 'vitest';
import { createRichExtensions } from './richExtensions';

describe('createRichExtensions', () => {
  it('includes Mathematics by default', () => {
    const exts = createRichExtensions();
    const names = exts.map((e: any) => e.name);
    expect(names).toContain('Mathematics');
  });

  it('includes MermaidCodeBlock by default', () => {
    const exts = createRichExtensions();
    const names = exts.map((e: any) => e.name);
    expect(names).toContain('mermaidCodeBlock');
  });

  it('excludes Mathematics when math: false', () => {
    const exts = createRichExtensions({ math: false });
    const names = exts.map((e: any) => e.name);
    expect(names).not.toContain('Mathematics');
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

  it('configures Mathematics with katexOptions', () => {
    const exts = createRichExtensions({
      math: { katexOptions: { throwOnError: true } },
    });
    const math = exts.find((e: any) => e.name === 'Mathematics') as any;
    expect(math).toBeDefined();
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
