import type {
  CodeBlockLanguageInput,
  DefaultExtensionsOptions,
  HeadingPolicyMode,
  HeadingPolicyOptions,
} from '../core/types';
import { UMEAN_CONFIG_BRIDGE_NAME } from './umeanConfigName';

export interface UmeanConfigBridgeConfig {
  headingPolicy?: HeadingPolicyOptions | false;
  codeBlockLanguages?: CodeBlockLanguageInput[];
}

export interface ResolveTenTapExtensionOptionsInput {
  /** `window.location.search`，如 `?mode=document`（DEV） */
  search?: string;
  /** `window.bridgeExtensionConfigMap` JSON 字符串 */
  bridgeExtensionConfigMap?: string;
}

function parseQueryMode(search: string | undefined): HeadingPolicyMode | null {
  const mode = new URLSearchParams(search ?? '').get('mode');
  if (mode === 'document' || mode === 'chunk' || mode === 'free') {
    return mode;
  }
  return null;
}

function parseBridgeConfig(
  raw: string | undefined,
): UmeanConfigBridgeConfig {
  try {
    const map = JSON.parse(raw || '{}') as Record<
      string,
      { optionsConfig?: UmeanConfigBridgeConfig }
    >;
    return map[UMEAN_CONFIG_BRIDGE_NAME]?.optionsConfig ?? {};
  } catch {
    return {};
  }
}

/**
 * 从 RN 注入的 bridge config（及可选 URL `?mode=`）解析 WebView 侧 extensionOptions。
 */
export function resolveTenTapExtensionOptions(
  input: ResolveTenTapExtensionOptionsInput = {},
): Pick<DefaultExtensionsOptions, 'headingPolicy'> & {
  codeBlockLanguages?: CodeBlockLanguageInput[];
} {
  const queryMode = parseQueryMode(input.search);
  const fromBridge = parseBridgeConfig(input.bridgeExtensionConfigMap);

  let headingPolicy: HeadingPolicyOptions | false;
  if (fromBridge.headingPolicy === false) {
    headingPolicy = false;
  } else if (
    fromBridge.headingPolicy &&
    typeof fromBridge.headingPolicy === 'object'
  ) {
    headingPolicy = {
      ...fromBridge.headingPolicy,
      mode: queryMode ?? fromBridge.headingPolicy.mode ?? 'free',
    };
  } else {
    headingPolicy = { mode: queryMode ?? 'free' };
  }

  return {
    headingPolicy,
    codeBlockLanguages: fromBridge.codeBlockLanguages,
  };
}
