/**
 * Goal Module - Domain Errors
 * 目标模块领域错误
 */

import { ResultErrorException } from '@memoflow/contracts/result';
import type { GoalId } from './goal-id';

/**
 * 目标名称必填错误
 */
export class GoalNameRequiredError extends ResultErrorException {
  constructor() {
    super('目标名称不能为空', 'goal_name_required', undefined, undefined, 400);
  }
}

/**
 * Goal due-date range error
 */
export class GoalInvalidDateRangeError extends ResultErrorException {
  constructor(
    public readonly startDate: number,
    public readonly dueDate: number,
  ) {
    super(
      `截止日期范围无效：开始日期 ${startDate} 晚于截止日期 ${dueDate}`,
      'goal_invalid_date_range',
      undefined,
      undefined,
      400,
    );
  }
}

/**
 * Goal due-date modification error
 */
export class GoalInvalidDateModificationError extends ResultErrorException {
  constructor(
    public readonly operation: 'Extend' | 'Shorten',
    public readonly days: number,
  ) {
    super(
      `无效的日期${operation === 'Extend' ? '延长' : '缩短'}操作：天数 ${days} 必须为正数`,
      'goal_invalid_date_modification',
      undefined,
      undefined,
      400,
    );
  }
}

/**
 * 目标截止日期未设置错误
 */
export class GoalDueDateNotSetError extends ResultErrorException {
  constructor() {
    super('截止日期未设置', 'goal_due_date_not_set', undefined, undefined, 400);
  }
}

/**
 * 关键结果未找到错误
 */
export class GoalKeyResultNotFoundError extends ResultErrorException {
  constructor(keyResultId: string) {
    super(`关键结果未找到：${keyResultId}`, 'goal_key_result_not_found', undefined, undefined, 400);
  }
}

/**
 * 目标回顾未找到错误
 */
export class GoalReviewNotFoundError extends ResultErrorException {
  constructor(reviewId: string) {
    super(`目标回顾未找到：${reviewId}`, 'goal_review_not_found', undefined, undefined, 400);
  }
}

/**
 * 关键结果未在目标中找到错误
 */
export class KeyResultNotFoundInGoalError extends ResultErrorException {
  constructor(keyResultId: string, goalId: GoalId) {
    super(
      `关键结果 ${keyResultId} 未在目标 ${goalId.toString()} 中找到`,
      'key_result_not_found_in_goal',
      undefined,
      undefined,
      400,
    );
  }
}

/**
 * 目标已删除错误
 */
export class GoalDeletedError extends ResultErrorException {
  constructor(goalId?: string) {
    super(
      goalId ? `目标 ${goalId} 已删除，无法执行此操作` : '目标已删除，无法执行此操作',
      'goal_deleted',
      undefined,
      undefined,
      400,
    );
  }
}

/**
 * 目标已归档错误
 */
export class GoalArchivedError extends ResultErrorException {
  constructor(goalId?: string) {
    super(
      goalId ? `目标 ${goalId} 已归档，无法执行此操作` : '目标已归档，无法执行此操作',
      'goal_archived',
      undefined,
      undefined,
      400,
    );
  }
}

/**
 * 目标标题过长错误
 */
export class GoalNameTooLongError extends ResultErrorException {
  constructor(maxLength: number = 200) {
    super(
      `目标名称过长（最大 ${maxLength} 个字符）`,
      'goal_name_too_long',
      undefined,
      undefined,
      400,
    );
  }
}

/**
 * 关键结果权重无效错误
 */
export class KeyResultWeightInvalidError extends ResultErrorException {
  constructor(weight: number) {
    super(
      `关键结果权重 ${weight} 无效（必须在 1-5 之间的整数）`,
      'key_result_weight_invalid',
      undefined,
      undefined,
      400,
    );
  }
}

/**
 * 关键结果权重总和超出错误
 */
export class KeyResultWeightExceededError extends ResultErrorException {
  constructor(currentTotal: number, adding: number) {
    super(
      `关键结果权重超出范围：当前总计 ${currentTotal}，添加 ${adding}`,
      'key_result_weight_exceeded',
      undefined,
      undefined,
      400,
    );
  }
}

/**
 * 目标回顾评分无效错误
 */
export class GoalReviewRatingInvalidError extends ResultErrorException {
  constructor(rating: number) {
    super(
      `目标回顾评分 ${rating} 无效（必须在 1-5 之间）`,
      'goal_review_rating_invalid',
      undefined,
      undefined,
      400,
    );
  }
}
