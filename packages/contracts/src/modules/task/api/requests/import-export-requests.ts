/**
 * Import/Export Requests
 * 导入导出请求类型定义
 */

/**
 * 导出任务模板请求
 */
export interface ExportTaskTemplatesRequest {
  accountUuid: string;
  templateUuids?: string[];
  format: 'json' | 'csv' | 'markdown';
  includeInstances?: boolean;
  includeHistory?: boolean;
}

/**
 * 导入任务模板请求
 */
export interface ImportTaskTemplatesRequest {
  accountUuid: string;
  data: string | Uint8Array;
  format: 'json' | 'csv';
  folderUuid?: string;
  overwriteExisting?: boolean;
}
