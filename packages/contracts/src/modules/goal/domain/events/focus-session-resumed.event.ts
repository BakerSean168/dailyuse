import type { FocusSessionServerDTO } from '../../aggregates/focus-session-server';

export interface FocusSessionResumedEvent {
  identityId: string;
  sessionId: string;
  goalId: string | null;
  session: FocusSessionServerDTO;
  resumedAt: number;
  pausedDurationMinutes: number;
}
