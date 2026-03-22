import type { FocusSessionServerDTO } from '../../aggregates';

export interface FocusSessionResumedEvent {
  identityId: string;
  sessionId: string;
  goalId: string | null;
  session: FocusSessionServerDTO;
  resumedAt: number;
  pausedDurationMinutes: number;
}
