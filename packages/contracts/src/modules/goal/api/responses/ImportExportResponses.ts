/**
 * Import Export Responses
 */

/**
 * 导出响应
 */
export interface ExportGoalsResponse {
  data: string | Uint8Array;
  filename: string;
  mimeType: string;
}

/**
 * 导入响应
 */
export interface ImportGoalsResponse {
  importedCount: number;
  skippedCount: number;
  errors?: Array<{
    line: number;
    error: string;
  }>;
}
