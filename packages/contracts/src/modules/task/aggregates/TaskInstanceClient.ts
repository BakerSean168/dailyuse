/**
 * TaskInstance Aggregate Root - Client Interface
 */

import type { TaskInstanceServerDTO } from './TaskInstanceServer';
import type { TaskInstanceStatus } from '../enums';
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
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number;
  timeConfig: TaskTimeConfigClientDTO;
  /**
   * 任务重要性级别 (继承自 TaskTemplate)
   * Story 1.1+: 用户设置的重要性，用于优先级计算
   */
  importance?: ImportanceLevel;
  /**
   * 优先级分数 (0-100)
   * 由系统根据 importance + dueDate 动态计算
   * @readonly 此字段不能直接修改，计算由 Application Layer 负责
   * @computed 基于 Story 1.3 算法计算得出
   */
  priority?: number;
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

export interface TaskInstanceClient {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number;
  timeConfig: TaskTimeConfigClient;
  /**
   * 任务重要性级别 (继承自 TaskTemplate)
   * Story 1.1+: 用户设置的重要性，用于优先级计算
   */
  importance?: ImportanceLevel;
  /**
   * 优先级分数 (0-100)
   * 由系统根据 importance + dueDate 动态计算
   * @readonly 此字段不能直接修改，计算由 Application Layer 负责
   * @computed 基于 Story 1.3 算法计算得出
   */
  priority?: number;
  status: TaskInstanceStatus;
  completionRecord?: CompletionRecordClient | null;
  skipRecord?: SkipRecordClient | null;
  actualStartTime?: number | null;
  actualEndTime?: Date | null;
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;
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

  getStatusBadge(): { text: string; color: string };
  getStatusIcon(): string;
  canStart(): boolean;
  canComplete(): boolean;
  canSkip(): boolean;

  toClientDTO(): TaskInstanceClientDTO;
  toServerDTO(): TaskInstanceServerDTO;
}

export interface TaskInstanceClientStatic {
  fromClientDTO(dto: TaskInstanceClientDTO): TaskInstanceClient;
  fromServerDTO(dto: TaskInstanceServerDTO): TaskInstanceClient;
  forCreate(templateUuid: string, accountUuid: string, instanceDate: number): TaskInstanceClient;
}

export interface TaskInstanceClientInstance extends TaskInstanceClient {
  clone(): TaskInstanceClient;
}
