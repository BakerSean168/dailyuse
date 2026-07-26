import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { GoalId, Instant, KeyResultId } from '@dailyuse/contracts/primitives';
import type { IdentityId } from '@dailyuse/domain-shared';
import type { DependencyStatus, TaskType } from '../value-objects';
import type { TaskTemplateStatus } from '../../domain/value-objects/task-template-status';
import type { TaskTemplateId } from '../../domain/value-objects/task-template-id';
import type { TaskFolderId } from '../../domain/value-objects/task-folder-id';
import type {
  ChecklistItemDefinition,
  RecurrenceRule,
  TaskGoalBinding,
  TaskReminderConfig,
  TaskTimeConfig,
} from '../value-objects';

export interface TaskTemplateState {
  id: TaskTemplateId;
  identityId: IdentityId;
  title: string;
  description: string | null;
  taskType: TaskType;
  importance: ImportanceLevel;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;
  folderId: TaskFolderId | null;
  goalId: GoalId | null;
  keyResultId: KeyResultId | null;
  goalBinding: TaskGoalBinding | null;
  checklist: ChecklistItemDefinition[];
  parentTaskId: TaskTemplateId | null;
  timeConfig: TaskTimeConfig | null;
  recurrenceRule: RecurrenceRule | null;
  reminderConfig: TaskReminderConfig | null;
  lastGeneratedDate: Instant | null;
  generateAheadDays: number | null;
  startDate: Instant | null;
  dueDate: Instant | null;
  completedAt: Instant | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  note: string | null;
  dependencyStatus: DependencyStatus;
  isBlocked: boolean;
  blockingReason: string | null;
  createdAt: Instant;
  updatedAt: Instant;
  deletedAt: Instant | null;
  version: number;
}

export type TaskTemplateProps = Omit<TaskTemplateState, 'id'>;
