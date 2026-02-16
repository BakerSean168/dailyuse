/**
 * Application Layer Errors for Weight Snapshot
 * 权重快照应用层错误
 */

import { DomainError } from '@dailyuse/utils';

/**
 * Goal 未找到错误
 */
export class GoalNotFoundError extends DomainError {
  constructor(goalId: string) {
    super('GOAL_NOT_FOUND', `Goal not found: ${goalId}`, { goalId }, 404);
  }
}

/**
 * KeyResult 未找到错误
 */
export class KeyResultNotFoundError extends DomainError {
  constructor(krId: string, goalId?: string) {
    const message = goalId
      ? `KeyResult not found in Goal ${goalId}: ${krId}`
      : `KeyResult not found: ${krId}`;
    super('KEY_RESULT_NOT_FOUND', message, { krId, goalId }, 404);
  }
}
