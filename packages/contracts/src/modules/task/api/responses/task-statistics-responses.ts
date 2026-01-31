/**
 * Task Statistics Responses
 * 任务统计响应类型定义
 */

import type {
  TaskStatisticsServerDTO,
  TaskStatisticsClientDTO,
} from '../../aggregates';
import type { TaskTemplateStatus } from '../../value-objects/task-template-status';
import type { TaskInstanceStatus } from '../../value-objects/task-instance-status';
import type { TaskType } from '../../value-objects/task-type';
import type { ImportanceLevel } from '../../../../shared/index';

/**
 * 任务统计响应
 */
export interface TaskStatisticsResponse {
  statistics: TaskStatisticsServerDTO | TaskStatisticsClientDTO;
}

/**
 * 重新计算统计响应
 */
export interface RecalculateTaskStatisticsResponse {
  ok: boolean;
  message: string;
  statistics: TaskStatisticsServerDTO;
}

/**
 * 任务统计更新事件
 * 用于事件驱动的增量统计更新
 */
export interface TaskStatisticsUpdateEvent {
  type:
    | 'template.created'
    | 'template.deleted'
    | 'template.status_changed'
    | 'template.archived'
    | 'instance.created'
    | 'instance.deleted'
    | 'instance.completed'
    | 'instance.started'
    | 'instance.skipped'
    | 'instance.expired'
    | 'dependency.created'
    | 'dependency.deleted';
  accountUuid: string;
  timestamp: number;
  payload: {
    templateUuid?: string;
    instanceUuid?: string;
    previousStatus?: TaskTemplateStatus | TaskInstanceStatus;
    newStatus?: TaskTemplateStatus | TaskInstanceStatus;
    taskType?: TaskType;
    importance?: ImportanceLevel;
    duration?: number;
    rating?: number;
    [key: string]: any;
  };
}
