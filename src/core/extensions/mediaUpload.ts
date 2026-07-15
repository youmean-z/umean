import { Extension, type Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

import {
  collectFilesFromDataTransfer,
  isImageFile,
  normalizeFileUploadResult,
  normalizeImageUploadResult,
  pickLocalFile,
  type MediaUploadOptions,
  type UploadSource,
} from '../media/uploadTypes';

const mediaUploadPluginKey = new PluginKey('umeanMediaUpload');

async function insertUploadedImage(
  editor: Editor,
  file: File,
  source: UploadSource,
  options: MediaUploadOptions,
): Promise<boolean> {
  if (!options.onImageUpload) {
    return false;
  }

  const result = await options.onImageUpload({ file, source, editor });
  const attrs = normalizeImageUploadResult(result);
  if (!attrs) {
    return false;
  }

  return editor.chain().focus().setImage(attrs).run();
}

async function insertUploadedFile(
  editor: Editor,
  file: File,
  source: UploadSource,
  options: MediaUploadOptions,
): Promise<boolean> {
  if (!options.onFileUpload) {
    return false;
  }

  const result = await options.onFileUpload({ file, source, editor });
  const link = normalizeFileUploadResult(result);
  if (!link) {
    return false;
  }

  return editor
    .chain()
    .focus()
    .insertContent({
      type: 'text',
      text: link.text ?? link.href,
      marks: [{ type: 'link', attrs: { href: link.href } }],
    })
    .run();
}

async function handleFiles(
  editor: Editor,
  files: File[],
  source: UploadSource,
  options: MediaUploadOptions,
): Promise<boolean> {
  let handled = false;

  for (const file of files) {
    if (isImageFile(file)) {
      if (await insertUploadedImage(editor, file, source, options)) {
        handled = true;
      }
      continue;
    }

    if (await insertUploadedFile(editor, file, source, options)) {
      handled = true;
    }
  }

  return handled;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mediaUpload: {
      /** 打开系统文件选择并上传图片 */
      pickAndUploadImage: () => ReturnType;
      /** 直接上传某个图片文件 */
      uploadImageFile: (file: File) => ReturnType;
    };
  }
}

/**
 * 媒体上传：粘贴 / 拖放图片（及可选非图片文件）走宿主回调，返回 URL 再插入。
 */
export const MediaUpload = Extension.create<MediaUploadOptions>({
  name: 'umeanMediaUpload',

  addOptions() {
    return {
      onImageUpload: undefined,
      onFileUpload: undefined,
      acceptImage: 'image/*',
      enablePaste: true,
      enableDrop: true,
    };
  },

  addCommands() {
    return {
      pickAndUploadImage:
        () =>
        ({ editor }) => {
          const options = this.options;
          if (!options.onImageUpload) {
            return false;
          }

          void (async () => {
            const file = await pickLocalFile(options.acceptImage ?? 'image/*');
            if (!file || !isImageFile(file)) {
              return;
            }
            await insertUploadedImage(editor, file, 'slash', options);
          })();

          return true;
        },
      uploadImageFile:
        (file: File) =>
        ({ editor }) => {
          if (!this.options.onImageUpload || !isImageFile(file)) {
            return false;
          }
          void insertUploadedImage(editor, file, 'command', this.options);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const options = this.options;

    return [
      new Plugin({
        key: mediaUploadPluginKey,
        props: {
          handlePaste(view: EditorView, event: ClipboardEvent) {
            if (options.enablePaste === false || !options.onImageUpload) {
              return false;
            }

            const files = collectFilesFromDataTransfer(event.clipboardData);
            const images = files.filter(isImageFile);
            if (images.length === 0) {
              return false;
            }

            event.preventDefault();
            void handleFiles(editor, images, 'paste', options);
            return true;
          },
          handleDrop(view: EditorView, event: DragEvent) {
            if (options.enableDrop === false) {
              return false;
            }

            const files = collectFilesFromDataTransfer(event.dataTransfer);
            if (files.length === 0) {
              return false;
            }

            const hasHandler =
              (options.onImageUpload && files.some(isImageFile)) ||
              (options.onFileUpload && files.some((f) => !isImageFile(f)));

            if (!hasHandler) {
              return false;
            }

            event.preventDefault();
            void handleFiles(editor, files, 'drop', options);
            return true;
          },
        },
      }),
    ];
  },
});

export {
  insertUploadedImage,
  handleFiles,
};
