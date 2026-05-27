/**
 * Application Layer Errors for Weight Snapshot
 * 权重快照应用层错误
 */

import { DomainError } from '@dailyuse/utils/errors';

/**
 * Goal 未找到错误
 */
export class GoalNotFoundError extends DomainError {
  public readonly details: { goalId: string };
  public readonly statusCode: number;

  constructor(goalId: string) {
    super('GOAL_NOT_FOUND', `Goal not found: ${goalId}`, { goalId }, 404);
    this.details = { goalId };
    this.statusCode = 404;
  }
}

/**
 * KeyResult 未找到错误
 */
export class KeyResultNotFoundError extends DomainError {
  public readonly details: { krId: string; goalId?: string };
  public readonly statusCode: number;

  constructor(krId: string, goalId?: string) {
    const message = goalId
      ? `KeyResult not found in Goal ${goalId}: ${krId}`
      : `KeyResult not found: ${krId}`;
    super('KEY_RESULT_NOT_FOUND', message, { krId, goalId }, 404);
    this.details = { krId, goalId };
    this.statusCode = 404;
  }
}
