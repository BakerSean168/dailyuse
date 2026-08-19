/**
 * Setting Domain Errors
 *
 * 设置模块领域错误定义。
 * 继承自 contracts/result 的 ResultErrorException 基类，提供结构化的错误信息。
 */

import { ResultErrorException } from '@memoflow/contracts/result';

/**
 * 未知的设置 key
 */
export class UnknownSettingKeyError extends ResultErrorException {
  constructor(key: string) {
    super(
      `未知的设置项: ${key}`,
      'setting_unknown_key',
      undefined,
      { key },
      400,
    );
  }
}

/**
 * 未知的设置分类
 */
export class UnknownSettingCategoryError extends ResultErrorException {
  constructor(category: string) {
    super(
      `未知的设置分类: ${category}`,
      'setting_unknown_category',
      undefined,
      { category },
      400,
    );
  }
}

/**
 * 设置值验证失败
 */
export class SettingValidationError extends ResultErrorException {
  constructor(key: string, reason: string) {
    super(
      `设置项 "${key}" 验证失败: ${reason}`,
      'setting_validation_failed',
      undefined,
      { key, reason },
      400,
    );
  }
}
