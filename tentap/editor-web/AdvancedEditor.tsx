import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap } from '@10play/tentap-editor';

import {
  createTenTapBridges,
  createTenTapTiptapOptions,
} from '../../src/tentap/index.ts';
import { resolveTenTapExtensionOptions } from '../../src/tentap/resolveTenTapExtensionOptions.ts';

declare global {
  interface Window {
    bridgeExtensionConfigMap?: string;
    dynamicHeight?: boolean;
  }
}

const extensionOptions = resolveTenTapExtensionOptions({
  search: window.location.search,
  bridgeExtensionConfigMap: window.bridgeExtensionConfigMap,
});

export function AdvancedEditor() {
  const editor = useTenTap({
    bridges: createTenTapBridges(extensionOptions),
    tiptapOptions: createTenTapTiptapOptions(extensionOptions),
  });

  return (
    <EditorContent
      editor={editor}
      className={`umean-editor${window.dynamicHeight ? ' dynamic-height' : ''}`}
    />
  );
}
