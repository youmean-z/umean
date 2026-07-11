import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap } from '@10play/tentap-editor';

import type { HeadingPolicyMode } from '../../src/core/types.ts';
import {
  createTenTapBridges,
  createTenTapTiptapOptions,
} from '../../src/tentap/index.ts';

function resolveHeadingPolicyMode(): HeadingPolicyMode {
  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === 'document' || mode === 'chunk' || mode === 'free') {
    return mode;
  }

  return 'free';
}

const extensionOptions = {
  headingPolicy: { mode: resolveHeadingPolicyMode() },
};

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
