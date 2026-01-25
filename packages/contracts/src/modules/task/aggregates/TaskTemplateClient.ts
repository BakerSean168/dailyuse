/**
 * TaskTemplate Aggregate Root - Client Interface
 */

import type { TaskTemplateServerDTO } from './TaskTemplateServer';
import type { TaskType, TaskTemplateStatus } from '../enums';
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
import type { TaskInstanceClient } from './TaskInstanceClient';

export interface TaskTemplateClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  taskType: TaskType;
  timeConfig: any;
  recurrenceRule?: any | null;
  reminderConfig?: any | null;
  importance: ImportanceLevel;
  /**
   * 浼樺厛绾у垎鏁?(0-100)
   * 鐢辩郴缁熸牴鎹?importance + dueDate 鍔ㄦ€佽绠?
   * @readonly 姝ゅ瓧娈典笉鑳界洿鎺ヤ慨鏀癸紝璁＄畻鐢?Application Layer 璐熻矗
   * @computed 鍩轰簬 Story 1.3 绠楁硶璁＄畻寰楀嚭
   */
  priority?: number;
  goalBinding?: any | null;
  folderUuid?: string | null;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate?: number | null;
  generateAheadDays: number | null; // null for ONE_TIME tasks
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
  history?: any[];
  instances?: any[];
  // ONE_TIME task fields
  goalUuid?: string | null;
  keyResultUuid?: string | null;
  parentTaskUuid?: string | null;
  startDate?: number | null;
  dueDate?: number | null;
  completedAt?: number | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  note?: string | null;
  dependencyStatus?: string;
  isBlocked?: boolean;
  blockingReason?: string | null;
  instanceCount: number;
  completedInstanceCount: number;
  pendingInstanceCount: number;
  completionRate: number;
}

export interface TaskTemplateClient {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  taskType: TaskType;
  timeConfig: TaskTimeConfigClient;
  recurrenceRule?: RecurrenceRuleClient | null;
  reminderConfig?: TaskReminderConfigClient | null;
  importance: ImportanceLevel;
  /**
   * 浼樺厛绾у垎鏁?(0-100)
   * 鐢辩郴缁熸牴鎹?importance + dueDate 鍔ㄦ€佽绠?
   * @readonly 姝ゅ瓧娈典笉鑳界洿鎺ヤ慨鏀癸紝璁＄畻鐢?Application Layer 璐熻矗
   * @computed 鍩轰簬 Story 1.3 绠楁硶璁＄畻寰楀嚭
   */
  priority?: number;
  goalBinding?: TaskGoalBindingClient | null;
  folderUuid?: string | null;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  lastGeneratedDate?: number | null;
  generateAheadDays: number | null; // null for ONE_TIME tasks
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  instances?: TaskInstanceClient[];
  // ONE_TIME task fields
  goalUuid?: string | null;
  keyResultUuid?: string | null;
  parentTaskUuid?: string | null;
  startDate?: Date | null;
  dueDate?: number | null;
  completedAt?: Date | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  note?: string | null;
  dependencyStatus?: string;
  isBlocked?: boolean;
  blockingReason?: string | null;
  instanceCount: number;
  completedInstanceCount: number;
  pendingInstanceCount: number;
  completionRate: number;

  getDisplayTitle(): string;
  getStatusBadge(): { text: string; color: string };
  getImportanceBadge(): { text: string; color: string };
  getTimeDisplay(): string;
  getRecurrenceDisplay(): string;
  canEdit(): boolean;
  canDelete(): boolean;
  canPause(): boolean;
  canActivate(): boolean;
  canArchive(): boolean;
  isOneTime(): boolean;
  isRecurring(): boolean;
  createInstance(params: any): string;
  addInstance(instance: any): void;
  removeInstance(instanceUuid: string): any | null;
  getInstance(instanceUuid: string): any | null;
  getAllInstances(): any[];

  toClientDTO(includeChildren?: boolean): TaskTemplateClientDTO;
  toServerDTO(includeChildren?: boolean): TaskTemplateServerDTO;
}

export interface TaskTemplateClientStatic {
  fromClientDTO(dto: TaskTemplateClientDTO): TaskTemplateClient;
  fromServerDTO(dto: TaskTemplateServerDTO): TaskTemplateClient;
  forCreate(accountUuid: string): TaskTemplateClient;
  create(params: any): TaskTemplateClient;
}

export interface TaskTemplateClientInstance extends TaskTemplateClient {
  clone(): TaskTemplateClient;
}
