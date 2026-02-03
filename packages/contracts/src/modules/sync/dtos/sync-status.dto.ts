/**
 * Sync Status DTO
 * 同步状态数据传输对象
 */

export interface SyncStatusDTO {
  syncSessionId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number;
  totalItems: number;
  processedItems: number;
  changedItems: number;
  startedAt: number;
  completedAt?: number;
  errors?: Array<{
    item: string;
    error: string;
  }>;
}
