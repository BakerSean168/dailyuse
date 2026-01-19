import { DomainError } from '../../../shared/domain/errors/DomainError';

/**
 * Reminder 模块专用错误类
 */

/**
 * 提醒模板未找到错误
 */
export class ReminderTemplateNotFoundError extends DomainError {
  constructor(uuid: string, context: Record<string, any> = {}) {
    super(
      `Reminder template not found: ${uuid}`,
      'REMINDER_TEMPLATE_NOT_FOUND',
      { uuid, ...context },
    );
  }
}

/**
 * 提醒模板无效错误
 */
export class InvalidReminderTemplateError extends DomainError {
  constructor(
    message: string,
    context: Record<string, any> = {},
    originalError?: Error,
  ) {
    super(
      message,
      'INVALID_REMINDER_TEMPLATE',
      context,
      originalError,
    );
  }
}

/**
 * 提醒模板更新失败错误
 */
export class ReminderTemplateUpdateError extends DomainError {
  constructor(
    uuid: string,
    reason: string,
    context: Record<string, any> = {},
    originalError?: Error,
  ) {
    super(
      `Failed to update reminder template ${uuid}: ${reason}`,
      'REMINDER_TEMPLATE_UPDATE_FAILED',
      { uuid, reason, ...context },
      originalError,
    );
  }
}

/**
 * 提醒模板方法缺失错误
 */
export class ReminderTemplateMethodMissingError extends DomainError {
  constructor(
    methodName: string,
    templateInfo: Record<string, any>,
    context: Record<string, any> = {},
  ) {
    super(
      `Reminder template is missing required method: ${methodName}`,
      'REMINDER_TEMPLATE_METHOD_MISSING',
      {
        methodName,
        templateType: templateInfo.constructor,
        availableMethods: templateInfo.availableMethods,
        ...context,
      },
    );
  }
}

/**
 * 提醒触发错误
 */
export class ReminderTriggerError extends DomainError {
  constructor(
    message: string,
    context: Record<string, any> = {},
    originalError?: Error,
  ) {
    super(
      message,
      'REMINDER_TRIGGER_ERROR',
      context,
      originalError,
    );
  }
}

/**
 * 提醒调度错误
 */
export class ReminderScheduleError extends DomainError {
  constructor(
    message: string,
    context: Record<string, any> = {},
    originalError?: Error,
  ) {
    super(
      message,
      'REMINDER_SCHEDULE_ERROR',
      context,
      originalError,
    );
  }
}
