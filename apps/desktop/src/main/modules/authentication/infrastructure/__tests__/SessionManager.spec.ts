import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => 'D:\\test-user-data'),
    getVersion: vi.fn(() => '1.0.0'),
  },
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((value: string) => Buffer.from(value)),
    decryptString: vi.fn((value: Buffer) => value.toString('utf8')),
  },
}));

vi.mock('node-machine-id', () => ({
  machineIdSync: vi.fn(() => 'test-machine-id'),
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
    SessionManager.resetInstance();
    TokenManager.resetInstance();
    vi.clearAllMocks();
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
    };

    const result = await manager.getOrCreateGuestIdentity();

    expect(loadTokens).toHaveBeenCalledOnce();
    expect(sessionRepository.findByIdentityId).toHaveBeenCalledWith(guestId);
    expect(result).toBe(guestId);
    expect((manager as any).currentSession).toBe(guestSession);
  });
});
