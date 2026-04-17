import type { FocusSessionServerDTO } from '../../aggregates/focus-session-server';

export interface FocusSessionCompletedEvent {
  identityId: string;
  sessionId: string;
  goalId: string | null;
  session: FocusSessionServerDTO;
  completedAt: number;
  actualDurationMinutes: number;
  pausedDurationMinutes: number;
  duration: number;
}
