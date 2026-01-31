/**
 * Import/Export Responses
 * 导入导出响应类型定义
 */

/**
 * 导出响应
 */
export interface ExportTaskTemplatesResponse {
  data: string | Uint8Array;
  filename: string;
  mimeType: string;
}

/**
 * 导入响应
 */
export interface ImportTaskTemplatesResponse {
  importedCount: number;
  skippedCount: number;
  errors?: Array<{
    line: number;
    error: string;
  }>;
}
