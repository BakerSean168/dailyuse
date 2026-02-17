import type { ReminderTemplateClientDTO } from '../aggregates';

export interface ReminderTemplateSummaryDTO {
  id: string;
  title: string;
  nextReminderAt: number | null;
}

export interface ReminderDashboardDTO {
  templates: ReminderTemplateClientDTO[];
  totalTemplates: number;
}
