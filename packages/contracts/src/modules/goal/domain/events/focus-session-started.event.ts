import type { FocusSessionServerDTO } from '../../aggregates/focus-session-server';

export interface FocusSessionStartedEvent {
  identityId: string;
  sessionId: string;
  goalId: string | null;
  session: FocusSessionServerDTO;
  startedAt: number;
}
