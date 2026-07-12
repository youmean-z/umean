import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'rolldown';

const root = fileURLToPath(new URL('.', import.meta.url));
const srcDir = join(root, 'src');

function collectTsEntries(dir: string): Record<string, string> {
  const entries: Record<string, string> = {};

  function walk(current: string) {
    for (const name of readdirSync(current)) {
      const fullPath = join(current, name);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) {
        const key = relative(srcDir, fullPath)
          .replace(/\\/g, '/')
          .replace(/\.ts$/, '');
        entries[key] = fullPath;
      }
    }
  }

  walk(dir);
  return entries;
}

function isExternal(id: string): boolean {
  return !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0');
}

export default defineConfig({
  input: collectTsEntries(srcDir),
  external: isExternal,
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: '[name].js',
    preserveModules: true,
    preserveModulesRoot: 'src',
    sourcemap: true,
  },
});
