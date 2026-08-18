/**
 * Reminder 相关错误类
 * 用于提醒应用服务
 *
 * 继承自 contracts/result 的 ResultErrorException 基类，统一错误码、上下文与 HTTP 状态语义，
 * 与 goal 等其他 feature 的领域错误保持一致。
 */

import { ResultErrorException } from '@memoflow/contracts/result';

/**
 * 提醒模板未找到
 */
export class ReminderTemplateNotFoundError extends ResultErrorException {
  constructor(templateId: string, operationId?: string) {
    super(
      `提醒模板不存在: ${templateId}`,
      'REMINDER_TEMPLATE_NOT_FOUND',
      undefined,
      { templateId, ...(operationId ? { operationId } : {}) },
      404,
    );
  }
}

/**
 * 提醒模板更新失败
 */
export class ReminderTemplateUpdateError extends ResultErrorException {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'REMINDER_TEMPLATE_UPDATE_FAILED', undefined, context, 400);
  }
}

/**
 * 提醒模板方法缺失
 */
export class ReminderTemplateMethodMissingError extends ResultErrorException {
  constructor(methodName: string, context?: Record<string, unknown>) {
    super(
      `提醒模板方法缺失: ${methodName}`,
      'REMINDER_TEMPLATE_METHOD_MISSING',
      undefined,
      { methodName, ...context },
      500,
    );
  }
}

/**
 * 保存提醒模板失败
 */
export class ReminderTemplateSaveError extends ResultErrorException {
  constructor(message: string, context?: Record<string, unknown>) {
    super(`保存提醒模板失败: ${message}`, 'REMINDER_TEMPLATE_SAVE_FAILED', undefined, context, 500);
  }
}

/**
 * 无效时区（fail-fast）
 * 用于提醒触发时间计算：无效 IANA 时区应立刻失败，而不是被计算逻辑吞掉。
 * 控制流用 instanceof 判断，不依赖消息文本。
 */
export class InvalidTimezoneError extends Error {
  constructor(timezone: string) {
    super(`Invalid or unknown timezone: "${timezone}"`);
    this.name = 'InvalidTimezoneError';
  }
}
