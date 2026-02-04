/**
 * Goal Module - Domain Errors
 * 目标模块领域错误
 */

import { DomainError } from '@dailyuse/utils';
import type { GoalId } from '@dailyuse/domain-shared/goal';

/**
 * 目标名称必填错误
 */
export class GoalNameRequiredError extends DomainError {
  constructor() {
    super('goal_name_required', '目标名称不能为空');
  }
}

/**
 * 目标日期范围无效错误
 */
export class GoalInvalidDateRangeError extends DomainError {
  constructor(
    public readonly startDate: Date,
    public readonly targetDate: Date,
  ) {
    super(
      'goal_invalid_date_range',
      `目标日期范围无效：开始日期 ${startDate.toISOString()} 晚于目标日期 ${targetDate.toISOString()}`,
    );
  }
}

/**
 * 目标日期修改无效错误
 */
export class GoalInvalidDateModificationError extends DomainError {
  constructor(
    public readonly operation: 'extend' | 'shorten',
    public readonly days: number,
  ) {
    super(
      'goal_invalid_date_modification',
      `无效的日期${operation === 'extend' ? '延长' : '缩短'}操作：天数 ${days} 必须为正数`,
    );
  }
}

/**
 * 目标目标日期未设置错误
 */
export class GoalTargetDateNotSetError extends DomainError {
  constructor() {
    super('goal_target_date_not_set', '目标日期未设置');
  }
}

/**
 * 关键结果未找到错误
 */
export class GoalKeyResultNotFoundError extends DomainError {
  constructor(keyResultId: string) {
    super('goal_key_result_not_found', `关键结果未找到：${keyResultId}`);
  }
}

/**
 * 目标回顾未找到错误
 */
export class GoalReviewNotFoundError extends DomainError {
  constructor(reviewId: string) {
    super('goal_review_not_found', `目标回顾未找到：${reviewId}`);
  }
}

/**
 * 关键结果未在目标中找到错误
 */
export class KeyResultNotFoundInGoalError extends DomainError {
  constructor(keyResultId: string, goalId: GoalId) {
    super(
      'key_result_not_found_in_goal',
      `关键结果 ${keyResultId} 未在目标 ${goalId.toString()} 中找到`,
    );
  }
}
