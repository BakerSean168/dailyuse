export interface TaskTemplateHistoryClientDTO {
  id: string;
  templateId: string;
  action: string;
  changes: unknown;
  createdAt: number;
}
