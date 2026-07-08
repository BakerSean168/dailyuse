import { createIdType } from '@dailyuse/utils/domain';

import type { RepositoryId as IRepositoryId } from '@dailyuse/contracts/primitives';

/**
 * RepositoryId 值对象
 * 用于强类型化仓库 ID
 */
export const RepositoryId = createIdType<IRepositoryId>('IRepositoryId');
export type RepositoryId = IRepositoryId;
