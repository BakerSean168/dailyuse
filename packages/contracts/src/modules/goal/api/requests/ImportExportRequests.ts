/**
 * Import Export Requests
 */

/**
 * 导出目标请求
 */
export interface ExportGoalsRequest {
  accountUuid: string;
  goalUuids?: string[];
  format: 'json' | 'csv' | 'markdown';
  includeKeyResults?: boolean;
  includeReviews?: boolean;
}

/**
 * 导入目标请求
 */
export interface ImportGoalsRequest {
  accountUuid: string;
  data: string | Uint8Array;
  format: 'json' | 'csv';
  folderUuid?: string;
  overwriteExisting?: boolean;
}
