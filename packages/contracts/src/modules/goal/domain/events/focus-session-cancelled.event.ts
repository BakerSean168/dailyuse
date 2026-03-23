import type { FocusSessionServerDTO } from '../../aggregates';

export interface FocusSessionCancelledEvent {
  identityId: string;
  sessionId: string;
  goalId: string | null;
  session: FocusSessionServerDTO;
  cancelledAt: number;
}
