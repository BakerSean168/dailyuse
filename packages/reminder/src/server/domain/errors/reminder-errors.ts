/**
 * Reminder 相关错误类
 * 用于提醒应用服务
 *
 * 继承自 @dailyuse/utils 的 DomainError 基类，统一错误码、上下文与 HTTP 状态语义，
 * 与 setting/governance 等其他 feature 的领域错误保持一致，避免各自扩展裸 Error。
 */

import { DomainError } from '@dailyuse/utils/errors';

/**
 * 提醒模板未找到
 */
export class ReminderTemplateNotFoundError extends DomainError {
  constructor(templateId: string, operationId?: string) {
    super(
      'REMINDER_TEMPLATE_NOT_FOUND',
      `提醒模板不存在: ${templateId}`,
      { templateId },
      404,
      { operationId },
    );
  }
}

/**
 * 提醒模板更新失败
 */
export class ReminderTemplateUpdateError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('REMINDER_TEMPLATE_UPDATE_FAILED', message, context, 400);
  }
}

/**
 * 提醒模板方法缺失
 */
export class ReminderTemplateMethodMissingError extends DomainError {
  constructor(methodName: string, context?: Record<string, unknown>) {
    super(
      'REMINDER_TEMPLATE_METHOD_MISSING',
      `提醒模板方法缺失: ${methodName}`,
      { methodName, ...context },
      500,
    );
  }
}

/**
 * 保存提醒模板失败
 */
export class ReminderTemplateSaveError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('REMINDER_TEMPLATE_SAVE_FAILED', `保存提醒模板失败: ${message}`, context, 500);
  }
}
