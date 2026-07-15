import { describe, expect, it } from 'vitest';

import { EN, ZH_CN, resolveMessages } from './i18n';

describe('resolveMessages', () => {
  it('defaults to zh-CN when locale is omitted', () => {
    expect(resolveMessages()).toBe(ZH_CN);
    expect(resolveMessages(undefined)).toBe(ZH_CN);
  });

  it('returns zh-CN for locale zh-CN', () => {
    expect(resolveMessages('zh-CN')).toBe(ZH_CN);
  });

  it('returns en for locale en', () => {
    const messages = resolveMessages('en');
    expect(messages).toBe(EN);
    expect(messages.slashParagraph).toBe('Paragraph');
    expect(messages.slashHeading1).toBe('Heading 1');
    expect(messages.copy).toBe('Copy');
    expect(messages.codeBlockLanguage).toBe('Code language');
    expect(messages.codeBlockPlainText).toBe('Plain Text');
    expect(messages.calloutWarning).toBe('Warning');
    expect(messages.slashGroupBasic).toBe('Basic');
  });

  it('merges partial overrides onto zh-CN', () => {
    const messages = resolveMessages({
      copy: 'Copy!',
      slashParagraph: 'Body',
    });

    expect(messages.copy).toBe('Copy!');
    expect(messages.slashParagraph).toBe('Body');
    expect(messages.placeholderTitle).toBe(ZH_CN.placeholderTitle);
    expect(messages.codeBlockPlainText).toBe(ZH_CN.codeBlockPlainText);
    expect(messages).not.toBe(ZH_CN);
  });
});
