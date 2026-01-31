// 定义 Goal 模块发出的事件
export type GoalEventMap = {
  // ============ Goal 事件 ============
  'goal:created': { goalId: string; identityId: string; folderId: string | null };
  'goal:updated': { goalId: string; changes: string[] };
  'goal:status-changed': { goalId: string; previousStatus: string; newStatus: string };
  'goal:completed': { goalId: string; completedAt: number; finalProgress: number };
  'goal:archived': { goalId: string; archivedAt: number };
  'goal:deleted': { goalId: string; deletedAt: number; isSoftDelete: boolean };

  // ============ KeyResult 事件 ============
  'goal:key-result-added': { goalId: string; keyResultId: string };
  'goal:key-result-updated': { goalId: string; keyResultId: string; previousValue: number; newValue: number };

  // ============ GoalReview 事件 ============
  'goal:review-added': { goalId: string; reviewId: string };

  // ============ GoalFolder 事件 ============
  'goal-folder:created': { folderId: string; identityId: string };
  'goal-folder:updated': { folderId: string; changes: string[] };
  'goal-folder:deleted': { folderId: string; deletedAt: number; isSoftDelete: boolean };
  'goal-folder:stats-updated': { folderId: string; goalCount: number; completedGoalCount: number };

  // ============ GoalStatistics 事件 ============
  'goal-statistics:recalculated': { identityId: string };

  // ============ FocusSession 事件 ============
  'focus-session:started': { sessionId: string; identityId: string; goalId: string | null; durationMinutes: number; startedAt: number };
  'focus-session:paused': { sessionId: string; identityId: string; pausedAt: number; pauseCount: number };
  'focus-session:resumed': { sessionId: string; identityId: string; resumedAt: number; pausedDurationMinutes: number };
  'focus-session:completed': { sessionId: string; identityId: string; goalId: string | null; completedAt: number; actualDurationMinutes: number; plannedDurationMinutes: number };
  'focus-session:cancelled': { sessionId: string; identityId: string; cancelledAt: number; reason?: string | null };
};
