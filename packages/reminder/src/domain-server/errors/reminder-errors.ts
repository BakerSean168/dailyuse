/**
 * Reminder 相关错误类
 * 用于提醒应用服务
 */

export class ReminderTemplateNotFoundError extends Error {
  constructor(templateId: string, operationId?: string) {
    const message = operationId 
      ? `提醒模板不存在: ${templateId} (操作: ${operationId})`
      : `提醒模板不存在: ${templateId}`;
    super(message);
    this.name = 'ReminderTemplateNotFoundError';
  }
}

export class ReminderTemplateUpdateError extends Error {
  constructor(message: string, context?: any) {
    const fullMessage = context 
      ? `${message} - ${JSON.stringify(context)}`
      : message;
    super(fullMessage);
    this.name = 'ReminderTemplateUpdateError';
  }
}

export class ReminderTemplateMethodMissingError extends Error {
  constructor(methodName: string, context?: any) {
    const fullMessage = context
      ? `提醒模板方法缺失: ${methodName} - ${JSON.stringify(context)}`
      : `提醒模板方法缺失: ${methodName}`;
    super(fullMessage);
    this.name = 'ReminderTemplateMethodMissingError';
  }
}

export class ReminderTemplateSaveError extends Error {
  constructor(message: string, context?: any) {
    const fullMessage = context
      ? `保存提醒模板失败: ${message} - ${JSON.stringify(context)}`
      : `保存提醒模板失败: ${message}`;
    super(fullMessage);
    this.name = 'ReminderTemplateSaveError';
  }
}
