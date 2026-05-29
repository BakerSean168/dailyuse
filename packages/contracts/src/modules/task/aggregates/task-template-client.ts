/**
 * TaskTemplate Aggregate Root - Client Interface
 */

import type {
  TaskTemplateId,
  IdentityId,
  TaskFolderId,
  TransferDate,
} from '../../../primitives';

import type { TaskTemplateStatus } from '../value-objects/task-template-status';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import type {
  TaskTimeConfigDTO,
  RecurrenceRuleDTO,
  TaskReminderConfigDTO,
  TaskGoalBindingDTO,
} from '../value-objects';

export interface TaskTemplateClientDTO {
  id: TaskTemplateId;
  identityId: IdentityId;
  name: string;
  description: string | null;

  timeConfig: TaskTimeConfigDTO;
  recurrenceRule: RecurrenceRuleDTO | null;
  reminderConfig: TaskReminderConfigDTO | null;
  importance: ImportanceLevel;

  priority?: number;
  goalBinding: TaskGoalBindingDTO | null;
  folderId: TaskFolderId | null;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate: TransferDate | null;
  generateAheadDays: number | null; // null for ONE_TIME tasks
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  history?: unknown[];
  instances?: unknown[];

  parentTaskId: TaskTemplateId | null;
  startDate: TransferDate | null;
  dueDate: TransferDate | null;
  completedAt: TransferDate | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  comment: string | null;
  dependencyStatus?: string;
  isBlocked?: boolean;
  blockingReason: string | null;
  instanceCount: number;
  completedInstanceCount: number;
  pendingInstanceCount: number;
  completionRate: number;
}
