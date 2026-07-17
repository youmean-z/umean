import go from 'highlight.js/lib/languages/go';
import {
  createEditor,
  getFindReplaceState,
  type HeadingPolicyMode,
} from '../src/web/index.ts';

const editorEl = document.querySelector('#editor');
const jsonOutputEl = document.querySelector('#json-output');
const htmlOutputEl = document.querySelector('#html-output');
const markdownOutputEl = document.querySelector('#markdown-output');

const findBarEl = document.querySelector('#find-bar') as HTMLElement | null;
const findQueryEl = document.querySelector('#find-query') as HTMLInputElement | null;
const findReplaceEl = document.querySelector('#find-replace') as HTMLInputElement | null;
const findCaseEl = document.querySelector('#find-case') as HTMLInputElement | null;
const findStatusEl = document.querySelector('#find-status');
const findPrevBtn = document.querySelector('#find-prev');
const findNextBtn = document.querySelector('#find-next');
const findReplaceOneBtn = document.querySelector('#find-replace-one');
const findReplaceAllBtn = document.querySelector('#find-replace-all');
const findClearBtn = document.querySelector('#find-clear');

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
\\begin{aligned}
\\sum_{i=1}^{n} i &= \\frac{n(n+1)}{2} \\\\
E &= mc^2
\\end{aligned}
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
    updateWordStats();
  },
  onSelectionUpdate: () => {
    updateWordStats();
  },
  editorProps: {
    attributes: {
      class: 'editor-content',
    },
  },
});

const wordStatsEl = document.querySelector('#word-stats');
const readonlyToggleEl = document.querySelector(
  '#toggle-readonly',
) as HTMLInputElement | null;
const insertTemplateBtn = document.querySelector('#btn-insert-template');
const toggleShortcutsBtn = document.querySelector('#btn-toggle-shortcuts');
const shortcutPanelEl = document.querySelector(
  '#shortcut-panel',
) as HTMLElement | null;

const DEMO_TEMPLATE = {
  type: 'doc' as const,
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '会议纪要模板' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '日期：' }],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '议题一' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '待办事项' }],
            },
          ],
        },
      ],
    },
    {
      type: 'callout',
      attrs: { type: 'info' },
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '会后跟进写在这里。' }],
        },
      ],
    },
  ],
};

function updateWordStats(): void {
  if (!wordStatsEl) {
    return;
  }
  const words = core.getWordCount();
  const chars = core.getCharCount({ excludeWhitespace: true });
  const selected = core.getSelectedWordCount();
  wordStatsEl.textContent =
    selected > 0
      ? `词 ${words} · 字 ${chars} · 选中 ${selected} 词`
      : `词 ${words} · 字 ${chars}`;
}

function renderShortcutPanel(): void {
  if (!shortcutPanelEl) {
    return;
  }
  const lines = core.getShortcutList().map((item) => {
    return `${item.keys.padEnd(16)} ${item.label}`;
  });
  shortcutPanelEl.textContent = lines.join('\n');
}

updateWordStats();
renderShortcutPanel();

readonlyToggleEl?.addEventListener('change', () => {
  core.setEditable(!readonlyToggleEl.checked);
});

insertTemplateBtn?.addEventListener('click', () => {
  if (!core.isEditable()) {
    return;
  }
  core.insertTemplate(DEMO_TEMPLATE);
});

toggleShortcutsBtn?.addEventListener('click', () => {
  if (!shortcutPanelEl) {
    return;
  }
  const open = shortcutPanelEl.classList.toggle('is-open');
  shortcutPanelEl.hidden = !open;
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

function updateFindStatus(): void {
  if (!findStatusEl) {
    return;
  }
  const state = getFindReplaceState(core.editor);
  if (!state?.query) {
    findStatusEl.textContent = '未搜索';
    return;
  }
  if (state.matches.length === 0) {
    findStatusEl.textContent = '无匹配';
    return;
  }
  findStatusEl.textContent = `${state.activeIndex + 1} / ${state.matches.length}`;
}

function isFindBarOpen(): boolean {
  return !!findBarEl?.classList.contains('is-open');
}

function getEditorSelectedText(): string {
  const { from, to, empty } = core.editor.state.selection;
  if (empty || from === to) {
    return '';
  }
  return core.editor.state.doc.textBetween(from, to, '\n', '\0');
}

function openFindBar(): void {
  if (!findBarEl) {
    return;
  }
  findBarEl.hidden = false;
  findBarEl.classList.add('is-open');

  const selected = getEditorSelectedText().trim();
  if (selected && findQueryEl) {
    // 单行选区直接作为查询；多行只取第一行，避免把整段塞进搜索框
    const query = selected.split(/\r?\n/)[0] ?? selected;
    findQueryEl.value = query;
    runFindQuery();
  } else if (findQueryEl?.value) {
    runFindQuery();
  }

  findQueryEl?.focus();
  findQueryEl?.select();
}

function closeFindBar(): void {
  if (!findBarEl) {
    return;
  }
  findBarEl.classList.remove('is-open');
  findBarEl.hidden = true;
  core.editor.commands.clearFind();
  if (findQueryEl) {
    findQueryEl.value = '';
  }
  updateFindStatus();
  core.editor.view.focus();
}

function runFindQuery(): void {
  const query = findQueryEl?.value ?? '';
  if (!query) {
    core.editor.commands.clearFind();
    updateFindStatus();
    return;
  }
  core.editor.commands.setFindQuery(query, {
    caseSensitive: !!findCaseEl?.checked,
    // 输入时只更新高亮，不抢焦点、不改选区
    select: false,
    focus: false,
  });
  updateFindStatus();
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && key === 'f') {
    event.preventDefault();
    // 已打开时若有新选区，也同步进搜索框
    openFindBar();
    return;
  }

  if (event.key === 'Escape' && isFindBarOpen()) {
    event.preventDefault();
    closeFindBar();
  }
});

findQueryEl?.addEventListener('input', runFindQuery);
findCaseEl?.addEventListener('change', runFindQuery);

findQueryEl?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    if (event.shiftKey) {
      core.editor.commands.findPrevious();
    } else {
      core.editor.commands.findNext();
    }
    updateFindStatus();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeFindBar();
  }
});

findPrevBtn?.addEventListener('click', () => {
  core.editor.commands.findPrevious();
  updateFindStatus();
});

findNextBtn?.addEventListener('click', () => {
  core.editor.commands.findNext();
  updateFindStatus();
});

findReplaceOneBtn?.addEventListener('click', () => {
  core.editor.commands.replaceCurrent(findReplaceEl?.value ?? '');
  updateFindStatus();
});

findReplaceAllBtn?.addEventListener('click', () => {
  core.editor.commands.replaceAll(findReplaceEl?.value ?? '');
  updateFindStatus();
});

findClearBtn?.addEventListener('click', () => {
  closeFindBar();
});

// 方便控制台调试：core.setMarkdown(...)、core.editor.commands.insertInlineMath(...)
(window as unknown as { core: typeof core }).core = core;
