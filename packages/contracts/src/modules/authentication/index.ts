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
  AuthCredentialServerDTO,
  AuthCredentialPersistenceDTO,
  AuthCredentialServer,
  AuthCredentialServerStatic,
} from './aggregates/AuthCredentialServer';

export type {
  AuthCredentialClientDTO,
  AuthCredentialClient,
  AuthCredentialClientStatic,
} from './aggregates/AuthCredentialClient';

export type {
  AuthSessionServerDTO,
  AuthSessionPersistenceDTO,
  AuthSessionServer,
  AuthSessionServerStatic,
} from './aggregates/AuthSessionServer';

export type {
  AuthSessionClientDTO,
  AuthSessionClient,
  AuthSessionClientStatic,
} from './aggregates/AuthSessionClient';

// ============ Entities ============
export type {
  PasswordCredentialServerDTO,
  PasswordCredentialPersistenceDTO,
  PasswordCredentialServer,
  PasswordCredentialServerStatic,
} from './entities/PasswordCredentialServer';

export type {
  PasswordCredentialClientDTO,
  PasswordCredentialClient,
  PasswordCredentialClientStatic,
} from './entities/PasswordCredentialClient';

export type {
  ApiKeyCredentialServerDTO,
  ApiKeyCredentialPersistenceDTO,
  ApiKeyCredentialServer,
  ApiKeyCredentialServerStatic,
} from './entities/ApiKeyCredentialServer';

export type {
  ApiKeyCredentialClientDTO,
  ApiKeyCredentialClient,
  ApiKeyCredentialClientStatic,
} from './entities/ApiKeyCredentialClient';

export type {
  RememberMeTokenServerDTO,
  RememberMeTokenPersistenceDTO,
  RememberMeTokenServer,
  RememberMeTokenServerStatic,
} from './entities/RememberMeTokenServer';

export type {
  RememberMeTokenClientDTO,
  RememberMeTokenClient,
  RememberMeTokenClientStatic,
} from './entities/RememberMeTokenClient';

export type {
  CredentialHistoryServerDTO,
  CredentialHistoryPersistenceDTO,
  CredentialHistoryServer,
  CredentialHistoryServerStatic,
} from './entities/CredentialHistoryServer';

export type {
  CredentialHistoryClientDTO,
  CredentialHistoryClient,
  CredentialHistoryClientStatic,
} from './entities/CredentialHistoryClient';

export type {
  RefreshTokenServerDTO,
  RefreshTokenPersistenceDTO,
  RefreshTokenServer,
  RefreshTokenServerStatic,
} from './entities/RefreshTokenServer';

export type {
  RefreshTokenClientDTO,
  RefreshTokenClient,
  RefreshTokenClientStatic,
} from './entities/RefreshTokenClient';

export type {
  SessionHistoryServerDTO,
  SessionHistoryPersistenceDTO,
  SessionHistoryServer,
  SessionHistoryServerStatic,
} from './entities/SessionHistoryServer';

export type {
  SessionHistoryClientDTO,
  SessionHistoryClient,
  SessionHistoryClientStatic,
} from './entities/SessionHistoryClient';

// ============ Value Objects ============
export type {
  DeviceInfoServerDTO,
  DeviceInfoServer,
  DeviceInfoServerStatic,
} from './value-objects/DeviceInfoServer';

export type {
  DeviceInfoClientDTO,
  DeviceInfoClient,
  DeviceInfoClientStatic,
} from './value-objects/DeviceInfoClient';

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
} from './types';
