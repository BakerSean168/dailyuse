/**
 * TaskInstance Aggregate Root - Server Interface
 * 任务实例聚合�?
 */

import type {
  TaskInstanceId,
  TaskTemplateId,
  IdentityId,
  DomainDate,
  TransferDate,
  PersistenceDate,
} from '@/primitives';
import type { TaskInstanceStatus } from '../value-objects/task-instance-status';
import { ImportanceLevel } from '../../../shared/importance';
import type {
  TaskTimeConfigServer,
  TaskTimeConfigServerDTO,
  TaskTimeConfigClientDTO,
  CompletionRecordServer,
  CompletionRecordServerDTO,
  CompletionRecordClientDTO,
  SkipRecordServer,
  SkipRecordServerDTO,
  SkipRecordClientDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * TaskInstance Client DTO (声明，实际定义在 Client 文件)
 */
export interface TaskInstanceClientDTO {
  id: string;
  templateId: string;
  identityId: string;
  instanceDate: TransferDate;
  timeConfig: TaskTimeConfigClientDTO;
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

/**
 * TaskInstance Server DTO
 */
export interface TaskInstanceServerDTO {
  id: string;
  templateId: string;
  identityId: string;
  instanceDate: TransferDate;
  timeConfig: TaskTimeConfigServerDTO;
  /**
   * 任务重要性级�?(继承�?TaskTemplate)
   * Story 1.1+: 用户设置的重要性，用于优先级计�?
   */
  importance: ImportanceLevel;
  /**
   * 优先级分�?(0-100)
   * 由系统根�?importance + dueDate 动态计�?
   * @readonly 此字段不能直接修改，计算�?Application Layer 负责
   * @computed 基于 Story 1.3 算法计算得出
   */
  priority?: number;
  status: TaskInstanceStatus;
  completionRecord: CompletionRecordServerDTO | null;
  skipRecord: SkipRecordServerDTO | null;
  actualStartTime: TransferDate | null;
  actualEndTime: TransferDate | null;
  note: string | null;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * TaskInstance Persistence DTO
 */
export interface TaskInstancePersistenceDTO {
  id: string;
  templateId: string;
  identityId: string;
  instanceDate: PersistenceDate;
  timeConfig: string; // JSON
  importance: string;
  priority?: number;
  status: string;
  completionRecord: string | null; // JSON
  skipRecord: string | null; // JSON
  actualStartTime: PersistenceDate | null;
  actualEndTime: PersistenceDate | null;
  note: string | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

// ============ 聚合根接�?============

export interface TaskInstanceServer {
  id: TaskInstanceId;
  templateId: TaskTemplateId;
  identityId: IdentityId;
  instanceDate: DomainDate;
  timeConfig: TaskTimeConfigServer;
  importance: ImportanceLevel;
  priority?: number;
  status: TaskInstanceStatus;
  completionRecord: CompletionRecordServer | null;
  skipRecord: SkipRecordServer | null;
  actualStartTime: DomainDate | null;
  actualEndTime: DomainDate | null;
  note: string | null;
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // 状态转�?

  // 业务判断

  // DTO 转换
}
