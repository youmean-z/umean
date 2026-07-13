import go from 'highlight.js/lib/languages/go';
import { createEditor, type HeadingPolicyMode } from '../src/web/index.ts';

const editorEl = document.querySelector('#editor');
const jsonOutputEl = document.querySelector('#json-output');
const htmlOutputEl = document.querySelector('#html-output');
const markdownOutputEl = document.querySelector('#markdown-output');

/** 公式 + Mermaid 流程图 demo 初始内容 */
const DEMO_MARKDOWN = `# 公式与流程图测试

行内公式：$E=mc^2$ 以及 $\\alpha + \\beta = \\gamma$

$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2} \\\\
E=mc^2
$$

代码块（顶栏语言下拉 + 复制）：

\`\`\`javascript
const message = 'hello umean';
console.log(message);
\`\`\`

\`\`\`go
package main

import "fmt"

func main() {
    fmt.Println("hello umean")
}
\`\`\`

流程图（工具栏「图表 / 源码」切换 + 复制）：

\`\`\`mermaid
graph TD
    A[开始] --> B{判断}
    B -->|是| C[通过]
    B -->|否| D[重试]
    D --> B
\`\`\`

`;

function resolveHeadingPolicyMode(): HeadingPolicyMode {
  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === 'document' || mode === 'chunk' || mode === 'free') {
    return mode;
  }

  return 'free';
}

if (!editorEl) {
  throw new Error('Missing #editor element');
}

const core = createEditor({
  element: editorEl as HTMLElement,
  content: DEMO_MARKDOWN,
  contentType: 'markdown',
  extensionOptions: {
    headingPolicy: { mode: resolveHeadingPolicyMode() },
    rich: {
      codeBlockLanguages: [
        'js',
        'ts',
        'html',
        'css',
        'markdown',
        {
          id: 'go',
          grammar: go,
          aliases: ['golang'],
          label: 'Go',
        },
      ],
    },
  },
  onUpdate: ({ json, html, markdown }) => {
    if (jsonOutputEl) {
      jsonOutputEl.textContent = JSON.stringify(json, null, 2);
    }
    if (htmlOutputEl) {
      htmlOutputEl.textContent = html;
    }
    if (markdownOutputEl) {
      markdownOutputEl.textContent = markdown;
    }
  },
  editorProps: {
    attributes: {
      class: 'editor-content',
    },
  },
});

if (jsonOutputEl) {
  jsonOutputEl.textContent = JSON.stringify(core.getJSON(), null, 2);
}
if (htmlOutputEl) {
  htmlOutputEl.textContent = core.getHTML();
}
if (markdownOutputEl) {
  markdownOutputEl.textContent = core.getMarkdown();
}

// 方便控制台调试：core.setMarkdown(...)、core.editor.commands.insertInlineMath(...)
(window as unknown as { core: typeof core }).core = core;
