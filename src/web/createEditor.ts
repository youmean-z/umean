import { EditorCore } from './EditorCore.js';
import type { EditorCoreOptions } from './types.js';

export function createEditor(options: EditorCoreOptions = {}): EditorCore {
  return new EditorCore(options);
}
