import type {
  UserLoggedInEvent,
  UserLoggedOutEvent,
  UserRegisteredEvent,
  PasswordChangedEvent,
  IdentityProviderConnectedEvent,
  SessionInvalidatedEvent,
  IdentityActivatedEvent,
  IdentityDisabledEvent,
  SessionCreatedEvent
} from '../domain/events';
import type { SessionRevokedEvent } from '../domain/events/session-revoked.event';

/**
 * Authentication Module - Event Map
 * 
 * Event Naming Convention: auth:<action>
 * Maps event names to their payload types for type-safe event handling
 */

export type AuthEventMap = {
  /**
   * User login event
   * Triggered when user successfully logs in
   */
  'auth:login': UserLoggedInEvent;

  /**
   * User logout event
   * Triggered when user logs out
   */
  'auth:logout': UserLoggedOutEvent;

  /**
   * User registration event
   * Triggered when new user registers
   */
  'auth:registered': UserRegisteredEvent;

  /**
   * Password changed event
   * Triggered when user changes password
   */
  'auth:password-changed': PasswordChangedEvent;

  /**
   * Identity provider connected event
   * Triggered when user connects OAuth provider
   */
  'auth:provider-connected': IdentityProviderConnectedEvent;

  /**
   * Session invalidated event
   * Triggered when user session is invalidated
   */
  'auth:session-invalidated': SessionInvalidatedEvent;

  /**
   * Identity activated event
   * Triggered when user identity is activated
   */
  'auth:identity-activated': IdentityActivatedEvent;

  /**
   * Identity disabled event
   * Triggered when user identity is disabled
   */
  'auth:identity-disabled': IdentityDisabledEvent;

  'auth:session-created': SessionCreatedEvent;
  'auth:session-revoked': SessionRevokedEvent;
};
