import { createIdType } from '@dailyuse/utils';

import type { SyncConflictId as ISyncConflictId } from '@dailyuse/contracts/primitives';

/**
 * SyncConflictId 值对象
 * 用于强类型化同步冲突 ID
 */
export const SyncConflictId = createIdType<ISyncConflictId>('ISyncConflictId');
export type SyncConflictId = ISyncConflictId;
