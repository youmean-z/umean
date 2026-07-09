import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap, TenTapStartKit } from '@10play/tentap-editor';

import { createTenTapTiptapOptions } from '../../src/tentap/index.ts';

export function AdvancedEditor() {
  const editor = useTenTap({
    bridges: TenTapStartKit,
    tiptapOptions: createTenTapTiptapOptions(),
  });

  return (
    <EditorContent
      editor={editor}
      className={window.dynamicHeight ? 'dynamic-height' : undefined}
    />
  );
}
