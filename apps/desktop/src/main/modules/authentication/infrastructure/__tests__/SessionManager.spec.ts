import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { SessionManager, createSessionManager } from '../SessionManager';
import { TokenManager } from '../TokenManager';

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

describe('SessionManager', () => {
  beforeEach(() => {
    userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailyuse-session-manager-'));
    SessionManager.resetInstance();
    TokenManager.resetInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(userDataPath, { recursive: true, force: true });
  });

  it('reuses the persisted guest identity on cold start when token cache is empty', async () => {
    const guestId = 'IdentityId_guest-1';
    const guestSession = { id: 'session-1', identityId: guestId };
    const sessionRepository = {
      findByIdentityId: vi.fn().mockResolvedValue([guestSession]),
      save: vi.fn(),
      findById: vi.fn(),
      removeExpired: vi.fn(),
      removeAllByIdentityId: vi.fn(),
    };
    const identityRepository = {};
    const manager = createSessionManager(
      sessionRepository as never,
      identityRepository as never,
      createLogger() as never,
    );
    const loadTokens = vi.fn().mockResolvedValue({
      accessToken: 'guest-local-token',
      refreshToken: 'guest-local-token',
      accessTokenExpiresAt: Date.now() + 3600_000,
      refreshTokenExpiresAt: Date.now() + 24 * 3600_000,
      identityId: guestId,
      sessionId: 'session-1',
    });

    (manager as any).tokenManager = {
      getCachedTokenData: vi.fn().mockReturnValue(null),
      loadTokens,
      clearTokens: vi.fn(),
      saveTokens: vi.fn(),
      stopAutoRefresh: vi.fn(),
    };

    const result = await manager.getOrCreateGuestIdentity();

    expect(loadTokens).toHaveBeenCalledOnce();
    expect(sessionRepository.findByIdentityId).toHaveBeenCalledWith(guestId);
    expect(result).toBe(guestId);
    expect((manager as any).currentSession).toBe(guestSession);
  });

  it('creates a persistent guest identity with a local device id on first use', async () => {
    const sessionRepository = {
      findByIdentityId: vi.fn().mockResolvedValue([]),
      save: vi.fn(),
      findById: vi.fn(),
      removeExpired: vi.fn(),
      removeAllByIdentityId: vi.fn(),
    };
    const identityRepository = {};
    const manager = createSessionManager(
      sessionRepository as never,
      identityRepository as never,
      createLogger() as never,
    );
    const saveTokens = vi.fn().mockResolvedValue(undefined);

    (manager as any).tokenManager = {
      getCachedTokenData: vi.fn().mockReturnValue(null),
      loadTokens: vi.fn().mockResolvedValue(null),
      clearTokens: vi.fn(),
      saveTokens,
      stopAutoRefresh: vi.fn(),
    };

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
    const sessionRepository = {
      findByIdentityId: vi.fn().mockResolvedValue([]),
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(restoredSession),
      removeExpired: vi.fn(),
      removeAllByIdentityId: vi.fn(),
    };
    const identityRepository = {};
    const manager = createSessionManager(
      sessionRepository as never,
      identityRepository as never,
      createLogger() as never,
    );
    const clearTokens = vi.fn();

    (manager as any).tokenManager = {
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
    };

    const result = await manager.restoreSession();

    expect(result.ok).toBe(true);
    expect(result.identityId).toBe('user-1');
    expect(sessionRepository.findById).toHaveBeenCalledWith('session-1');
    expect(clearTokens).not.toHaveBeenCalled();
    expect((manager as any).currentSession).toBe(restoredSession);
  });
});
