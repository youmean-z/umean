import { createEditor } from '../src/web/index.ts';

const editorEl = document.querySelector('#editor');
const jsonOutputEl = document.querySelector('#json-output');
const htmlOutputEl = document.querySelector('#html-output');
const markdownOutputEl = document.querySelector('#markdown-output');
const toolbarEl = document.querySelector('#toolbar');

if (!editorEl) {
  throw new Error('Missing #editor element');
}

const core = createEditor({
  element: editorEl as HTMLElement,
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

function bindButton(selector: string, handler: () => void) {
  const button = document.querySelector(selector);
  button?.addEventListener('click', handler);
}

bindButton('[data-action="toggle-task-list"]', () => {
  core.editor.chain().focus().toggleTaskList().run();
});

bindButton('[data-action="insert-table"]', () => {
  core.editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
});

bindButton('[data-action="insert-image"]', () => {
  core.editor
    .chain()
    .focus()
    .setImage({
      src: 'https://picsum.photos/seed/umean/640/240',
      alt: 'Demo image',
    })
    .run();
});

bindButton('[data-action="toggle-code-block"]', () => {
  core.editor.chain().focus().toggleCodeBlock({ language: 'javascript' }).run();
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

if (toolbarEl) {
  toolbarEl.removeAttribute('hidden');
}
