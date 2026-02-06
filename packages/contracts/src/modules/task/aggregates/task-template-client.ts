/**
 * TaskTemplate Aggregate Root - Client Interface
 */

import type {
  TaskTemplateId,
  IdentityId,
  GoalFolderId,
  DomainDate,
  TransferDate,
} from '@/primitives';

import type { TaskTemplateStatus } from '../value-objects/task-template-status';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import type {
  TaskTimeConfig,
  TaskTimeConfigDTO,
  RecurrenceRule,
  RecurrenceRuleDTO,
  TaskReminderConfig,
  TaskReminderConfigDTO,
  TaskGoalBinding,
  TaskGoalBindingDTO,
} from '../value-objects';

export interface TaskTemplateClientDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;

  timeConfig: TaskTimeConfigDTO;
  recurrenceRule: RecurrenceRuleDTO | null;
  reminderConfig: TaskReminderConfigDTO | null;
  importance: ImportanceLevel;

  priority?: number;
  goalBinding: TaskGoalBindingDTO | null;
  folderId: string | null;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate: TransferDate | null;
  generateAheadDays: number | null; // null for ONE_TIME tasks
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  history?: any[];
  instances?: any[];

  parentTaskId: string | null;
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

export interface TaskTemplateClient {
  id: TaskTemplateId;
  identityId: IdentityId;
  name: string;
  description: string | null;

  timeConfig: TaskTimeConfig;
  recurrenceRule: RecurrenceRule | null;
  reminderConfig: TaskReminderConfig | null;
  importance: ImportanceLevel;

  priority?: number;

  goalBinding: TaskGoalBinding | null;

  folderId: GoalFolderId | null;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate: DomainDate | null;
  generateAheadDays: number | null; // null for ONE_TIME tasks
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;

  parentTaskId: TaskTemplateId | null;
  startDate: DomainDate | null;
  dueDate: DomainDate | null;
  completedAt: DomainDate | null;
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
