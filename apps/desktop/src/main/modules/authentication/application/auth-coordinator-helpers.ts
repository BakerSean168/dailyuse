import type {
  IAuthSessionRepository,
  IAuthIdentityRepository as IAuthCredentialRepository,
} from '@memoflow/authentication/electron';
import {
  AuthRuntimeState,
  transitionAuthState,
  type AuthResponseDTO,
  type AuthIdentityClientDTO,
  type AuthSessionClientDTO,
} from '@memoflow/contracts/authentication';
import type { TokenManager, SessionManager } from '../infrastructure';
import type { AuthState } from './desktop-credential-auth-coordinator';

type IdentityLookupId = Parameters<IAuthCredentialRepository['findById']>[0];
type SessionLookupId = Parameters<IAuthSessionRepository['findById']>[0];

const ACTIVE_STATUS = 'Active' as AuthIdentityClientDTO['status'];
const OFFLINE_DEVICE_TYPE = 'Desktop' as AuthSessionClientDTO['deviceInfo']['deviceType'];

function toTransferDate(timestamp: number): AuthIdentityClientDTO['createdAt'] {
  return timestamp as AuthIdentityClientDTO['createdAt'];
}

export function toIdentityLookupId(identityId: string): IdentityLookupId {
  return identityId as IdentityLookupId;
}

export function toSessionLookupId(sessionId: string): SessionLookupId {
  return sessionId as SessionLookupId;
}

export function buildFallbackIdentityClientDTO(identityId: string): AuthIdentityClientDTO {
  const now = Date.now();

  return {
    id: identityId as AuthIdentityClientDTO['id'],
    status: ACTIVE_STATUS,
    failedLoginAttempts: 0,
    lastFailedAttempt: null,
    lockedUntil: null,
    identifiers: [],
    credentials: [],
    hasPassword: true,
    hasEmail: false,
    hasPhone: false,
    hasOAuth: false,
    version: 1,
    createdAt: toTransferDate(now),
    updatedAt: toTransferDate(now),
    deletedAt: null,
  };
}

export function buildFallbackSessionClientDTO(
  identityId: string,
  sessionId: string,
): AuthSessionClientDTO {
  const now = Date.now();

  return {
    id: sessionId as AuthSessionClientDTO['id'],
    identityId: identityId as AuthSessionClientDTO['identityId'],
    deviceInfo: {
      deviceId: 'desktop-offline',
      deviceFingerprint: 'offline',
      deviceType: OFFLINE_DEVICE_TYPE,
      deviceName: 'Desktop Offline Session',
      os: null,
      osVersion: null,
      browser: null,
      appVersion: null,
      ipAddress: null,
      userAgent: null,
      location: null,
      firstSeenAt: now,
      lastSeenAt: now,
    },
    isCurrentSession: true,
    version: 1,
    createdAt: toTransferDate(now),
    updatedAt: toTransferDate(now),
    expiresAt: toTransferDate(now + 3600_000),
    lastActiveAt: toTransferDate(now),
    deletedAt: null,
  };
}

/**
 * Compute the number of seconds until the access token expires.
 * Defaults to 3600s (1 hour) when no expiry is provided.
 */
export function getAccessTokenExpiresInSeconds(expiresAt?: number): number {
  if (typeof expiresAt !== 'number') {
    return 3600;
  }
  const remainingMs = expiresAt - Date.now();
  return Math.max(1, Math.ceil(remainingMs / 1000));
}

/**
 * Resolve the current identity ID from session or token cache.
 * Returns null during RESTORING state or when no identity is available.
 */
export function resolveCurrentIdentityId(
  authState: AuthState,
  sessionManager: SessionManager | null,
  tokenManager: TokenManager,
): string | null {
  if (authState.runtimeState === AuthRuntimeState.RESTORING) {
    return null;
  }

  const currentSession = sessionManager?.getCurrentSession();
  if (currentSession?.identityId) {
    return currentSession.identityId;
  }

  const tokenData = tokenManager.getCachedTokenData();
  return tokenData?.identityId ?? null;
}

/**
 * Build an AuthResponseDTO from local storage when remote is unreachable.
 * Falls back to stub identity/session DTOs when repository lookups fail.
 */
export async function buildOfflineAuthResponse(
  identityId: string,
  sessionId: string,
  accessToken: string,
  refreshToken: string | undefined,
  credentialRepository: IAuthCredentialRepository | null,
  sessionRepository: IAuthSessionRepository | null,
): Promise<AuthResponseDTO> {
  const identity = await credentialRepository?.findById(toIdentityLookupId(identityId));
  const session = await sessionRepository?.findById(toSessionLookupId(sessionId));

  const identityDto: AuthIdentityClientDTO = identity
    ? identity.toClientDTO()
    : buildFallbackIdentityClientDTO(identityId);

  const sessionDto: AuthSessionClientDTO = session
    ? session.toClientDTO(true)
    : buildFallbackSessionClientDTO(identityId, sessionId);

  return { accessToken, refreshToken, identity: identityDto, session: sessionDto };
}

/**
 * Safely transition the auth runtime state.
 * Validates the transition is legal before mutating the shared state.
 */
export function safeTransition(authState: AuthState, next: AuthRuntimeState): void {
  authState.runtimeState = transitionAuthState(authState.runtimeState, next);
}
