import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

import { MermaidNodeView } from '../extensions/mermaidCodeBlock';
import { ZH_CN } from '../i18n';

export const tentapMermaidPreviewPluginKey = new PluginKey(
  'tentapMermaidPreview',
);

/**
 * TenTap：mermaid 代码块用图表预览，不画 Web 顶栏。
 * 切图表 / 源码走原生格式栏。
 */
export const TenTapMermaidPreview = Extension.create({
  name: 'tentapMermaidPreview',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: tentapMermaidPreviewPluginKey,
        props: {
          nodeViews: {
            codeBlock: (
              node: ProseMirrorNode,
              view: EditorView,
              getPos: () => number | undefined,
            ) => {
              if (node.attrs.language !== 'mermaid') {
                return undefined as never;
              }

              return new MermaidNodeView(node, view, getPos, {
                theme: 'neutral',
                messages: ZH_CN,
                toolbar: false,
              });
            },
          },
        },
      }),
    ];
  },
});
