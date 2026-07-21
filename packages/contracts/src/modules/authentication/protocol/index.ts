export type { AuthEventMap } from './auth-event-map';
export type { AuthRpcMap } from './auth-rpc-map';

// Desktop authentication protocol types
export { AuthMode, AuthRuntimeState, ConnectionStatus, transitionAuthState } from './desktop-auth.types';
export type {
  TokenStorageData,
  SaveTokenRequest,
  TokenRefreshResult,
  TokenStatus,
  SessionRestoreResult,
  AutoLoginResult,
  SessionStatusDTO,
  RefreshSessionRequest,
  RefreshSessionResponse,
  LoginRequest,
  LoginResponse,
  UserInfo,
  SessionInfo,
  DeviceInfoClientDTO,
  AuthStatus,
  AuthBootstrapSnapshot,
  AuthStatusDTO,
  AuthOperationResult,
  EmailLoginCredentials,
  RememberedDesktopAccountDTO,
  RememberedDesktopAccountLoginReq,
  DeviceInfoUI,
} from './desktop-auth.types';

// Export individual event types for external consumers
export type { UserLoggedInEvent } from '../domain/events/user-logged-in.event';
export type { UserLoggedOutEvent } from '../domain/events/user-logged-out.event';
export type { UserRegisteredEvent } from '../domain/events/user-registered.event';
export type { PasswordChangedEvent } from '../domain/events/password-changed.event';
export type { IdentityProviderConnectedEvent } from '../domain/events/identity-provider-connected.event';
export type { SessionInvalidatedEvent } from '../domain/events/session-invalidated.event';
export type { IdentityActivatedEvent } from '../domain/events/identity-activated.event';
export type { IdentityDisabledEvent } from '../domain/events/identity-disabled.event';
export type { SessionCreatedEvent } from '../domain/events/session-created.event';
