import go from 'highlight.js/lib/languages/go';
import { createEditor, type HeadingPolicyMode } from '../src/web/index.ts';

const editorEl = document.querySelector('#editor');
const jsonOutputEl = document.querySelector('#json-output');
const htmlOutputEl = document.querySelector('#html-output');
const markdownOutputEl = document.querySelector('#markdown-output');

/** 公式 + Mermaid 流程图 demo 初始内容 */
const DEMO_MARKDOWN = `# 公式与流程图测试

链接：[umean](https://example.com) ；编辑完链接文字后，在链末按 → 即可继续写正文。

行内代码 \`npm test\` 与高亮 ==重点内容== （快捷键 Mod-Shift-h）。

> 这是普通引用。适合摘录他人原话。

> [!info]
> 这是提示块（Callout）。Slash 搜「提示」或「警告」可插入。

> [!warning]
> 修改生产配置前请先备份。

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

空行里输入 \`/\` 打开 Slash 菜单；选「图片」会走本地文件上传钩子。也可直接粘贴/拖入图片。

`;

function resolveHeadingPolicyMode(): HeadingPolicyMode {
  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === 'document' || mode === 'chunk' || mode === 'free') {
    return mode;
  }

  return 'free';
}

function resolveLocale(): 'zh-CN' | 'en' {
  const locale = new URLSearchParams(window.location.search).get('locale');
  return locale === 'en' ? 'en' : 'zh-CN';
}

if (!editorEl) {
  throw new Error('Missing #editor element');
}

const core = createEditor({
  element: editorEl as HTMLElement,
  content: DEMO_MARKDOWN,
  contentType: 'markdown',
  extensionOptions: {
    locale: resolveLocale(),
    headingPolicy: { mode: resolveHeadingPolicyMode() },
    upload: {
      onImageUpload: async ({ file, source }) => {
        // demo：模拟上传延迟后用本地 Object URL（真实宿主应上传到 CDN 并返回 https URL）
        console.info('[umean upload]', source, file.name, file.type);
        await new Promise((resolve) => setTimeout(resolve, 250));
        return {
          src: URL.createObjectURL(file),
          alt: file.name,
        };
      },
      onFileUpload: async ({ file, source }) => {
        console.info('[umean file upload]', source, file.name);
        await new Promise((resolve) => setTimeout(resolve, 250));
        const href = URL.createObjectURL(file);
        return { href, text: file.name };
      },
    },
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
