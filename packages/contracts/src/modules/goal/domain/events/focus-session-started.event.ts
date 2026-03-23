import type { FocusSessionServerDTO } from '../../aggregates';

export interface FocusSessionStartedEvent {
  identityId: string;
  sessionId: string;
  goalId: string | null;
  session: FocusSessionServerDTO;
  startedAt: number;
}
