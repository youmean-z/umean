import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'test/main.ts',
  output: {
    file: 'test/dist/main.js',
    format: 'esm',
  },
});
