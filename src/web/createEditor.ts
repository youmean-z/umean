import { EditorCore } from './EditorCore';
import type { EditorCoreOptions } from './types';

export function createEditor(options: EditorCoreOptions = {}): EditorCore {
  return new EditorCore(options);
}
