import { createLowlight, common } from 'lowlight';

let sharedLowlight: ReturnType<typeof createLowlight> | undefined;

export function getSharedLowlight() {
  if (!sharedLowlight) {
    sharedLowlight = createLowlight(common);
  }

  return sharedLowlight;
}
