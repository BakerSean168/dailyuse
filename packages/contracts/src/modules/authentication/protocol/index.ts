export type { AuthEventMap } from './auth-event-map';
export type { AuthRpcMap } from './auth-rpc-map';

// Export individual event types for external consumers
export type {
  UserLoggedInEvent,
  UserLoggedOutEvent,
  UserRegisteredEvent,
  PasswordChangedEvent,
  IdentityProviderConnectedEvent,
  SessionInvalidatedEvent,
  IdentityActivatedEvent,
  IdentityDisabledEvent,
  SessionCreatedEvent,
  // SessionRevokedEvent,
} from '../domain/events';
