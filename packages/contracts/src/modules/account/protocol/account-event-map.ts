import type {
  AccountCreatedEvent,
  AccountClosedEvent,
  AccountProfileUpdatedEvent,
  AccountSettingsUpdatedEvent,
} from '../domain/events';

/**
 * Account Module - Event Map
 * 
 * Event Naming Convention: account:<action>
 * Maps event names to their payload types for type-safe event handling
 */

export type AccountEventMap = {
  /**
   * Account created event
   * Triggered when account is created
   */
  'account:create': AccountCreatedEvent;

  /**
   * Account closed event
   * Triggered when account is closed/deleted
   */
  'account:close': AccountClosedEvent;

  /**
   * Account profile updated event
   * Triggered when account profile is updated
   */
  'account:update-profile': AccountProfileUpdatedEvent;

  /**
   * Account settings updated event
   * Triggered when account settings are changed
   */
  'account:update-settings': AccountSettingsUpdatedEvent;
};
