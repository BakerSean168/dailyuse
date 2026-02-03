import { createIdType } from '@dailyuse/utils';

import type { SettingGroupId as ISettingGroupId } from '@dailyuse/contracts/primitives';

/**
 * SettingGroupId 值对象
 * 用于强类型化设置分组 ID
 */
export const SettingGroupId = createIdType<ISettingGroupId>('ISettingGroupId');
export type SettingGroupId = ISettingGroupId;
