export interface TaskTemplateHistoryServerDTO {
  id: string;
  templateId: string;
  action: string;
  changes: unknown;
  createdAt: number;
}
