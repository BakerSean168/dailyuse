import { createIdType } from '@dailyuse/utils';

import type { SyncProfileId as ISyncProfileId } from '@dailyuse/contracts/primitives';

/**
 * SyncProfileId 值对象
 * 用于强类型化同步配置 ID
 */
export const SyncProfileId = createIdType<ISyncProfileId>('ISyncProfileId');
export type SyncProfileId = ISyncProfileId;
