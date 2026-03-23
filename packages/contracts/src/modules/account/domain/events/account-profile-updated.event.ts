import type { AccountServerDTO } from '../../aggregates';

export interface AccountProfileUpdatedEvent {
  identityId: string;
  accountId: string;
  account: AccountServerDTO;
  changes: string[];
}
