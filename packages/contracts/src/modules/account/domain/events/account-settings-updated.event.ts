import type { AccountServerDTO } from '../../aggregates';

export interface AccountSettingsUpdatedEvent {
  identityId: string;
  accountId: string;
  account: AccountServerDTO;
  settingKeys: string[];
}
