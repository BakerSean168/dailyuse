import { createIdType } from '@dailyuse/utils/domain';

import type { ResourceId as IResourceId } from '@dailyuse/contracts/primitives';

/**
 * ResourceId 值对象
 * 用于强类型化资源 ID
 */
export const ResourceId = createIdType<IResourceId>('IResourceId');
export type ResourceId = IResourceId;
