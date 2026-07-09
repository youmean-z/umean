import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = join(root, 'editor-web', 'build', 'index.html');
const outputPath = join(root, 'editor-web', 'build', 'editorHtml.ts');

const html = readFileSync(htmlPath, 'utf-8');
const escaped = JSON.stringify(html);

writeFileSync(
  outputPath,
  `export const editorHtml = ${escaped};\n`,
  'utf-8',
);

console.log(`Generated ${outputPath}`);
