import {
  HeadingBridge,
  PlaceholderBridge,
  TenTapStartKit,
} from '@10play/tentap-editor';

import type { HeadingPolicyOptions } from '../core/types';
import { CodeBlockBridge } from './bridges/codeBlockBridge';
import { TableBridge } from './bridges/tableBridge';

export interface TenTapBridgesOptions {
  /** 与 Web 一致的标题策略；`false` 时保留 TenTap 内置 PlaceholderBridge */
  headingPolicy?: HeadingPolicyOptions | false;
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

  if (headingPolicyMode === 'chunk') {
    bridges = bridges.map((bridge) =>
      bridge === HeadingBridge
        ? HeadingBridge.configureExtension({ levels: [2, 3, 4, 5, 6] })
        : bridge,
    );
  }

  return [...bridges, TableBridge, CodeBlockBridge];
}
