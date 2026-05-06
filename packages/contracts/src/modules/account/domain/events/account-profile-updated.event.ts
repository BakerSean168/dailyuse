import type { AccountServerDTO } from '../../aggregates';
import type { IdentityId } from '../../../../primitives';

export interface AccountProfileUpdatedEvent {
  identityId: IdentityId;
  accountId: IdentityId;
  account: AccountServerDTO;
  changes: string[];
}
