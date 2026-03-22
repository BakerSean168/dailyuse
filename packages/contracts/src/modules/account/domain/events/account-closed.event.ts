import type { AccountServerDTO } from '../../aggregates';

export interface AccountClosedEvent {
  identityId: string;
  accountId: string;
  account: AccountServerDTO;
  reason: string;
  closedAt: number;
}
