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
  createdAt: DomainDate;
  updatedAt: DomainDate;
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

  importance: string;
  priority?: number;

  instanceDate: PersistenceDate;
  timeConfig: string; // JSON
  
  status: string;
  actualStartTime: PersistenceDate | null;
  actualEndTime: PersistenceDate | null;
  
  comment: string | null;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}


