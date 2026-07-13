import { describe, it, expect } from 'vitest';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';

import {
  DEFAULT_CODE_BLOCK_LANGUAGES,
  resolveCodeBlockLanguageConfig,
  resolveCodeBlockLanguageId,
} from './codeBlockLanguages';

describe('resolveCodeBlockLanguageConfig', () => {
  it('uses default languages when input is empty', () => {
    const config = resolveCodeBlockLanguageConfig();

    expect(config.languages.map((item) => item.id)).toEqual([
      'javascript',
      'typescript',
      'xml',
      'css',
      'markdown',
    ]);
    expect(config.defaultLanguageId).toBe('javascript');
    expect(config.lowlight.listLanguages()).toContain('javascript');
    expect(config.lowlight.listLanguages()).not.toContain('python');
  });

  it('matches DEFAULT_CODE_BLOCK_LANGUAGES preset length', () => {
    expect(DEFAULT_CODE_BLOCK_LANGUAGES).toHaveLength(5);
  });

  it('resolves shorthand strings', () => {
    const config = resolveCodeBlockLanguageConfig(['js', 'ts', 'html']);

    expect(config.languages.map((item) => item.id)).toEqual([
      'javascript',
      'typescript',
      'xml',
    ]);
    expect(config.languages.find((item) => item.id === 'xml')?.label).toBe('HTML');
  });

  it('registers custom grammars and aliases', () => {
    const config = resolveCodeBlockLanguageConfig([
      {
        id: 'python',
        grammar: python,
        aliases: ['py'],
        label: 'Python',
      },
    ]);

    expect(config.languages).toEqual([
      {
        id: 'python',
        label: 'Python',
        aliases: ['py'],
        highlight: true,
      },
    ]);
    expect(config.lowlight.listLanguages()).toEqual(['python']);
    expect(resolveCodeBlockLanguageId(config, 'py')).toBe('python');
  });

  it('supports highlight: false without registering grammar', () => {
    const config = resolveCodeBlockLanguageConfig([
      {
        id: 'markdown',
        grammar: javascript,
        highlight: false,
        label: 'Markdown',
      },
    ]);

    expect(config.languages[0]?.highlight).toBe(false);
    expect(config.lowlight.listLanguages()).toEqual([]);
  });

  it('merges external grammar injection with metadata', () => {
    const config = resolveCodeBlockLanguageConfig([
      {
        id: 'javascript',
        grammar: javascript,
        aliases: ['js'],
        label: 'JS',
      },
    ]);

    expect(config.languages[0]).toMatchObject({
      id: 'javascript',
      label: 'JS',
      aliases: ['js'],
      highlight: true,
    });
    expect(config.lowlight.listLanguages()).toEqual(['javascript']);
  });
});
