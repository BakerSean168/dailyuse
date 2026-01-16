/**
 * TaskInstance Aggregate Root - Server Interface
 * 任务实例聚合根
 */

import type { TaskInstanceStatus } from '../enums';
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
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number;
  timeConfig: TaskTimeConfigClientDTO;
  status: TaskInstanceStatus;
  completionRecord?: CompletionRecordClientDTO | null;
  skipRecord?: SkipRecordClientDTO | null;
  actualStartTime?: number | null;
  actualEndTime?: number | null;
  note?: string | null;
  createdAt: number;
  updatedAt: number;
  instanceDateFormatted: string;
  statusText: string;
  statusColor: string;
  isCompleted: boolean;
  isSkipped: boolean;
  isPending: boolean;
  isExpired: boolean;
  hasNote: boolean;
  actualDuration?: number | null;
  durationText?: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * TaskInstance Server DTO
 */
export interface TaskInstanceServerDTO {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number; // epoch ms
  timeConfig: TaskTimeConfigServerDTO;
  /**
   * 任务重要性级别 (继承自 TaskTemplate)
   * Story 1.1+: 用户设置的重要性，用于优先级计算
   */
  importance: ImportanceLevel;
  /**
   * 优先级分数 (0-100)
   * 由系统根据 importance + dueDate 动态计算
   * @readonly 此字段不能直接修改，计算由 Application Layer 负责
   * @computed 基于 Story 1.3 算法计算得出
   */
  priority?: number;
  status: TaskInstanceStatus;
  completionRecord?: CompletionRecordServerDTO | null;
  skipRecord?: SkipRecordServerDTO | null;
  actualStartTime?: number | null;
  actualEndTime?: number | null;
  note?: string | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * TaskInstance Persistence DTO
 */
export interface TaskInstancePersistenceDTO {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number;
  timeConfig: string; // JSON
  importance: string;
  priority?: number;
  status: string;
  completionRecord?: string | null; // JSON
  skipRecord?: string | null; // JSON
  actualStartTime?: number | null;
  actualEndTime?: number | null;
  note?: string | null;
  createdAt: number;
  updatedAt: number;
}

// ============ 聚合根接口 ============

export interface TaskInstanceServer {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number;
  timeConfig: TaskTimeConfigServer;
  importance: ImportanceLevel;
  priority?: number;
  status: TaskInstanceStatus;
  completionRecord?: CompletionRecordServer | null;
  skipRecord?: SkipRecordServer | null;
  actualStartTime?: number | null;
  actualEndTime?: number | null;
  note?: string | null;
  createdAt: number;
  updatedAt: number;

  // 状态转换
  start(): void;
  complete(actualDuration?: number, note?: string, rating?: number): void;
  skip(reason?: string): void;
  markExpired(): void;

  // 业务判断
  canStart(): boolean;
  canComplete(): boolean;
  canSkip(): boolean;
  isOverdue(): boolean;

  // DTO 转换
  toServerDTO(): TaskInstanceServerDTO;
  toClientDTO(): TaskInstanceClientDTO;
  toPersistenceDTO(): TaskInstancePersistenceDTO;
}
