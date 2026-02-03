/**
 * Sync History Item DTO
 * 同步历史项目数据传输对象
 */

export interface SyncHistoryItem {
  syncSessionId: string;
  profileId: string;
  status: 'COMPLETED' | 'FAILED';
  startedAt: number;
  completedAt: number;
  changedItems: number;
  totalItems: number;
  duration: number; // milliseconds
  errors?: Array<{
    item: string;
    error: string;
  }>;
}
