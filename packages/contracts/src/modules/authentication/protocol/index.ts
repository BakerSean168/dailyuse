export type { AuthEventMap } from './auth-event-map';
export type { AuthRpcMap } from './auth-rpc-map';

// Desktop authentication protocol types
export {
  AuthMode,
  ConnectionStatus,
} from './desktop-auth.types';
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
  AuthStatusDTO,
  AuthOperationResult,
  EmailLoginCredentials,
  TwoFactorStatus,
  ApiKeyInfo,
  DeviceInfoUI,
} from './desktop-auth.types';

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
