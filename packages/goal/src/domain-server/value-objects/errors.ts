/**
 * Goal Module - Domain Errors
 * 目标模块领域错误
 */

import { DomainError } from '@dailyuse/utils';
import type { GoalId } from '@/domain-shared';

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
    public readonly operation: 'Extend' | 'Shorten',
    public readonly days: number,
  ) {
    super(
      'goal_invalid_date_modification',
      `无效的日期${operation === 'Extend' ? '延长' : '缩短'}操作：天数 ${days} 必须为正数`,
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

/**
 * 目标已删除错误
 */
export class GoalDeletedError extends DomainError {
  constructor(goalId?: string) {
    super(
      'goal_deleted',
      goalId ? `目标 ${goalId} 已删除，无法执行此操作` : '目标已删除，无法执行此操作',
    );
  }
}

/**
 * 目标已归档错误
 */
export class GoalArchivedError extends DomainError {
  constructor(goalId?: string) {
    super(
      'goal_archived',
      goalId ? `目标 ${goalId} 已归档，无法执行此操作` : '目标已归档，无法执行此操作',
    );
  }
}

/**
 * 目标标题过长错误
 */
export class GoalNameTooLongError extends DomainError {
  constructor(maxLength: number = 200) {
    super('goal_name_too_long', `目标名称过长（最大 ${maxLength} 个字符）`);
  }
}

/**
 * 关键结果权重无效错误
 */
export class KeyResultWeightInvalidError extends DomainError {
  constructor(weight: number) {
    super('key_result_weight_invalid', `关键结果权重 ${weight} 无效（必须在 1-5 之间的整数）`);
  }
}

/**
 * 关键结果权重总和超出错误
 */
export class KeyResultWeightExceededError extends DomainError {
  constructor(currentTotal: number, adding: number) {
    super(
      'key_result_weight_exceeded',
      `关键结果权重超出范围：当前总计 ${currentTotal}，添加 ${adding}`,
    );
  }
}

/**
 * 目标回顾评分无效错误
 */
export class GoalReviewRatingInvalidError extends DomainError {
  constructor(rating: number) {
    super('goal_review_rating_invalid', `目标回顾评分 ${rating} 无效（必须在 1-5 之间）`);
  }
}
