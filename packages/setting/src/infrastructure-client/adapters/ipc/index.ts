/**
 * Setting IPC Adapters - Registration
 */

import type { IIpcClient } from '../types';
import { SettingIpcAdapter } from './setting-ipc.adapter';

export { SettingIpcAdapter } from './setting-ipc.adapter';

export interface SettingIpcAdapters {
  setting: SettingIpcAdapter;
}

export function createSettingIpcAdapters(ipcClient: IIpcClient): SettingIpcAdapters {
  return { setting: new SettingIpcAdapter(ipcClient) };
}
