import type { UserLoggedInEvent } from '../domain/events/user-logged-in.event';
import type { UserLoggedOutEvent } from '../domain/events/user-logged-out.event';
import type { UserRegisteredEvent } from '../domain/events/user-registered.event';
import type { PasswordChangedEvent } from '../domain/events/password-changed.event';
import type { IdentityProviderConnectedEvent } from '../domain/events/identity-provider-connected.event';
import type { SessionInvalidatedEvent } from '../domain/events/session-invalidated.event';
import type { IdentityActivatedEvent } from '../domain/events/identity-activated.event';
import type { IdentityDisabledEvent } from '../domain/events/identity-disabled.event';
import type { SessionCreatedEvent } from '../domain/events/session-created.event';
import type { IdentityCreatedEvent } from '../domain/events/identity-created.event';
import type { SessionRevokedEvent } from '../domain/events/session-revoked.event';

/**
 * Authentication Module - Event Map
 *
 * Event Naming Convention: auth:<action>
 * Maps event names to their payload types for type-safe event handling
 */

/**
 * Authentication Module - Event Map
 * 认证模块 - 事件映射
 *
 * 事件命名规范：auth:{kebab-action-past-tense}
 * 参见：packages/governance/src/contracts/protocol/governance-event-map.ts
 */
export type AuthEventMap = {
  /**
   * User login event
   * Triggered when user successfully logs in
   */
  'auth:logged-in': UserLoggedInEvent;

  /**
   * User logout event
   * Triggered when user logs out
   */
  'auth:logged-out': UserLoggedOutEvent;

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

  /**
   * Identity created event
   * Triggered when a new AuthIdentity is created
   */
  'auth:identity-created': IdentityCreatedEvent;

  'auth:session-created': SessionCreatedEvent;
  'auth:session-revoked': SessionRevokedEvent;
};
