import type { DefaultExtensionsOptions } from '../types';
import type { SlashCommandOptions, SlashRequestContext } from '../commands/slashTypes';
import type { UmeanMessages } from '../i18n';
import {
  isImageFile,
  normalizeImageUploadResult,
  pickLocalFile,
} from '../media/uploadTypes';

/**
 * 合并 Slash 配置：若提供了 `upload.onImageUpload` 且宿主未拦截 insertImage，
 * 默认用文件选择器 + 上传回调。
 */
export function resolveSlashOptions(
  options: DefaultExtensionsOptions,
  messages?: UmeanMessages,
): SlashCommandOptions | false {
  if (options.slash === false) {
    return false;
  }

  const slash: SlashCommandOptions =
    typeof options.slash === 'object' && options.slash ? options.slash : {};

  if (messages && !slash.messages) {
    slash.messages = messages;
  }

  const upload = options.upload === false ? undefined : options.upload;
  const onImageUpload = upload?.onImageUpload;
  if (!onImageUpload) {
    return slash;
  }

  const acceptImage = upload.acceptImage ?? 'image/*';
  const userOnRequest = slash.onRequest;

  return {
    ...slash,
    onRequest: (ctx: SlashRequestContext) => {
      if (userOnRequest?.(ctx)) {
        return true;
      }

      if (ctx.item.action !== 'insertImage') {
        return false;
      }

      void (async () => {
        const file = await pickLocalFile(acceptImage);
        if (!file || !isImageFile(file)) {
          ctx.dismiss();
          return;
        }

        const result = await onImageUpload({
          file,
          source: 'slash',
          editor: ctx.editor,
        });
        const attrs = normalizeImageUploadResult(result);
        if (!attrs) {
          ctx.dismiss();
          return;
        }

        ctx.apply(attrs);
      })();

      return true;
    },
  };
}
