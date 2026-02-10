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
