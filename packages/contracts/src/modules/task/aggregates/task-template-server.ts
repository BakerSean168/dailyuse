/**
 * TaskTemplate Aggregate Root - Server Interface
 */

import type {
  TaskTemplateId,
  IdentityId,
  TaskFolderId,
  TransferDate,
} from '../../../primitives';
import type { TaskTemplateStatus } from '../value-objects/task-template-status';
import type { TaskInstanceServerDTO } from './task-instance-server';
import type {
  TaskTimeConfigDTO,
  RecurrenceRuleDTO,
  TaskReminderConfigDTO,
  TaskGoalBindingDTO,
  ChecklistItemDefinitionDTO,
} from '../value-objects';

// Import shared types
import { ImportanceLevel } from '../../../shared/value-objects/importance';

// ============ DTO Definitions ============

/**
 * TaskTemplate Server DTO
 */
export interface TaskTemplateServerDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;

  timeConfig: TaskTimeConfigDTO | null;
  recurrenceRule: RecurrenceRuleDTO | null;
  reminderConfig: TaskReminderConfigDTO | null;
  lastGeneratedDate: TransferDate | null;
  generateAheadDays: number | null;

  importance: ImportanceLevel;
  priority?: number;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;

  goalBinding: TaskGoalBindingDTO | null;

  parentTaskId: string | null;
  checklist: ChecklistItemDefinitionDTO[]; // To be defined later

  dependencyStatus?: string; // 'NONE' | 'WAITING' | 'READY' | 'BLOCKED'
  isBlocked?: boolean;
  blockingReason: string | null;

  // === Other ===
  folderId: string | null;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  instances?: TaskInstanceServerDTO[];
}
