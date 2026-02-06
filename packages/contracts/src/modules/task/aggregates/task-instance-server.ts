/**
 * TaskInstance Aggregate Root - Server Interface
 * 任务实例聚合根
 * 
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
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
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import type {
  TaskTimeConfig,
  TaskTimeConfigDTO,
  CompletionRecord,
  CompletionRecordDTO,
} from '../value-objects';


// ============ 聚合根接口 ============

export interface TaskInstanceServer {
  id: TaskInstanceId;
  templateId: TaskTemplateId;
  identityId: IdentityId;
  
  importance: ImportanceLevel;
  priority?: number;

  status: TaskInstanceStatus;
  actualStartTime: DomainDate | null;
  actualEndTime: DomainDate | null;

  instanceDate: DomainDate;
  timeConfig: TaskTimeConfig;
  
  comment: string | null;
  
  // 同步字段
  version: number;
  createdAt: DomainDate;
  updatedAt: DomainDate;
  deletedAt: DomainDate | null;
}

// ============ DTO 定义 ============

/**
 * TaskInstance Server DTO
 */
export interface TaskInstanceServerDTO {
  id: string;
  templateId: string;
  identityId: string;

  importance: ImportanceLevel;
  priority?: number;

  status: TaskInstanceStatus;
  actualStartTime: TransferDate | null;
  actualEndTime: TransferDate | null;

  instanceDate: TransferDate;
  timeConfig: TaskTimeConfigDTO;
  
  comment: string | null;
  
  // 同步字段
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
}

/**
 * TaskInstance Persistence DTO
 */
export interface TaskInstancePersistenceDTO {
  id: string;
  templateId: string;
  identityId: string;

  importance: string;
  priority?: number;

  instanceDate: PersistenceDate;
  timeConfig: string; // JSON
  
  status: string;
  actualStartTime: PersistenceDate | null;
  actualEndTime: PersistenceDate | null;
  
  comment: string | null;
  
  // 同步字段
  version: number;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
  deletedAt: PersistenceDate | null;
}


