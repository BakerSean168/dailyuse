/**
 * TaskTemplate Aggregate Root - Client Interface
 */

import type {
  TaskTemplateId,
  TaskInstanceId,
  IdentityId,
  GoalId,
  KeyResultId,
  GoalFolderId,
  DomainDate,
  TransferDate,
} from '@/primitives';
import type { TaskTemplateServerDTO } from './task-template-server';
import type { TaskType } from '../value-objects/task-type';
import type { TaskTemplateStatus } from '../value-objects/task-template-status';
import { ImportanceLevel } from '../../../shared/importance';
import type {
  TaskTimeConfigClient,
  TaskTimeConfigClientDTO,
  RecurrenceRuleClient,
  RecurrenceRuleClientDTO,
  TaskReminderConfigClient,
  TaskReminderConfigClientDTO,
  TaskGoalBindingClient,
  TaskGoalBindingClientDTO,
} from '../value-objects';
import type { TaskInstanceClient } from './task-instance-client';

export interface TaskTemplateClientDTO {
  id: string;
  identityId: string;
  name: string;
  description: string | null;
  taskType: TaskType;
  timeConfig: any;
  recurrenceRule: any | null;
  reminderConfig: any | null;
  importance: ImportanceLevel;

  priority?: number;
  goalBinding: any | null;
  folderId: string | null;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate: TransferDate | null;
  generateAheadDays: number | null; // null for ONE_TIME tasks
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  history?: any[];
  instances?: any[];
  // ONE_TIME task fields
  goalId: string | null;
  keyResultId: string | null;
  parentTaskId: string | null;
  startDate: TransferDate | null;
  dueDate: TransferDate | null;
  completedAt: TransferDate | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  note: string | null;
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
  taskType: TaskType;
  timeConfig: TaskTimeConfigClient;
  recurrenceRule: RecurrenceRuleClient | null;
  reminderConfig: TaskReminderConfigClient | null;
  importance: ImportanceLevel;
  /**
   * 浼樺厛绾у垎鏁?(0-100)
   * 鐢辩郴缁熸牴�?importance + dueDate 鍔ㄦ€佽绠?
   * @readonly 姝ゅ瓧娈典笉鑳界洿鎺ヤ慨鏀癸紝璁＄畻鐢?Application Layer 璐熻�?
   * @computed 鍩轰�?Story 1.3 绠楁硶璁＄畻寰楀�?
   */
  priority?: number;
  goalBinding: TaskGoalBindingClient | null;
  folderId: GoalFolderId | null;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate: DomainDate | null;
  generateAheadDays: number | null; // null for ONE_TIME tasks
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
  instances?: TaskInstanceClient[];
  // ONE_TIME task fields
  goalId: GoalId | null;
  keyResultId: KeyResultId | null;
  parentTaskId: TaskTemplateId | null;
  startDate: DomainDate | null;
  dueDate: DomainDate | null;
  completedAt: DomainDate | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  note: string | null;
  dependencyStatus?: string;
  isBlocked?: boolean;
  blockingReason: string | null;
  instanceCount: number;
  completedInstanceCount: number;
  pendingInstanceCount: number;
  completionRate: number;

  toClientDTO(includeChildren?: boolean): TaskTemplateClientDTO;
  toServerDTO(includeChildren?: boolean): TaskTemplateServerDTO;
}
