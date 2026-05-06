import type { FocusSessionServerDTO } from '../../aggregates/focus-session-server';
import type { IdentityId, FocusSessionId, GoalId } from '../../../../primitives';

export interface FocusSessionPausedEvent {
  identityId: IdentityId;
  sessionId: FocusSessionId;
  goalId: GoalId | null;
  session: FocusSessionServerDTO;
  pausedAt: number;
  pauseCount: number;
}
