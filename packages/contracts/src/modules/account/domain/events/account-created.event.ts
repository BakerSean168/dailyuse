import type { AccountServerDTO } from '../../aggregates';

export interface AccountCreatedEvent {
  identityId: string;
  accountId: string;
  account: AccountServerDTO;
}
