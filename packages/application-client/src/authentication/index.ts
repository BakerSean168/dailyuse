/**
 * Authentication Module
 *
 * 认证模块 - 提供用户认证、会话管理、设备管理等功能
 */

export {
  // Events
  AUTH_EVENTS,
  type AuthEvent,
  
  // Login Use Cases
  Login,
  Logout,
  RefreshToken,
  
  // Registration Use Cases
  Register,
  
  // Password Use Cases
  ForgotPassword,
  ResetPassword,
  ChangePassword,
  
  // 2FA Use Cases
  Enable2FA,
  Disable2FA,
  Verify2FA,
  
  // Session Use Cases
  GetActiveSessions,
  RevokeSession,
  RevokeAllSessions,
  
  // Device Use Cases
  GetTrustedDevices,
  TrustDevice,
  RevokeTrustedDevice,
  
  // API Key Use Cases
  CreateApiKey,
  ListApiKeys,
  RevokeApiKey,
  
  // Legacy exports (deprecated)
  LoginApplicationService,
  createLoginApplicationService,
  RegistrationApplicationService,
  createRegistrationApplicationService,
  PasswordApplicationService,
  createPasswordApplicationService,
  SessionApplicationService,
  createSessionApplicationService,
  ApiKeyApplicationService,
  createApiKeyApplicationService,
} from './services';
