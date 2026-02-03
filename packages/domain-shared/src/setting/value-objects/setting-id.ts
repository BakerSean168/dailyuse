import { createIdType } from '@dailyuse/utils';

import type { SettingId as ISettingId } from '@dailyuse/contracts/primitives';

/**
 * SettingId 值对象
 * 用于强类型化设置 ID
 */
export const SettingId = createIdType<ISettingId>('ISettingId');
export type SettingId = ISettingId;
