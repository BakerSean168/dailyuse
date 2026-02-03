/**
 * Goal Domain Event Map
 * 
 * Event Naming Convention: goal:<action>
 * - goal:create - Goal created
 * - goal:update - Goal updated
 * - goal:status-change - Goal status changed
 * - goal:complete - Goal completed
 * - goal:archive - Goal archived
 * - goal:delete - Goal deleted
 * - goal:key-result-add - Key result added
 * - goal:key-result-update - Key result updated
 * - goal:review-add - Review added
 * - goal:folder-create - Folder created
 * - goal:folder-update - Folder updated
 * - goal:folder-delete - Folder deleted
 * - goal:folder-stats-update - Folder stats updated
 * - goal:statistics-recalculate - Statistics recalculated
 * - goal:focus-session-start - Focus session started
 * - goal:focus-session-pause - Focus session paused
 * - goal:focus-session-resume - Focus session resumed
 * - goal:focus-session-complete - Focus session completed
 * - goal:focus-session-cancel - Focus session cancelled
 */
export type GoalEventMap = {
  // ============ Goal Events ============
  'goal:create': { goalId: string; identityId: string; folderId: string | null };
  'goal:update': { goalId: string; changes: string[] };
  'goal:status-change': { goalId: string; previousStatus: string; newStatus: string };
  'goal:complete': { goalId: string; completedAt: number; finalProgress: number };
  'goal:archive': { goalId: string; archivedAt: number };
  'goal:delete': { goalId: string; deletedAt: number; isSoftDelete: boolean };

  // ============ KeyResult Events ============
  'goal:key-result-add': { goalId: string; keyResultId: string };
  'goal:key-result-update': { goalId: string; keyResultId: string; previousValue: number; newValue: number };

  // ============ GoalReview Events ============
  'goal:review-add': { goalId: string; reviewId: string };

  // ============ GoalFolder Events ============
  'goal:folder-create': { folderId: string; identityId: string };
  'goal:folder-update': { folderId: string; changes: string[] };
  'goal:folder-delete': { folderId: string; deletedAt: number; isSoftDelete: boolean };
  'goal:folder-stats-update': { folderId: string; goalCount: number; completedGoalCount: number };

  // ============ GoalStatistics Events ============
  'goal:statistics-recalculate': { identityId: string };

  // ============ FocusSession Events ============
  'goal:focus-session-start': { sessionId: string; identityId: string; goalId: string | null; durationMinutes: number; startedAt: number };
  'goal:focus-session-pause': { sessionId: string; identityId: string; pausedAt: number; pauseCount: number };
  'goal:focus-session-resume': { sessionId: string; identityId: string; resumedAt: number; pausedDurationMinutes: number };
  'goal:focus-session-complete': { sessionId: string; identityId: string; goalId: string | null; completedAt: number; actualDurationMinutes: number; plannedDurationMinutes: number };
  'goal:focus-session-cancel': { sessionId: string; identityId: string; cancelledAt: number; reason?: string | null };
};
