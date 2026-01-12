/**
 * Authentication Module - Application Services
 */

// ============ Events ============
export { AUTH_EVENTS, type AuthEvent } from './auth-events';

// ============ Individual Use Cases ============

// Login Use Cases
export { Login } from './login';
export { Logout } from './logout';
export { RefreshToken } from './refresh-token';

// Registration Use Cases
export { Register } from './register';

// Password Use Cases
export { ForgotPassword } from './forgot-password';
export { ResetPassword } from './reset-password';
export { ChangePassword } from './change-password';

// 2FA Use Cases
export { Enable2FA } from './enable-2fa';
export { Disable2FA } from './disable-2fa';
export { Verify2FA } from './verify-2fa';

// Session Use Cases
export { GetActiveSessions } from './get-active-sessions';
export { RevokeSession } from './revoke-session';
export { RevokeAllSessions } from './revoke-all-sessions';

// Device Use Cases
export { GetTrustedDevices } from './get-trusted-devices';
export { TrustDevice } from './trust-device';
export { RevokeTrustedDevice } from './revoke-trusted-device';

// API Key Use Cases
export { CreateApiKey } from './create-api-key';
export { ListApiKeys } from './list-api-keys';
export { RevokeApiKey } from './revoke-api-key';

// ============ Legacy Application Services (for backward compatibility) ============

// Login & Authentication
export { LoginApplicationService, createLoginApplicationService } from './LoginApplicationService';

// Registration
export {
  RegistrationApplicationService,
  createRegistrationApplicationService,
} from './RegistrationApplicationService';

// Password & 2FA
export {
  PasswordApplicationService,
  createPasswordApplicationService,
} from './PasswordApplicationService';

// Session & Device Management
export {
  SessionApplicationService,
  createSessionApplicationService,
} from './SessionApplicationService';

// API Key Management
export { ApiKeyApplicationService, createApiKeyApplicationService } from './ApiKeyApplicationService';
