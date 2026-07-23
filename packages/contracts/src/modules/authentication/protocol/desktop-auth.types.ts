/**
 * Desktop Authentication Protocol Types
 *
 * Types shared between the Electron main process and renderer process
 * for desktop-specific authentication flows including:
 * - Offline-first auth (online login → offline unlock)
 * - Persistent guest mode
 * - Network-aware session management
 */

import type { CurrentUserDTO } from '../api/session.dto';
import type { IdentityId } from '../value-objects/identity-id';

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
 * Runtime authentication state in the desktop main process.
 * Distinguishes restore-in-progress from a true unauthenticated state.
 */
export const AuthRuntimeState = {
  UNINITIALIZED: 'UNINITIALIZED',
  RESTORING: 'RESTORING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
} as const;

export type AuthRuntimeState = (typeof AuthRuntimeState)[keyof typeof AuthRuntimeState];

/**
 * Valid state transitions for AuthRuntimeState.
 * Key = current state, Value = set of allowed next states.
 */
const AUTH_STATE_TRANSITIONS: Record<AuthRuntimeState, ReadonlySet<AuthRuntimeState>> = {
  UNINITIALIZED: new Set([AuthRuntimeState.RESTORING, AuthRuntimeState.AUTHENTICATED, AuthRuntimeState.UNAUTHENTICATED]),
  RESTORING: new Set([AuthRuntimeState.AUTHENTICATED, AuthRuntimeState.UNAUTHENTICATED]),
  AUTHENTICATED: new Set([AuthRuntimeState.RESTORING, AuthRuntimeState.UNAUTHENTICATED]),
  UNAUTHENTICATED: new Set([AuthRuntimeState.RESTORING, AuthRuntimeState.AUTHENTICATED]),
};

/**
 * Validates and performs a state transition.
 * Returns the new state if valid, throws if the transition is illegal.
 */
export function transitionAuthState(
  current: AuthRuntimeState,
  next: AuthRuntimeState,
): AuthRuntimeState {
  if (current === next) return next;
  const allowed = AUTH_STATE_TRANSITIONS[current];
  if (!allowed.has(next)) {
    throw new Error(
      `[AuthStateMachine] Illegal transition: ${current} → ${next}. Allowed: ${[...allowed].join(', ')}`,
    );
  }
  return next;
}

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
 * Residual 897: persisted absolute-expiry shape (≠ SaveTokenRequest duration inputs).
 */
export interface TokenStorageData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
  identityId: IdentityId;
  sessionId: string;
}

/**
 * Request to save tokens after login/register.
 * Residual 897: duration-input write shape (≠ TokenStorageData absolute-expiry persistence).
 */
export interface SaveTokenRequest {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn?: number;
  identityId: IdentityId;
  sessionId: string;
}

/**
 * Result of a token refresh operation.
 * Residual 895: token-manager callback sole shape (≠ RefreshSessionResponse / DesktopAuthFlowResult).
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
 * Residual 883: protocol DTO sole base shape (desktop infrastructure/lifecycle may extend intentionally).
 */
export interface SessionRestoreResult {
  ok: boolean;
  hasValidSession?: boolean;
  runtimeState?: AuthRuntimeState;
  identityId?: IdentityId;
  sessionId?: string;
  needsRefresh?: boolean;
  needsReLogin?: boolean;
  error?: string;
}

/**
 * Result of automatic login attempt.
 * Residual 887: protocol DTO sole base shape (desktop infrastructure may extend with domain session).
 */
export interface AutoLoginResult {
  ok: boolean;
  authenticated: boolean;
  identityId?: IdentityId;
  sessionId?: string;
  isNewSession?: boolean;
  error?: string;
}

/**
 * Session status DTO for IPC transport.
 * Residual 889: protocol sole base shape (desktop SessionStatus may extend with required device).
 */
export interface SessionStatusDTO {
  hasActiveSession: boolean;
  sessionId?: string;
  identityId?: IdentityId;
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
 * Residual 895: infrastructure session/token-refresh sole shape (≠ TokenRefreshResult / DesktopAuthFlowResult).
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
 * Residual 899: offline/local identifier login shape (≠ EmailLoginCredentials email online shape).
 */
export interface LoginRequest {
  identifier: string;
  password: string;
  rememberPassword?: boolean;
  autoLogin?: boolean;
}

// Residual 867: LoginResponse dual deleted (zero consumers).
// Residual 873: sole offline login result shape.
// Residual 925 (soft): OfflineLoginResponse name dual fully retired — desktop imports contracts sole body.
// Online auth uses AuthResponseDTO.
export interface OfflineLoginResponse {
  ok: boolean;
  sessionId?: string;
  accessToken?: string;
  identityId?: string;
  expiresIn?: number;
  error?: string;
  authMode?: AuthMode;
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
 * Residual 881: intentional slim client dual — not full DeviceInfo VO (no browser/ip/location required fields).
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

export interface AuthStatus {
  authenticated: boolean;
  mode: AuthMode;
  runtimeState: AuthRuntimeState;
  connectionStatus: ConnectionStatus;
  user: UserInfo | null;
  session: SessionInfo | null;
  tokenStatus: TokenStatus;
  canSync: boolean;
  needsReauth: boolean;
  lastOnlineAt?: string;
}

/**
 * Desktop renderer bootstrap snapshot.
 */
export interface AuthBootstrapSnapshot {
  status: AuthStatus;
  currentUser: CurrentUserDTO | null;
}

// Residual 865: AuthStatusDTO simplified dual deleted (zero consumers).
// Sole desktop status shape is AuthStatus (used by getStatus / bootstrap snapshot).
// Residual 901: app-vue recovery no longer reintroduces a local DesktopAuthStatus dual.
// Residual 637: AuthOperationResult { ok, error? } generic dual envelope deleted.
// Concrete desktop auth flows use typed *Result DTOs + Result/IpcResult envelopes.

// ============================================================================
// Login Credentials (from renderer)
// ============================================================================

/**
 * Email + password login credentials.
 * Residual 869: sole desktop email-login request shape.
 * Residual 921 (soft): DesktopLoginRequest name dual fully retired — consumers use EmailLoginCredentials.
 * Residual 899: online email credentials keep-boundary (≠ LoginRequest identifier offline shape).
 */
export interface EmailLoginCredentials {
  email: string;
  password: string;
  rememberPassword?: boolean;
  autoLogin?: boolean;
}

/**
 * Email + password register credentials (desktop online).
 * Residual 931: sole desktop email-register request shape (RegisterRequest name dual retired).
 * Residual 931 keep-boundary: ≠ RegisterByEmailReq API DTO (no username; zod API boundary).
 */
export interface EmailRegisterCredentials {
  email: string;
  password: string;
  username?: string;
}

export interface RememberedDesktopAccountDTO {
  identityId: IdentityId;
  identifier: string;
  nickname: string | null;
  avatarUrl: string | null;
  rememberPassword: boolean;
  autoLogin: boolean;
  lastUsedAt: number;
  lastLoginAt: number;
  /** Whether a secure stored password is available for direct login. */
  hasSavedPassword: boolean;
}

export interface RememberedDesktopAccountLoginReq {
  identityId: IdentityId;
  rememberPassword?: boolean;
  autoLogin?: boolean;
}

