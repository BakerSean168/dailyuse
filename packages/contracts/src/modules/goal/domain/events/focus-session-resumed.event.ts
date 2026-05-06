import type { FocusSessionServerDTO } from '../../aggregates/focus-session-server';
import type { IdentityId, FocusSessionId, GoalId } from '../../../../primitives';

export interface FocusSessionResumedEvent {
  identityId: IdentityId;
  sessionId: FocusSessionId;
  goalId: GoalId | null;
  session: FocusSessionServerDTO;
  resumedAt: number;
  pausedDurationMinutes: number;
}
