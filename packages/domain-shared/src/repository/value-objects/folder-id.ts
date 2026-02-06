import { createIdType } from '@dailyuse/utils';

import type { FolderId as IFolderId } from '@dailyuse/contracts/primitives';

/**
 * FolderId 值对象
 * 用于强类型化文件夹 ID
 */
export const FolderId = createIdType<IFolderId>('IFolderId');
export type FolderId = IFolderId;
