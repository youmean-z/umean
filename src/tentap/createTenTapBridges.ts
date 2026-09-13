import { HeadingBridge, PlaceholderBridge, TenTapStartKit } from '@10play/tentap-editor';

import type { HeadingPolicyOptions, CodeBlockLanguageInput } from '../core/types';
import { CalloutBridge } from './bridges/calloutBridge';
import { createCodeBlockBridge } from './bridges/codeBlockBridge';
import { HorizontalRuleBridge } from './bridges/horizontalRuleBridge';
import { ImageBridge } from './bridges/imageBridge';
import { LinkBridge } from './bridges/linkBridge';
import { MathBridge } from './bridges/mathBridge';
import { TableBridge } from './bridges/tableBridge';
import { UmeanConfigBridge } from './bridges/umeanConfigBridge';

export interface TenTapBridgesOptions {
  /** 与 Web 一致的标题策略；`false` 时保留 TenTap 内置 PlaceholderBridge */
  headingPolicy?: HeadingPolicyOptions | false;
  /** 代码块语言与高亮 grammar 配置 */
  codeBlockLanguages?: CodeBlockLanguageInput[];
}

export function createTenTapBridges(options: TenTapBridgesOptions = {}) {
  const useUmeanPlaceholder = options.headingPolicy !== false;
  const headingPolicyMode =
    options.headingPolicy === false
      ? null
      : (options.headingPolicy?.mode ?? 'free');

  let bridges = [...TenTapStartKit];

  if (useUmeanPlaceholder) {
    bridges = bridges.filter((bridge) => bridge !== PlaceholderBridge);
  }

  // 换成会在图后补空段落的 ImageBridge，避免选区停在图片上
  bridges = bridges.filter((bridge) => bridge.name !== 'image');
  // 换成空选区也能插入链接的 LinkBridge，栏内填 URL
  bridges = bridges.filter((bridge) => bridge.name !== 'link');
  bridges = bridges.filter((bridge) => bridge.name !== 'horizontalRule');

  if (headingPolicyMode === 'chunk') {
    bridges = bridges.map((bridge) =>
      bridge === HeadingBridge
        ? HeadingBridge.configureExtension({ levels: [2, 3, 4, 5, 6] })
        : bridge,
    );
  }

  const headingPolicyConfig: HeadingPolicyOptions | false =
    options.headingPolicy === false
      ? false
      : {
          mode: options.headingPolicy?.mode ?? 'free',
          placeholderTitle: options.headingPolicy?.placeholderTitle,
          placeholderContent: options.headingPolicy?.placeholderContent,
        };

  return [
    ...bridges,
    TableBridge,
    createCodeBlockBridge({ languages: options.codeBlockLanguages }),
    ImageBridge,
    LinkBridge,
    HorizontalRuleBridge,
    CalloutBridge,
    MathBridge,
    // RN → WebView：经 bridgeExtensionConfigMap 注入 headingPolicy / codeBlockLanguages
    UmeanConfigBridge.configureExtension({
      headingPolicy: headingPolicyConfig,
      codeBlockLanguages: options.codeBlockLanguages,
    }),
  ];
}
