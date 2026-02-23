import { z } from 'zod';

export const WorkflowSchema = z.object({
  autoSave: z.boolean().default(true),
  autoSaveInterval: z.number().min(1000).max(300000).default(30000),
  confirmBeforeDelete: z.boolean().default(true),
  defaultTaskView: z.enum(['LIST', 'KANBAN', 'CALENDAR']).default('LIST'),
  defaultGoalView: z.enum(['LIST', 'TREE', 'TIMELINE']).default('LIST'),
  defaultScheduleView: z.enum(['DAY', 'WEEK', 'MONTH']).default('WEEK'),
});
