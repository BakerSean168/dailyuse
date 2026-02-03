import type {
  UserLoggedInEvent,
  UserLoggedOutEvent,
  UserRegisteredEvent,
  PasswordChangedEvent,
  IdentityProviderConnectedEvent,
  SessionInvalidatedEvent,
} from '../domain/events';

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
  'auth:register': UserRegisteredEvent;

  /**
   * Password changed event
   * Triggered when user changes password
   */
  'auth:password-change': PasswordChangedEvent;

  /**
   * Identity provider connected event
   * Triggered when user connects OAuth provider
   */
  'auth:provider-connect': IdentityProviderConnectedEvent;

  /**
   * Session invalidated event
   * Triggered when user session is invalidated
   */
  'auth:session-invalidate': SessionInvalidatedEvent;
};
