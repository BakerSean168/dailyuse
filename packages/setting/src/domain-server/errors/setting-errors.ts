/**
 * Setting Domain Errors
 *
 * 设置模块领域错误定义。
 * 继承自 DomainError 基类，提供结构化的错误信息。
 */

import { DomainError } from '@dailyuse/utils';

/**
 * 未知的设置 key
 */
export class UnknownSettingKeyError extends DomainError {
  constructor(key: string) {
    super(
      'setting_unknown_key',
      `未知的设置项: ${key}`,
      { key },
    );
  }
}

/**
 * 未知的设置分类
 */
export class UnknownSettingCategoryError extends DomainError {
  constructor(category: string) {
    super(
      'setting_unknown_category',
      `未知的设置分类: ${category}`,
      { category },
    );
  }
}

/**
 * 设置值验证失败
 */
export class SettingValidationError extends DomainError {
  constructor(key: string, reason: string) {
    super(
      'setting_validation_failed',
      `设置项 "${key}" 验证失败: ${reason}`,
      { key, reason },
    );
  }
}

/**
 * 用户设置已删除，不可修改
 */
export class UserSettingDeletedError extends DomainError {
  constructor(identityId: string) {
    super(
      'user_setting_deleted',
      `用户设置已被删除，无法操作`,
      { identityId },
    );
  }
}
