import { createIdType } from '@dailyuse/utils';

import type { SettingHistoryId as ISettingHistoryId } from '@dailyuse/contracts/primitives';

/**
 * SettingHistoryId 值对象
 * 用于强类型化设置历史 ID
 */
export const SettingHistoryId = createIdType<ISettingHistoryId>('ISettingHistoryId');
export type SettingHistoryId = ISettingHistoryId;
