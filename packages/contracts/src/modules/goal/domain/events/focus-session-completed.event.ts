import type { FocusSessionServerDTO } from '../../aggregates/focus-session-server';
import type { IdentityId, FocusSessionId, GoalId } from '../../../../primitives';

export interface FocusSessionCompletedEvent {
  identityId: IdentityId;
  sessionId: FocusSessionId;
  goalId: GoalId | null;
  session: FocusSessionServerDTO;
  completedAt: number;
  actualDurationMinutes: number;
  pausedDurationMinutes: number;
  duration: number;
}
