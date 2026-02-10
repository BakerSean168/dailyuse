import type {
  AccountCreatedEvent,
  AccountClosedEvent,
  AccountProfileUpdatedEvent,
  AccountSettingsUpdatedEvent,
} from '../domain/events';

/**
 * Account Module - Event Map
 */
export type AccountEventMap = {
  'account:create': AccountCreatedEvent;
  'account:close': AccountClosedEvent;
  'account:update-profile': AccountProfileUpdatedEvent;
  'account:update-settings': AccountSettingsUpdatedEvent;
};
