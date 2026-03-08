/**
 * Desktop Authentication Protocol Types
 *
 * Types shared between the Electron main process and renderer process
 * for desktop-specific authentication flows including:
 * - Offline-first auth (online login → offline unlock)
 * - Persistent guest mode
 * - Network-aware session management
 */

// ============================================================================
// Auth Mode & Connection Status
// ============================================================================

/**
 * Authentication mode - describes the current auth state of the desktop app.
 *
 * - `ONLINE_USER`  — Authenticated via remote API, sync enabled
 * - `OFFLINE_USER` — Previously authenticated, using cached credentials offline
 * - `GUEST`        — Persistent local-only identity, no cloud account
 * - `UNAUTHENTICATED` — No active session
 */
export const AuthMode = {
  ONLINE_USER: 'ONLINE_USER',
  OFFLINE_USER: 'OFFLINE_USER',
  GUEST: 'GUEST',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
} as const;

export type AuthMode = (typeof AuthMode)[keyof typeof AuthMode];

/**
 * Network connection status as observed by the main process.
 */
export const ConnectionStatus = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];

// ============================================================================
// Token Management
// ============================================================================

/**
 * Encrypted token data stored on disk via Electron safeStorage.
 */
export interface TokenStorageData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
  identityId: string;
  sessionId: string;
}

/**
 * Request to save tokens after login/register.
 */
export interface SaveTokenRequest {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn?: number;
  identityId: string;
  sessionId: string;
}

/**
 * Result of a token refresh operation.
 */
export interface TokenRefreshResult {
  ok: boolean;
  accessToken?: string;
  expiresAt?: number;
  error?: string;
}

/**
 * Current status of stored tokens.
 */
export interface TokenStatus {
  hasValidToken: boolean;
  isAccessTokenExpired: boolean;
  isRefreshTokenExpired: boolean;
  shouldRefresh: boolean;
  accessTokenRemainingMs: number;
  refreshTokenRemainingMs: number;
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Result of attempting to restore a session on app startup.
 */
export interface SessionRestoreResult {
  ok?: boolean;
  success?: boolean;
  hasValidSession?: boolean;
  identityId?: string;
  sessionId?: string;
  needsRefresh?: boolean;
  needsReLogin?: boolean;
  error?: string;
}

/**
 * Result of automatic login attempt.
 */
export interface AutoLoginResult {
  ok: boolean;
  authenticated: boolean;
  identityId?: string;
  sessionId?: string;
  isNewSession?: boolean;
  error?: string;
}

/**
 * Session status DTO for IPC transport.
 */
export interface SessionStatusDTO {
  hasActiveSession: boolean;
  sessionId?: string;
  identityId?: string;
  tokenStatus: TokenStatus;
  lastActivityAt?: number | Date;
  sessionCreatedAt?: number | Date;
  sessionExpiresAt?: number | Date;
}

/**
 * Request to refresh a session.
 */
export interface RefreshSessionRequest {
  refreshToken: string;
  sessionId: string;
}

/**
 * Response from session refresh.
 */
export interface RefreshSessionResponse {
  ok: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

/**
 * Login request from renderer to main process.
 */
export interface LoginRequest {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response from main process to renderer.
 */
export interface LoginResponse {
  ok: boolean;
  sessionId?: string;
  accessToken?: string;
  refreshToken?: string;
  identityId?: string;
  expiresIn?: number;
  authMode?: AuthMode;
  error?: string;
}

// ============================================================================
// Auth Status (aggregate status for renderer)
// ============================================================================

/**
 * User info exposed to the renderer.
 */
export interface UserInfo {
  id: string;
  email?: string;
  username?: string;
}

/**
 * Session info exposed to the renderer.
 */
export interface SessionInfo {
  id: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrentSession: boolean;
}

/**
 * Device info for the renderer.
 */
export interface DeviceInfoClientDTO {
  deviceId: string;
  deviceFingerprint?: string;
  deviceType: string;
  deviceName?: string | null;
  os?: string | null;
  osVersion?: string;
  appVersion?: string;
  firstSeenAt?: number;
  lastSeenAt?: number;
}

/**
 * Device info for the renderer (simplified UI-facing shape).
 * Note: distinct from the domain DeviceInfo value object.
 */
export interface DeviceInfoUI {
  id: string;
  name: string;
  type: string;
  os?: string;
  fingerprint?: string;
}
export interface AuthStatus {
  authenticated: boolean;
  mode: AuthMode;
  connectionStatus: ConnectionStatus;
  user: UserInfo | null;
  session: SessionInfo | null;
  tokenStatus: TokenStatus;
  canSync: boolean;
  needsReauth: boolean;
  lastOnlineAt?: string;
}

/**
 * Simplified auth status DTO.
 */
export interface AuthStatusDTO {
  authenticated: boolean;
  mode: AuthMode;
  connectionStatus: ConnectionStatus;
  identityId: string | null;
  canSync: boolean;
}

/**
 * Generic auth operation result.
 */
export interface AuthOperationResult {
  ok: boolean;
  error?: string;
}

// ============================================================================
// Login Credentials (from renderer)
// ============================================================================

/**
 * Email + password login credentials.
 */
export interface EmailLoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// ============================================================================
// 2FA & API Keys (stubs for future use)
// ============================================================================

/**
 * Two-factor authentication status.
 */
export interface TwoFactorStatus {
  enabled: boolean;
  method: string | null;
}

/**
 * API key info.
 */
export interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}
