import type { FocusSessionServerDTO } from '../../aggregates';

export interface FocusSessionPausedEvent {
  identityId: string;
  sessionId: string;
  goalId: string | null;
  session: FocusSessionServerDTO;
  pausedAt: number;
  pauseCount: number;
}
