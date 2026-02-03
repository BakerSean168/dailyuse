/**
 * Account Data Export/Import DTO
 * 账户数据导出/导入相关数据传输对象
 */

export interface ExportAccountDataDTO {
  data: string;
  filename: string;
  mimeType: string;
}

export interface ImportAccountDataResultDTO {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors?: Array<{
    item: string;
    error: string;
  }>;
}
