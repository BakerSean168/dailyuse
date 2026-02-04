/**
 * Task Module - Domain Errors
 * 任务模块领域错误
 */

import { DomainError } from '@dailyuse/utils';

/**
 * 任务模板未找到错误
 */
export class TaskTemplateNotFoundError extends DomainError {
  constructor(templateId: string) {
    super('task_template_not_found', `任务模板未找到：${templateId}`);
  }
}

/**
 * 任务模板状态无效错误
 */
export class InvalidTaskTemplateStateError extends DomainError {
  constructor(templateId: string, currentState: string, expectedState: string) {
    super(
      'invalid_task_template_state',
      `任务模板状态无效：${templateId}，当前状态 ${currentState}，期望 ${expectedState}`,
    );
  }
}

/**
 * 任务模板已归档错误
 */
export class TaskTemplateArchivedError extends DomainError {
  constructor(templateId: string) {
    super('task_template_archived', `任务模板已归档：${templateId}`);
  }
}

/**
 * 重复规则未实现错误
 */
export class RecurrenceRuleNotImplementedError extends DomainError {
  constructor(ruleType: string) {
    super(
      'recurrence_rule_not_implemented',
      `重复规则未实现：${ruleType}`,
    );
  }
}

/**
 * 目标绑定无效错误
 */
export class InvalidGoalBindingError extends DomainError {
  constructor(reason: string) {
    super('invalid_goal_binding', `目标绑定无效：${reason}`);
  }
}

/**
 * 日期范围无效错误
 */
export class InvalidDateRangeError extends DomainError {
  constructor(startDate: Date, endDate: Date) {
    super(
      'invalid_date_range',
      `日期范围无效：开始日期 ${startDate.toISOString()} 晚于结束日期 ${endDate.toISOString()}`,
    );
  }
}

/**
 * 实例生成失败错误
 */
export class InstanceGenerationFailedError extends DomainError {
  constructor(templateId: string, reason?: string) {
    super(
      'instance_generation_failed',
      `任务实例生成失败：${templateId}${reason ? ` - ${reason}` : ''}`,
    );
  }
}

/**
 * 任务实例未找到错误
 */
export class TaskInstanceNotFoundError extends DomainError {
  constructor(instanceId: string) {
    super('task_instance_not_found', `任务实例未找到：${instanceId}`);
  }
}

/**
 * 任务实例已完成错误
 */
export class TaskInstanceAlreadyCompletedError extends DomainError {
  constructor(instanceId: string) {
    super('task_instance_already_completed', `任务实例已完成：${instanceId}`);
  }
}
