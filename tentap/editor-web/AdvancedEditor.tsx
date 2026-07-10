import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap } from '@10play/tentap-editor';

import {
  createTenTapBridges,
  createTenTapTiptapOptions,
} from '../../src/tentap/index.ts';

export function AdvancedEditor() {
  const editor = useTenTap({
    bridges: createTenTapBridges(),
    tiptapOptions: createTenTapTiptapOptions(),
  });

  return (
    <EditorContent
      editor={editor}
      className={`umean-editor${window.dynamicHeight ? ' dynamic-height' : ''}`}
    />
  );
}
