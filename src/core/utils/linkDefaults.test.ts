import { describe, it, expect } from 'vitest';
import { createDefaultExtensions } from '../extensions/defaultExtensions';
import { DEFAULT_LINK_OPTIONS, resolveStarterKitLink } from './linkDefaults';

describe('resolveStarterKitLink', () => {
  it('returns note defaults by default', () => {
    expect(resolveStarterKitLink({})).toEqual(DEFAULT_LINK_OPTIONS);
  });

  it('disables link when link: false', () => {
    expect(resolveStarterKitLink({ link: false })).toBe(false);
  });

  it('disables link when starterKit.link: false', () => {
    expect(resolveStarterKitLink({ starterKit: { link: false } })).toBe(false);
  });

  it('merges top-level link options over defaults', () => {
    expect(
      resolveStarterKitLink({
        link: { openOnClick: true, HTMLAttributes: { class: 'custom-link' } },
      }),
    ).toEqual({
      ...DEFAULT_LINK_OPTIONS,
      openOnClick: true,
      HTMLAttributes: {
        ...DEFAULT_LINK_OPTIONS.HTMLAttributes,
        class: 'custom-link',
      },
    });
  });

  it('lets top-level link override starterKit.link: false', () => {
    expect(
      resolveStarterKitLink({
        starterKit: { link: false },
        link: { autolink: false },
      }),
    ).toMatchObject({ autolink: false, openOnClick: false });
  });
});

describe('createDefaultExtensions link', () => {
  it('registers link with note defaults', () => {
    const exts = createDefaultExtensions();
    const starter = exts.find((e: { name: string }) => e.name === 'starterKit') as {
      options?: { link?: unknown };
    };
    // StarterKit may flatten child extensions; inspect configured options or child
    const link = exts.find((e: { name: string }) => e.name === 'link') as {
      options?: Record<string, unknown>;
    };

    if (link) {
      expect(link.options?.autolink).toBe(true);
      expect(link.options?.openOnClick).toBe(false);
      expect(link.options?.defaultProtocol).toBe('https');
      expect(link.options?.HTMLAttributes).toMatchObject({
        target: '_blank',
        rel: 'noopener noreferrer',
        class: 'umean-link',
      });
      return;
    }

    // Fallback: StarterKit keeps nested options
    expect(starter?.options?.link).toMatchObject({
      autolink: true,
      openOnClick: false,
      defaultProtocol: 'https',
    });
  });

  it('omits link when link: false', () => {
    const exts = createDefaultExtensions({ link: false });
    const names = exts.map((e: { name: string }) => e.name);
    expect(names).not.toContain('link');
  });
});
