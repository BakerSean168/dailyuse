import { createIdType } from '@memoflow/utils/domain';

import type { SettingId as ISettingId } from '@memoflow/contracts/primitives';

/**
 * SettingId 值对象
 * 用于强类型化设置 ID
 */
export const SettingId = createIdType<ISettingId>('ISettingId');
export type SettingId = ISettingId;
