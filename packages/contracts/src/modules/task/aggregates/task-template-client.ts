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
import type { TaskPlanOutcome } from '../value-objects/task-plan-outcome';
import type { TaskPlanCompletionPolicy } from '../value-objects/task-plan-completion-policy';
import type { TaskInstanceStatus } from '../value-objects/task-instance-status';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import type {
  TaskTimeConfigDTO,
  RecurrenceRuleDTO,
  TaskReminderConfigDTO,
  TaskGoalBindingDTO,
} from '../value-objects';

// Residual 879: intentional Client≠Server dual (client extra projection fields vs server checklist).
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
  outcome: TaskPlanOutcome;
  completionPolicy: TaskPlanCompletionPolicy;
  closedAt: TransferDate | null;
  archivedAt: TransferDate | null;
  abandonedReason: string | null;
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
  dueInstanceCount: number;
  completedDueInstanceCount: number;
  completionWindowDays: 30;
  futurePendingInstanceCount: number;
  singleInstanceStatus: TaskInstanceStatus | null;
  completionRate: number;
}
