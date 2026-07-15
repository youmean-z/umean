import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Editor } from '@tiptap/core';

import { createDefaultExtensions } from './defaultExtensions';
import {
  collectFilesFromDataTransfer,
  isImageFile,
  normalizeImageUploadResult,
} from '../media/uploadTypes';

describe('upload helpers', () => {
  it('normalizes image upload results', () => {
    expect(normalizeImageUploadResult('https://a.png')).toEqual({
      src: 'https://a.png',
    });
    expect(
      normalizeImageUploadResult({ src: 'https://a.png', alt: 'x' }),
    ).toEqual({ src: 'https://a.png', alt: 'x' });
    expect(normalizeImageUploadResult(null)).toBeNull();
  });

  it('detects image files', () => {
    expect(isImageFile(new File(['x'], 'a.png', { type: 'image/png' }))).toBe(
      true,
    );
    expect(
      isImageFile(new File(['x'], 'a.txt', { type: 'text/plain' })),
    ).toBe(false);
  });

  it('collects files from dataTransfer', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const dt = {
      files: [file],
      items: [],
    } as unknown as DataTransfer;
    expect(collectFilesFromDataTransfer(dt)).toEqual([file]);
  });
});

describe('MediaUpload', () => {
  let editor: Editor;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    editor?.destroy();
    element.remove();
  });

  it('registers when upload option is set', () => {
    const names = createDefaultExtensions({
      upload: { onImageUpload: async () => 'https://x.png' },
    }).map((e) => e.name);
    expect(names).toContain('umeanMediaUpload');
  });

  it('pastes image file via onImageUpload', async () => {
    const onImageUpload = vi.fn(async () => ({
      src: 'https://uploaded.example/a.png',
      alt: 'pasted',
    }));

    editor = new Editor({
      element,
      extensions: createDefaultExtensions({
        upload: { onImageUpload },
      }),
      content: '<p></p>',
    });

    const file = new File(['fake'], 'shot.png', { type: 'image/png' });
    const clipboardData = {
      files: [file],
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => file,
        },
      ],
      types: ['Files'],
      getData: () => '',
    } as unknown as DataTransfer;

    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: clipboardData });

    const handled = editor.view.someProp('handlePaste', (f) =>
      f(editor.view, event as ClipboardEvent, editor.state.selection.content()),
    );

    expect(handled).toBe(true);
    await vi.waitFor(() => {
      expect(onImageUpload).toHaveBeenCalled();
      expect(editor.getHTML()).toContain('src="https://uploaded.example/a.png"');
    });
  });

  it('wires slash image to upload when onRequest not provided', () => {
    const onImageUpload = vi.fn(async () => 'https://from-slash.png');
    const exts = createDefaultExtensions({
      upload: { onImageUpload },
    });
    const slash = exts.find((e) => e.name === 'umeanSlashCommand') as {
      options: { onRequest?: (ctx: unknown) => boolean };
    };
    expect(typeof slash.options.onRequest).toBe('function');
  });
});
