import { createIdType } from '@dailyuse/utils';

import type { DataSnapshotId as IDataSnapshotId } from '@dailyuse/contracts/primitives';

/**
 * DataSnapshotId 值对象
 * 用于强类型化数据快照 ID
 */
export const DataSnapshotId = createIdType<IDataSnapshotId>('IDataSnapshotId');
export type DataSnapshotId = IDataSnapshotId;
