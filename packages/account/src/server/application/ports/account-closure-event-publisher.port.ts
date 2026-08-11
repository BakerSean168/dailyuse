import type { AccountServerDTO } from '@memoflow/contracts/account';

export interface AccountClosedEventPayload {
  identityId: string;
  accountId: string;
  account: AccountServerDTO;
  reason: string;
  closedAt: number;
  eventId?: string;
}

export interface AccountClosureEventPublisher {
  publishAccountClosed(event: AccountClosedEventPayload): Promise<void>;
}
