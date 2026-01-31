/**
 * TaskInstance Aggregate Root - Client Interface
 */

import type {
  TaskInstanceId,
  TaskTemplateId,
  IdentityId,
  DomainDate,
  TransferDate,
} from '@/primitives';
import type { TaskInstanceServerDTO } from './task-instance-server';
import type { TaskInstanceStatus } from '../value-objects/task-instance-status';
import { ImportanceLevel } from '../../../shared/importance';
import type {
  TaskTimeConfigClient,
  TaskTimeConfigClientDTO,
  CompletionRecordClient,
  CompletionRecordClientDTO,
  SkipRecordClient,
  SkipRecordClientDTO,
} from '../value-objects';

export interface TaskInstanceClientDTO {
  id: string;
  templateId: string;
  identityId: string;
  instanceDate: TransferDate;
  timeConfig: TaskTimeConfigClientDTO;
  /**
   * 任务重要性级�?(继承�?TaskTemplate)
   * Story 1.1+: 用户设置的重要性，用于优先级计�?
   */
  importance?: ImportanceLevel;
  /**
   * 优先级分�?(0-100)
   * 由系统根�?importance + dueDate 动态计�?
   * @readonly 此字段不能直接修改，计算�?Application Layer 负责
   * @computed 基于 Story 1.3 算法计算得出
   */
  priority?: number;
  status: TaskInstanceStatus;
  completionRecord: CompletionRecordClientDTO | null;
  skipRecord: SkipRecordClientDTO | null;
  actualStartTime: TransferDate | null;
  actualEndTime: TransferDate | null;
  note: string | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  instanceDateFormatted: string;
  statusText: string;
  statusColor: string;
  isCompleted: boolean;
  isSkipped: boolean;
  isPending: boolean;
  isExpired: boolean;
  hasNote: boolean;
  actualDuration: number | null;
  durationText: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

export interface TaskInstanceClient {
  id: TaskInstanceId;
  templateId: TaskTemplateId;
  identityId: IdentityId;
  instanceDate: DomainDate;
  timeConfig: TaskTimeConfigClient;
  /**
   * 任务重要性级�?(继承�?TaskTemplate)
   * Story 1.1+: 用户设置的重要性，用于优先级计�?
   */
  importance?: ImportanceLevel;
  /**
   * 优先级分�?(0-100)
   * 由系统根�?importance + dueDate 动态计�?
   * @readonly 此字段不能直接修改，计算�?Application Layer 负责
   * @computed 基于 Story 1.3 算法计算得出
   */
  priority?: number;
  status: TaskInstanceStatus;
  completionRecord: CompletionRecordClient | null;
  skipRecord: SkipRecordClient | null;
  actualStartTime: DomainDate | null;
  actualEndTime: DomainDate | null;
  note: string | null;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  instanceDateFormatted: string;
  statusText: string;
  statusColor: string;
  isCompleted: boolean;
  isSkipped: boolean;
  isPending: boolean;
  isExpired: boolean;
  hasNote: boolean;
  actualDuration: number | null;
  durationText: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;

  getStatusBadge(): { text: string; color: string };
  getStatusIcon(): string;
  canStart(): boolean;
  canComplete(): boolean;
  canSkip(): boolean;
}
