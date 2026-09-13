import { Extension } from '@tiptap/core';
import { BridgeExtension } from '@10play/tentap-editor';

import { UMEAN_CONFIG_BRIDGE_NAME } from '../umeanConfigName';

export { UMEAN_CONFIG_BRIDGE_NAME } from '../umeanConfigName';
export type { UmeanConfigBridgeConfig } from '../resolveTenTapExtensionOptions';

/**
 * 仅作 RN → WebView 配置载体（headingPolicy / codeBlockLanguages）。
 * 无编辑行为；真正策略与代码块仍由 supplemental / CodeBlockBridge 负责。
 */
const UmeanConfigMarker = Extension.create({
  name: UMEAN_CONFIG_BRIDGE_NAME,
});

export const UmeanConfigBridge = new BridgeExtension({
  forceName: UMEAN_CONFIG_BRIDGE_NAME,
  tiptapExtension: UmeanConfigMarker,
});
