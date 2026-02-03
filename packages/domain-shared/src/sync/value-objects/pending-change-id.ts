import { createIdType } from '@dailyuse/utils';

import type { PendingChangeId as IPendingChangeId } from '@dailyuse/contracts/primitives';

/**
 * PendingChangeId 值对象
 * 用于强类型化待同步变更 ID
 */
export const PendingChangeId = createIdType<IPendingChangeId>('IPendingChangeId');
export type PendingChangeId = IPendingChangeId;
