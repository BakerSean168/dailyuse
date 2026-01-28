/**
 * Authentication Module Exports
 * 认证模块 - 显式导出
 */

// ============ Enums ============
export {
  CredentialType,
  CredentialStatus,
  PasswordAlgorithm,
  TwoFactorMethod,
  BiometricType,
  ApiKeyStatus,
  RememberMeTokenStatus,
  DeviceType,
  SessionStatus,
} from './enums';

// ============ Aggregates ============
export type {
  AuthSessionServerDTO,
  AuthSessionPersistenceDTO,
  AuthSessionServer,
  AuthSessionServerStatic,
} from './aggregates/auth-session-server';

export type {
  AuthSessionClientDTO,
  AuthSessionClient,
  AuthSessionClientStatic,
} from './aggregates/auth-session-client';

// ============ Entities ============




// ============ Value Objects ============


// ============ protocol ============

export type {
  AuthEventMap,
  AuthRpcMap,
} from './protocol';


// ============ API Requests/Responses ============
export type {
  AuthTokens,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ForgotPasswordRequest,
  Enable2FARequest,
  Enable2FAResponse,
  Verify2FARequest,
  Disable2FARequest,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  RevokeApiKeyRequest,
  ApiKeyListResponse,
  GetActiveSessionsRequest,
  ActiveSessionsResponse,
  RevokeSessionRequest,
  RevokeAllSessionsRequest,
  TrustDeviceRequest,
  RevokeTrustedDeviceRequest,
  TrustedDevicesResponse,
  SessionQueryParams,
  CredentialQueryParams,
  // Token/Session 管理类型（多端通用）
  TokenStorageData,
  SaveTokenRequest,
  TokenRefreshResult,
  TokenStatus,
  SessionRestoreResult,
  AutoLoginResult,
  AuthStatusDTO,
  SessionStatusDTO,
  RefreshSessionRequest,
  RefreshSessionResponse,
  AuthOperationResult,
} from './api-requests';

// ============ Types ============
export type {
  // Account Storage
  StoredAccount,
  AccountStoreSettings,
  AccountStoreData,
  LocalAccountType,
  LocalAccount,
  LocalAccountData,
  // Network State
  NetworkStatus,
  NetworkStateChangeEvent,
  NetworkCheckConfig,
  // Auth Status
  UserInfo,
  SessionInfo,
  DeviceInfo,
  TwoFactorStatus,
  ApiKeyInfo,
  AuthMode,
  AuthStatus,
  TokenStatusInfo,
  LoginCredentials,
  EmailLoginCredentials,
  // JWT Payload
  JwtPayloadDTO,
} from './types';
