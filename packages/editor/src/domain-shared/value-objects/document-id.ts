import { createIdType } from '@dailyuse/utils';

import type { DocumentId as IDocumentId } from '@dailyuse/contracts/primitives';

/**
 * DocumentId 值对象
 * 用于强类型化文档 ID
 */
export const DocumentId = createIdType<IDocumentId>('IDocumentId');
export type DocumentId = IDocumentId;
