import type { AccountCreatedEvent } from '../domain/events/account-created.event';
import type { AccountClosedEvent } from '../domain/events/account-closed.event';
import type { AccountProfileUpdatedEvent } from '../domain/events/account-profile-updated.event';
import type { AccountSettingsUpdatedEvent } from '../domain/events/account-settings-updated.event';

/**
 * Account Module - Event Map
 */
export type AccountEventMap = {
  'account:create': AccountCreatedEvent;
  'account:close': AccountClosedEvent;
  'account:update-profile': AccountProfileUpdatedEvent;
  'account:update-settings': AccountSettingsUpdatedEvent;
};
