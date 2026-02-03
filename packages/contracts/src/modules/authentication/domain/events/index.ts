/**
 * Authentication Module - Domain Events
 * 
 * All domain event types for the Authentication module
 */

export type { UserLoggedInEvent } from './user-logged-in.event';
export type { UserLoggedOutEvent } from './user-logged-out.event';
export type { UserRegisteredEvent } from './user-registered.event';
export type { PasswordChangedEvent } from './password-changed.event';
export type { IdentityProviderConnectedEvent } from './identity-provider-connected.event';
export type { SessionInvalidatedEvent } from './session-invalidated.event';
export type { IdentityActivatedEvent } from './identity-activated.event';
export type { IdentityDisabledEvent } from './identity-disabled.event';
export type { SessionCreatedEvent } from './session-created.event';

// Re-export union type
export type { UserLoggedInEvent as AuthenticationDomainEvent } from './user-logged-in.event';
