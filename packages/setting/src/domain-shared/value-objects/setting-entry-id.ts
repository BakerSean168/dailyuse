import { createIdType } from '@dailyuse/utils';

import type { SettingEntryId as ISettingEntryId } from '@dailyuse/contracts/primitives';

/**
 * SettingEntryId 值对象
 * 用于强类型化设置项 ID
 */
export const SettingEntryId = createIdType<ISettingEntryId>('ISettingEntryId');
export type SettingEntryId = ISettingEntryId;
