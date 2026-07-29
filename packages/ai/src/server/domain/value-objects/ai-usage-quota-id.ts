import { createIdType } from '@memoflow/utils/domain';

import type { AiUsageQuotaId as IAiUsageQuotaId } from '@memoflow/contracts/primitives';

/**
 * AiUsageQuotaId 值对象
 * 用于强类型化 AI 使用配额 ID
 */
export const AiUsageQuotaId = createIdType<IAiUsageQuotaId>('IAiUsageQuotaId');
export type AiUsageQuotaId = IAiUsageQuotaId;
