import type { FocusSessionServerDTO } from '../../aggregates/focus-session-server';
import type { IdentityId, FocusSessionId, GoalId } from '../../../../primitives';

export interface FocusSessionStartedEvent {
  identityId: IdentityId;
  sessionId: FocusSessionId;
  goalId: GoalId | null;
  session: FocusSessionServerDTO;
  startedAt: number;
}
