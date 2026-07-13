import type { CodeBlockLanguageInput } from './codeBlockLanguages';
import {
  resolveCodeBlockLanguageConfig,
  type CodeBlockLanguageConfig,
} from './codeBlockLanguages';

let defaultConfig: CodeBlockLanguageConfig | undefined;

function getDefaultConfig(): CodeBlockLanguageConfig {
  if (!defaultConfig) {
    defaultConfig = resolveCodeBlockLanguageConfig();
  }

  return defaultConfig;
}

/** 按外部语言配置创建 lowlight 实例（不再整包注册 common） */
export function createCodeBlockLowlight(
  languages?: CodeBlockLanguageInput[] | null,
): CodeBlockLanguageConfig {
  if (!languages?.length) {
    return getDefaultConfig();
  }

  return resolveCodeBlockLanguageConfig(languages);
}

/**
 * 获取默认 lowlight 实例（使用内置 js/ts/html/css/markdown 预设）。
 * @deprecated 优先使用 `createCodeBlockLowlight(languages).lowlight`
 */
export function getSharedLowlight() {
  return getDefaultConfig().lowlight;
}
