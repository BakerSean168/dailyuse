/**
 * Application Layer Errors for Weight Snapshot
 * 权重快照应用层错误
 */

import { DomainError } from '@dailyuse/utils';

/**
 * Goal 未找到错误
 */
export class GoalNotFoundError extends DomainError {
  constructor(goalUuid: string) {
    super('GOAL_NOT_FOUND', `Goal not found: ${goalUuid}`, { goalUuid }, 404);
  }
}

/**
 * KeyResult 未找到错误
 */
export class KeyResultNotFoundError extends DomainError {
  constructor(krUuid: string, goalUuid?: string) {
    const message = goalUuid
      ? `KeyResult not found in Goal ${goalUuid}: ${krUuid}`
      : `KeyResult not found: ${krUuid}`;
    super('KEY_RESULT_NOT_FOUND', message, { krUuid, goalUuid }, 404);
  }
}
