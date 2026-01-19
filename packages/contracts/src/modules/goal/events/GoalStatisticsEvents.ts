/**
 * Goal Statistics Events
 */

import type { GoalStatus } from '../enums';
import type { ImportanceLevel } from '../../../shared';

/**
 * 统计更新事件
 */
export interface GoalStatisticsUpdateEvent {
  type:
    | 'goal.created'
    | 'goal.deleted'
    | 'goal.status_changed'
    | 'goal.completed'
    | 'goal.archived'
    | 'goal.activated'
    | 'key_result.created'
    | 'key_result.deleted'
    | 'key_result.completed'
    | 'review.created'
    | 'review.deleted'
    | 'focus_session.completed';
  accountUuid: string;
  timestamp: number;
  payload: {
    previousStatus?: GoalStatus;
    newStatus?: GoalStatus;
    importance?: ImportanceLevel;
    category?: string;
    keyResultCount?: number;
    rating?: number;
    focusMinutes?: number;
    [key: string]: any;
  };
}
