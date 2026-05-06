import type { AccountServerDTO } from '../../aggregates';
import type { IdentityId } from '../../../../primitives';

export interface AccountCreatedEvent {
  identityId: IdentityId;
  accountId: IdentityId;
  account: AccountServerDTO;
}
