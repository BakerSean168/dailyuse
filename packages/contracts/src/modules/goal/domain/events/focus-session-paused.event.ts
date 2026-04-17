import type { FocusSessionServerDTO } from '../../aggregates/focus-session-server';

export interface FocusSessionPausedEvent {
  identityId: string;
  sessionId: string;
  goalId: string | null;
  session: FocusSessionServerDTO;
  pausedAt: number;
  pauseCount: number;
}
