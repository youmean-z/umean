import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'test/main.ts',
  output: {
    dir: 'test/dist',
    format: 'esm',
    entryFileNames: 'main.js',
  },
});
