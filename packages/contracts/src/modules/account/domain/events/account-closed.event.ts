import type { AccountServerDTO } from '../../aggregates';
import type { IdentityId } from '../../../../primitives';

export interface AccountClosedEvent {
  identityId: IdentityId;
  accountId: IdentityId;
  account: AccountServerDTO;
  reason: string;
  closedAt: number;
}
