import type { AIUsageQuotaServerDTO } from '@dailyuse/contracts/ai';

export class AiUsageQuotaSqliteMapper {
  static toDTO(row: any): AIUsageQuotaServerDTO {
    return {
      id: row.id,
      identityId: row.identity_id,
      quotaLimit: row.quota_limit,
      currentUsage: row.current_usage,
      resetPeriod: row.reset_period,
      lastResetAt: row.last_reset_at,
      nextResetAt: row.next_reset_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
