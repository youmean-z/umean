import { TenTapStartKit } from '@10play/tentap-editor';

import { CodeBlockBridge } from './bridges/codeBlockBridge';
import { TableBridge } from './bridges/tableBridge';

export function createTenTapBridges() {
  return [...TenTapStartKit, TableBridge, CodeBlockBridge];
}
