export type UploadSource = 'paste' | 'drop' | 'slash' | 'command';

export interface UploadContext {
  file: File;
  source: UploadSource;
  editor: import('@tiptap/core').Editor;
}

/** 上传结果：URL 字符串，或图片 attrs；`null`/`undefined` 表示取消。 */
export type ImageUploadResult =
  | string
  | { src: string; alt?: string; title?: string }
  | null
  | undefined;

/** 非图片文件：URL、链接 attrs，或取消。 */
export type FileUploadResult =
  | string
  | { href: string; text?: string }
  | null
  | undefined;

export interface MediaUploadOptions {
  /** 图片上传（粘贴 / 拖放 / Slash「图片」共用） */
  onImageUpload?: (
    ctx: UploadContext,
  ) => ImageUploadResult | Promise<ImageUploadResult>;
  /**
   * 非图片文件上传。返回链接后以「链接文本」形式插入。
   * 未提供时拖入的非图片文件会被忽略。
   */
  onFileUpload?: (
    ctx: UploadContext,
  ) => FileUploadResult | Promise<FileUploadResult>;
  /** 图片 accept，默认 `image/*` */
  acceptImage?: string;
  /** 拦截粘贴图片，默认 true */
  enablePaste?: boolean;
  /** 拦截拖放文件，默认 true */
  enableDrop?: boolean;
}

export function normalizeImageUploadResult(
  result: ImageUploadResult,
): { src: string; alt?: string; title?: string } | null {
  if (result == null) {
    return null;
  }
  if (typeof result === 'string') {
    return result ? { src: result } : null;
  }
  if (typeof result.src === 'string' && result.src.length > 0) {
    return {
      src: result.src,
      alt: result.alt,
      title: result.title,
    };
  }
  return null;
}

export function normalizeFileUploadResult(
  result: FileUploadResult,
): { href: string; text?: string } | null {
  if (result == null) {
    return null;
  }
  if (typeof result === 'string') {
    return result ? { href: result, text: result } : null;
  }
  if (typeof result.href === 'string' && result.href.length > 0) {
    return {
      href: result.href,
      text: result.text ?? result.href,
    };
  }
  return null;
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function collectFilesFromDataTransfer(
  dataTransfer: DataTransfer | null | undefined,
): File[] {
  if (!dataTransfer) {
    return [];
  }

  if (dataTransfer.files?.length) {
    return Array.from(dataTransfer.files);
  }

  const fromItems: File[] = [];
  for (const item of Array.from(dataTransfer.items ?? [])) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) {
        fromItems.push(file);
      }
    }
  }
  return fromItems;
}

export function pickLocalFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    document.body.appendChild(input);

    let settled = false;
    const finish = (file: File | null) => {
      if (settled) {
        return;
      }
      settled = true;
      input.remove();
      resolve(file);
    };

    input.addEventListener('change', () => {
      finish(input.files?.[0] ?? null);
    });

    input.addEventListener('cancel', () => {
      finish(null);
    });

    input.click();
  });
}
