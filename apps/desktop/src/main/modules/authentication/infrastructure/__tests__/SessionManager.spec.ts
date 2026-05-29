import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TokenManager } from '../token-manager';
import type { AuthSession } from '@dailyuse/authentication/domain-server';
import type { RefreshSessionRequest, RefreshSessionResponse } from '@dailyuse/contracts/authentication';

let userDataPath = '';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => userDataPath),
    getVersion: vi.fn(() => '1.0.0'),
  },
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((value: string) => Buffer.from(value)),
    decryptString: vi.fn((value: Buffer) => value.toString('utf8')),
  },
}));

import { SessionManager } from '../session-manager';
import {
  createMockLogger,
  createMockTokenManager,
  createMockSessionRepository,
} from '../../__fixtures__/auth-test-fixtures';

/** Typed access to SessionManager private fields for test assertions. */
interface SessionManagerPrivates {
  tokenManager: TokenManager;
  currentSession: AuthSession | null;
  apiRefreshToken: ((request: RefreshSessionRequest) => Promise<RefreshSessionResponse>) | null;
}

function privates(manager: SessionManager): SessionManagerPrivates {
  return manager as unknown as SessionManagerPrivates;
}

describe('SessionManager', () => {
  beforeEach(() => {
    userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailyuse-session-manager-'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(userDataPath, { recursive: true, force: true });
  });

  it('reuses the persisted guest identity on cold start when token cache is empty', async () => {
    const guestId = 'IdentityId_guest-1';
    const guestSession = { id: 'session-1', identityId: guestId };
    const sessionRepository = createMockSessionRepository({
      findByIdentityId: vi.fn().mockResolvedValue([guestSession]),
    });
    const manager = new SessionManager(
      sessionRepository as unknown as SessionManager['sessionRepository'],
      {} as unknown as SessionManager['sessionRepository'],
      createMockTokenManager() as unknown as TokenManager,
      createMockLogger() as unknown as SessionManager['logger'],
    );
    const loadTokens = vi.fn().mockResolvedValue({
      accessToken: 'guest-local-token',
      refreshToken: 'guest-local-token',
      accessTokenExpiresAt: Date.now() + 3600_000,
      refreshTokenExpiresAt: Date.now() + 24 * 3600_000,
      identityId: guestId,
      sessionId: 'session-1',
    });

    privates(manager).tokenManager = {
      getCachedTokenData: vi.fn().mockReturnValue(null),
      loadTokens,
      clearTokens: vi.fn(),
      saveTokens: vi.fn(),
      stopAutoRefresh: vi.fn(),
    } as unknown as TokenManager;

    const result = await manager.getOrCreateGuestIdentity();

    expect(loadTokens).toHaveBeenCalledOnce();
    expect(sessionRepository.findByIdentityId).toHaveBeenCalledWith(guestId);
    expect(result).toBe(guestId);
    expect(privates(manager).currentSession).toBe(guestSession);
  });

  it('creates a persistent guest identity with a local device id on first use', async () => {
    const sessionRepository = createMockSessionRepository();
    const manager = new SessionManager(
      sessionRepository as unknown as SessionManager['sessionRepository'],
      {} as unknown as SessionManager['sessionRepository'],
      createMockTokenManager() as unknown as TokenManager,
      createMockLogger() as unknown as SessionManager['logger'],
    );
    const saveTokens = vi.fn().mockResolvedValue(undefined);

    privates(manager).tokenManager = {
      getCachedTokenData: vi.fn().mockReturnValue(null),
      loadTokens: vi.fn().mockResolvedValue(null),
      clearTokens: vi.fn(),
      saveTokens,
      stopAutoRefresh: vi.fn(),
    } as unknown as TokenManager;

    const guestId = await manager.getOrCreateGuestIdentity();
    const deviceIdPath = path.join(userDataPath, 'auth', 'device-id');

    expect(guestId).toMatch(/^IdentityId_/);
    expect(sessionRepository.save).toHaveBeenCalledOnce();
    expect(saveTokens).toHaveBeenCalledOnce();
    expect(fs.existsSync(deviceIdPath)).toBe(true);
    expect(fs.readFileSync(deviceIdPath, 'utf8').trim().length).toBeGreaterThan(0);
  });

  it('restores a persisted online session without discarding non-guest tokens', async () => {
    const restoredSession = {
      id: 'session-1',
      identityId: 'user-1',
      isValid: vi.fn(() => true),
    };
    const sessionRepository = createMockSessionRepository({
      findById: vi.fn().mockResolvedValue(restoredSession),
    });
    const manager = new SessionManager(
      sessionRepository as unknown as SessionManager['sessionRepository'],
      {} as unknown as SessionManager['sessionRepository'],
      createMockTokenManager() as unknown as TokenManager,
      createMockLogger() as unknown as SessionManager['logger'],
    );
    const clearTokens = vi.fn();

    privates(manager).tokenManager = {
      getCachedTokenData: vi.fn().mockReturnValue(null),
      loadTokens: vi.fn().mockResolvedValue({
        accessToken: 'server-access-token',
        refreshToken: 'server-refresh-token',
        accessTokenExpiresAt: Date.now() + 3600_000,
        refreshTokenExpiresAt: Date.now() + 24 * 3600_000,
        identityId: 'user-1',
        sessionId: 'session-1',
      }),
      clearTokens,
      saveTokens: vi.fn(),
      stopAutoRefresh: vi.fn(),
    } as unknown as TokenManager;

    const result = await manager.restoreSession();

    expect(result.ok).toBe(true);
    expect(result.identityId).toBe('user-1');
    expect(sessionRepository.findById).toHaveBeenCalledWith('session-1');
    expect(clearTokens).not.toHaveBeenCalled();
    expect(privates(manager).currentSession).toBe(restoredSession);
  });

  it('reconstructs a guest session when the token is valid but the session row is missing', async () => {
    const guestId = 'IdentityId_guest-1';
    const sessionRepository = createMockSessionRepository();
    const manager = new SessionManager(
      sessionRepository as unknown as SessionManager['sessionRepository'],
      {} as unknown as SessionManager['sessionRepository'],
      createMockTokenManager() as unknown as TokenManager,
      createMockLogger() as unknown as SessionManager['logger'],
    );
    const clearTokens = vi.fn();

    privates(manager).tokenManager = {
      getCachedTokenData: vi.fn().mockReturnValue(null),
      loadTokens: vi.fn().mockResolvedValue({
        accessToken: 'guest-local-token',
        refreshToken: 'guest-local-token',
        accessTokenExpiresAt: Date.now() + 3600_000,
        refreshTokenExpiresAt: Date.now() + 24 * 3600_000,
        identityId: guestId,
        sessionId: 'session-1',
      }),
      clearTokens,
      saveTokens: vi.fn(),
      stopAutoRefresh: vi.fn(),
    } as unknown as TokenManager;

    const result = await manager.restoreSession();

    expect(result.ok).toBe(true);
    expect(result.identityId).toBe(guestId);
    expect(sessionRepository.save).toHaveBeenCalledOnce();
    expect(clearTokens).not.toHaveBeenCalled();
    expect(privates(manager).currentSession?.identityId).toBe(guestId);
  });

  it('uses local refresh for local-only tokens even when API callbacks exist', async () => {
    const sessionRepository = createMockSessionRepository();
    const manager = new SessionManager(
      sessionRepository as unknown as SessionManager['sessionRepository'],
      {} as unknown as SessionManager['sessionRepository'],
      createMockTokenManager() as unknown as TokenManager,
      createMockLogger() as unknown as SessionManager['logger'],
    );

    const updateAccessToken = vi.fn().mockResolvedValue(undefined);
    const loadTokens = vi.fn().mockResolvedValue({
      accessToken: 'local-token',
      refreshToken: 'local-token',
      accessTokenExpiresAt: Date.now() - 1000,
      refreshTokenExpiresAt: Date.now() + 24 * 3600_000,
      identityId: 'user-1',
      sessionId: 'session-1',
    });

    privates(manager).currentSession = {
      extend: vi.fn(),
      isValid: vi.fn(() => true),
    } as unknown as AuthSession;
    privates(manager).tokenManager = {
      getCachedTokenData: vi.fn().mockReturnValue(null),
      loadTokens,
      updateAccessToken,
      updateRefreshToken: vi.fn(),
      clearTokens: vi.fn(),
      saveTokens: vi.fn(),
      stopAutoRefresh: vi.fn(),
      startAutoRefresh: vi.fn(),
    } as unknown as TokenManager;
    privates(manager).apiRefreshToken = vi.fn() as unknown as (request: RefreshSessionRequest) => Promise<RefreshSessionResponse>;

    const result = await manager.refreshSession();

    expect(result.ok).toBe(true);
    expect(updateAccessToken).toHaveBeenCalledOnce();
    expect(privates(manager).apiRefreshToken).not.toHaveBeenCalled();
  });

  it('activates online sessions atomically', async () => {
    const sessionRepository = createMockSessionRepository();
    const manager = new SessionManager(
      sessionRepository as unknown as SessionManager['sessionRepository'],
      {} as unknown as SessionManager['sessionRepository'],
      createMockTokenManager() as unknown as TokenManager,
      createMockLogger() as unknown as SessionManager['logger'],
    );

    const saveTokens = vi.fn().mockResolvedValue(undefined);
    const startAutoRefresh = vi.fn();
    privates(manager).tokenManager = {
      getCachedTokenData: vi.fn().mockReturnValue({
        accessToken: 'server-access-token',
        refreshToken: 'server-refresh-token',
      }),
      loadTokens: vi.fn(),
      saveTokens,
      updateAccessToken: vi.fn(),
      updateRefreshToken: vi.fn(),
      clearTokens: vi.fn(),
      stopAutoRefresh: vi.fn(),
      startAutoRefresh,
    } as unknown as TokenManager;

    await manager.activateOnlineSession({
      identityId: 'user-1',
      sessionId: 'session-1',
      accessToken: 'server-access-token',
      refreshToken: 'server-refresh-token',
      expiresIn: 3600,
    });

    expect(saveTokens).toHaveBeenCalledWith({
      accessToken: 'server-access-token',
      refreshToken: 'server-refresh-token',
      accessTokenExpiresIn: 3600,
      identityId: 'user-1',
      sessionId: 'session-1',
    });
    expect(sessionRepository.save).toHaveBeenCalledOnce();
    expect(startAutoRefresh).toHaveBeenCalledOnce();
    expect(privates(manager).currentSession?.identityId).toBe('user-1');
  });
});
