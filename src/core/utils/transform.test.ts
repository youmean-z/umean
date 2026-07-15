import { describe, it, expect } from 'vitest';
import { jsonToHTML, jsonToMarkdown, markdownToJSON } from './transform';

describe('jsonToHTML', () => {
  it('converts simple paragraph to HTML', () => {
    const html = jsonToHTML({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
    });
    expect(html).toContain('<p>Hello</p>');
  });

  it('converts heading to HTML', () => {
    const html = jsonToHTML({
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] }],
    });
    expect(html).toContain('<h1>Title</h1>');
  });

  it('handles empty doc', () => {
    const html = jsonToHTML({ type: 'doc', content: [] });
    expect(typeof html).toBe('string');
  });
});

describe('jsonToMarkdown', () => {
  it('converts paragraph to markdown', () => {
    const md = jsonToMarkdown({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
    });
    expect(md).toContain('Hello');
  });

  it('converts heading to markdown', () => {
    const md = jsonToMarkdown({
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] }],
    });
    expect(md).toContain('# Title');
  });

  it('handles empty doc', () => {
    const md = jsonToMarkdown({ type: 'doc', content: [] });
    expect(typeof md).toBe('string');
  });
});

describe('markdownToJSON', () => {
  it('converts markdown to JSON', () => {
    const json = markdownToJSON('# Hello');
    expect(json.type).toBe('doc');
    expect(json.content).toBeDefined();
    expect(json.content!.length).toBeGreaterThan(0);
  });

  it('converts plain text to JSON', () => {
    const json = markdownToJSON('plain text');
    expect(json.type).toBe('doc');
    expect(json.content).toBeDefined();
  });

  it('handles empty markdown', () => {
    const json = markdownToJSON('');
    expect(json.type).toBe('doc');
  });
});

describe('transform round-trips', () => {
  it('json -> markdown -> json preserves structure', () => {
    const original = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Hello World' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Some text here.' }] },
      ],
    };

    const md = jsonToMarkdown(original);
    const json = markdownToJSON(md);

    expect(json.type).toBe('doc');
    expect(json.content).toBeDefined();
    expect(json.content!.length).toBeGreaterThanOrEqual(1);
  });

  it('json -> html preserves text content', () => {
    const original = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] },
      ],
    };

    const html = jsonToHTML(original);
    expect(html).toContain('Hello World');
  });

  it('markdown links round-trip to JSON with link mark', () => {
    const json = markdownToJSON('见 [文档](https://example.com/docs)');
    const paragraph = json.content?.find((node) => node.type === 'paragraph');
    const linked = paragraph?.content?.find(
      (node) =>
        node.type === 'text' &&
        Array.isArray(node.marks) &&
        node.marks.some((mark) => mark.type === 'link'),
    );

    expect(linked?.text).toBe('文档');
    const linkMark = linked?.marks?.find((mark) => mark.type === 'link');
    expect(linkMark?.attrs?.href).toBe('https://example.com/docs');

    const md = jsonToMarkdown(json);
    expect(md).toContain('[文档](https://example.com/docs)');
  });
});
