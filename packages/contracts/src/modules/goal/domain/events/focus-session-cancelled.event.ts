import type { FocusSessionServerDTO } from '../../aggregates/focus-session-server';

export interface FocusSessionCancelledEvent {
  identityId: string;
  sessionId: string;
  goalId: string | null;
  session: FocusSessionServerDTO;
  cancelledAt: number;
}
