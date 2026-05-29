/**
 * Shared test fixtures for the authentication module.
 *
 * Provides typed mock factories to reduce duplication across spec files.
 */

import { vi } from 'vitest';

/** Creates a mock logger satisfying the ILogger interface. */
export function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

/** Creates a mock session repository. */
export function createMockSessionRepository(
  overrides: Record<string, unknown> = {},
) {
  return {
    findByIdentityId: vi.fn().mockResolvedValue([]),
    save: vi.fn(),
    findById: vi.fn().mockResolvedValue(null),
    removeExpired: vi.fn(),
    removeAllByIdentityId: vi.fn(),
    ...overrides,
  };
}

/** Creates a mock identity repository. */
export function createMockIdentityRepository(
  overrides: Record<string, unknown> = {},
) {
  return {
    findById: vi.fn().mockResolvedValue(null),
    save: vi.fn(),
    ...overrides,
  };
}

/** Creates a mock token manager. */
export function createMockTokenManager(
  overrides: Record<string, unknown> = {},
) {
  return {
    loadTokens: vi.fn().mockResolvedValue(null),
    saveTokens: vi.fn(),
    updateAccessToken: vi.fn(),
    updateRefreshToken: vi.fn(),
    getCachedTokenData: vi.fn().mockReturnValue(null),
    getStatus: vi.fn().mockResolvedValue({
      isRefreshTokenExpired: false,
      isAccessTokenExpired: false,
    }),
    getAccessToken: vi.fn().mockResolvedValue(null),
    clearTokens: vi.fn(),
    switchToProfile: vi.fn(),
    clearForProfileSwitch: vi.fn(),
    stopAutoRefresh: vi.fn(),
    ...overrides,
  };
}

/** Creates a mock session manager. */
export function createMockSessionManager(
  overrides: Record<string, unknown> = {},
) {
  return {
    initialize: vi.fn().mockResolvedValue({ ok: false }),
    getCurrentSession: vi.fn(() => null),
    loginOffline: vi.fn(),
    logout: vi.fn().mockResolvedValue({ ok: true }),
    autoLogin: vi.fn().mockResolvedValue({ ok: false }),
    refreshSession: vi.fn(),
    activateOnlineSession: vi.fn(),
    getOrCreateGuestIdentity: vi.fn().mockResolvedValue('guest-id-1'),
    saveOfflineCredentials: vi.fn().mockResolvedValue(undefined),
    removeOfflineCredentials: vi.fn().mockResolvedValue(undefined),
    cleanupExpiredSessions: vi.fn().mockResolvedValue(0),
    cleanupOtherSessions: vi.fn().mockResolvedValue(0),
    cleanup: vi.fn(),
    getStatus: vi.fn(),
    getDeviceInfo: vi.fn().mockReturnValue({
      deviceId: 'device-1',
      deviceName: 'Test Desktop',
      deviceType: 'DESKTOP',
      deviceFingerprint: 'fp-123',
      os: 'Windows',
    }),
    ensureCurrentSession: vi.fn(),
    syncCurrentSessionExpiry: vi.fn(),
    setApiCallbacks: vi.fn(),
    setOfflineAuthDependencies: vi.fn(),
    ...overrides,
  };
}

/** Creates a mock network state manager. */
export function createMockNetworkStateManager(
  overrides: Record<string, unknown> = {},
) {
  return {
    isOnline: vi.fn().mockReturnValue(true),
    onStatusChange: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  };
}

/** Creates a standard auth response DTO. */
export function createAuthResponseDTO(
  overrides: Record<string, unknown> = {},
) {
  return {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    identity: {
      id: 'identity-1',
      accountUuid: 'account-1',
      displayName: 'Test User',
      status: 'ACTIVE',
    },
    session: {
      id: 'session-1',
      identityId: 'identity-1',
      status: 'ACTIVE',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600_000,
    },
    ...overrides,
  };
}
