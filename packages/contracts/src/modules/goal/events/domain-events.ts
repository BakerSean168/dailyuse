/**
 * Goal 相关的事件定义
 *
 * 事件流程：
 * 1. 用户创建/更新 KeyResult 或 GoalRecord
 * 2. 后端服务发布 GoalAggregateRefreshEvent
 * 3. 前端通过 eventBus 监听该事件
 * 4. 触发 GoalSyncService 从服务器刷新 Goal
 * 5. 更新 Pinia store
 * 6. UI 自动响应
 */

/**
 * Goal 聚合根刷新事件 - 事件原因类型
 */
export type GoalAggregateRefreshReason =
  | 'key-result-created'
  | 'key-result-updated'
  | 'key-result-deleted'
  | 'goal-record-created'
  | 'goal-record-updated'
  | 'goal-record-deleted'
  | 'goal-review-created'
  | 'goal-review-updated'
  | 'goal-review-deleted'
  | 'goal-updated';

/**
 * Goal 聚合根刷新事件
 *
 * 场景：
 * - KeyResult 被创建/更新/删除
 * - GoalRecord 被创建/更新/删除
 * - Goal 的计算属性（进度、状态等）需要重新评估
 *
 * 发布者：
 * - KeyResultApplicationService
 * - GoalRecordApplicationService
 *
 * 监听者：
 * - GoalSyncService (前端)
 * - 可能的其他模块（如统计、报告等）
 */
export interface GoalAggregateRefreshEvent {
  goalUuid: string;
  reason: GoalAggregateRefreshReason;
  timestamp: number;
  metadata?: {
    keyResultUuid?: string;
    goalRecordUuid?: string;
    reviewUuid?: string;
    changeData?: any;
  };
}

/**
 * 事件名常量 - 便于维护和查找
 */
export const GoalEvents = {
  /** Goal 聚合根需要刷新 */
  AGGREGATE_REFRESH: 'goal:aggregate:refresh',

  /** KeyResult 被创建 */
  KEY_RESULT_CREATED: 'goal:key-result:created',

  /** KeyResult 被更新 */
  KEY_RESULT_UPDATED: 'goal:key-result:updated',

  /** KeyResult 被删除 */
  KEY_RESULT_DELETED: 'goal:key-result:deleted',

  /** GoalRecord 被创建 */
  RECORD_CREATED: 'goal:record:created',

  /** GoalRecord 被更新 */
  RECORD_UPDATED: 'goal:record:updated',

  /** GoalRecord 被删除 */
  RECORD_DELETED: 'goal:record:deleted',

  /** GoalReview 被创建 */
  REVIEW_CREATED: 'goal:review:created',

  /** GoalReview 被更新 */
  REVIEW_UPDATED: 'goal:review:updated',

  /** GoalReview 被删除 */
  REVIEW_DELETED: 'goal:review:deleted',
} as const;

/**
 * GoalEvents 的类型
 */
export type GoalEventType = (typeof GoalEvents)[keyof typeof GoalEvents];
