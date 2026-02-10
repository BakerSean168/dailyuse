/**
 * Schedule Module - Domain Errors
 * 调度模块领域错误
 */

import { DomainError } from '@dailyuse/utils';
import type { SourceModule } from '@dailyuse/contracts/schedule';

/**
 * 调度策略未找到错误
 */
export class ScheduleStrategyNotFoundError extends DomainError {
  constructor(
    public readonly sourceModule: SourceModule,
    public override readonly context?: {
      availableModules?: SourceModule[];
      operationId?: string;
    },
  ) {
    super(
      'schedule_strategy_not_found',
      `调度策略未找到：${sourceModule}`,
    );
  }
}

/**
 * 源实体不需要调度错误
 */
export class SourceEntityNoScheduleRequiredError extends DomainError {
  constructor(
    public readonly sourceModule: SourceModule,
    public readonly sourceEntityId: string,
    public readonly reason?: string,
  ) {
    super(
      'source_entity_no_schedule_required',
      `源实体不需要调度：${sourceModule}/${sourceEntityId}${reason ? ` (${reason})` : ''}`,
    );
  }
}

/**
 * 调度任务创建失败错误
 */
export class ScheduleTaskCreationError extends DomainError {
  constructor(
    public readonly sourceModule: SourceModule,
    public readonly sourceEntityId: string,
    public override readonly originalError?: Error,
  ) {
    super(
      'schedule_task_creation_error',
      `调度任务创建失败：${sourceModule}/${sourceEntityId}${originalError ? ` - ${originalError.message}` : ''}`,
    );
  }
}

/**
 * 调度任务更新失败错误
 */
export class ScheduleTaskUpdateError extends DomainError {
  constructor(
    public readonly taskUuid: string,
    public override readonly originalError?: Error,
  ) {
    super(
      'schedule_task_update_error',
      `调度任务更新失败：${taskUuid}${originalError ? ` - ${originalError.message}` : ''}`,
    );
  }
}

/**
 * 调度任务未找到错误
 */
export class ScheduleTaskNotFoundError extends DomainError {
  constructor(taskUuid: string) {
    super('schedule_task_not_found', `调度任务未找到：${taskUuid}`);
  }
}

/**
 * 调度任务已禁用错误
 */
export class ScheduleTaskDisabledError extends DomainError {
  constructor(taskUuid: string) {
    super('schedule_task_disabled', `调度任务已禁用：${taskUuid}`);
  }
}

/**
 * 调度任务状态无效错误
 */
export class ScheduleTaskInvalidStatusError extends DomainError {
  constructor(taskUuid: string, currentStatus: string) {
    super(
      'schedule_task_invalid_status',
      `调度任务状态无效：${taskUuid} (当前状态: ${currentStatus})`,
    );
  }
}
