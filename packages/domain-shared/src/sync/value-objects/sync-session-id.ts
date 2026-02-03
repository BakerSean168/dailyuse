import { createIdType } from '@dailyuse/utils';

import type { SyncSessionId as ISyncSessionId } from '@dailyuse/contracts/primitives';

/**
 * SyncSessionId 值对象
 * 用于强类型化同步会话 ID
 */
export const SyncSessionId = createIdType<ISyncSessionId>('ISyncSessionId');
export type SyncSessionId = ISyncSessionId;
