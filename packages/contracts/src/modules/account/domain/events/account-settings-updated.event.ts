import type { AccountServerDTO } from '../../aggregates';
import type { IdentityId } from '../../../../primitives';

export interface AccountSettingsUpdatedEvent {
  identityId: IdentityId;
  accountId: IdentityId;
  account: AccountServerDTO;
  settingKeys: string[];
}
