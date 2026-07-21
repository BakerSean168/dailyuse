import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ILogger } from '@dailyuse/utils/logger';
import type { IAuthIdentityRepository, IAuthSessionRepository } from '@dailyuse/authentication/electron';
import type { TokenManager } from '../../infrastructure/token-manager';
import type { SessionManager } from '../../infrastructure/session-manager';
import type { AuthState } from '../desktop-credential-auth-coordinator';
import { DesktopAuthSecurityAdminService } from '../desktop-auth-security-admin-service';
import {
  createMockLogger,
  createMockSessionManager,
  createMockTokenManager,
} from '../../__fixtures__/auth-test-fixtures';

function createAuthState(): AuthState {
  return { authMode: 'UNAUTHENTICATED', runtimeState: 'UNINITIALIZED' };
}

function createService(opts: {
  logger?: ILogger;
  sessionManager?: SessionManager | null;
  tokenManager?: TokenManager;
  credentialRepo?: IAuthIdentityRepository | null;
  sessionRepo?: IAuthSessionRepository | null;
  authState?: AuthState;
} = {}) {
  const logger = opts.logger ?? createMockLogger();
  const tokenManager = opts.tokenManager ?? createMockTokenManager();
  const authState = opts.authState ?? createAuthState();

  return new DesktopAuthSecurityAdminService(
    logger as ILogger,
    (opts.sessionManager ?? null) as SessionManager | null,
    tokenManager as unknown as TokenManager,
    opts.credentialRepo ?? null,
    opts.sessionRepo ?? null,
    authState,
  );
}

// =============================================
// Tests
// =============================================

describe('DesktopAuthSecurityAdminService', () => {
  let mockSessionManager: ReturnType<typeof createMockSessionManager>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionManager = createMockSessionManager();
  });

  // =============================================
  // session management
  // =============================================

  describe('session management', () => {
    it('lists sessions for current identity', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          identityId: 'user-1',
          toClientDTO: vi.fn().mockReturnValue({ id: 'session-1', identityId: 'user-1' }),
        },
        {
          id: 'session-2',
          identityId: 'user-1',
          toClientDTO: vi.fn().mockReturnValue({ id: 'session-2', identityId: 'user-1' }),
        },
      ];

      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
      });

      const service = createService({
        sessionManager: mockSessionManager,
        sessionRepo: { findByIdentityId: vi.fn().mockResolvedValue(mockSessions) },
      });

      const result = await service.listSessions();

      expect(result.sessions).toHaveLength(2);
    });

    it('returns empty sessions when no current session', async () => {
      const service = createService({ sessionManager: mockSessionManager });

      const result = await service.listSessions();

      expect(result.sessions).toHaveLength(0);
    });

    it('revokes a specific session', async () => {
      const mockSession = {
        id: 'session-2',
        revoke: vi.fn(),
      };

      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
      });

      const service = createService({
        sessionManager: mockSessionManager,
        sessionRepo: {
          findById: vi.fn().mockResolvedValue(mockSession),
          save: vi.fn(),
        },
      });

      const result = await service.revokeSession('session-2');

      expect(result.ok).toBe(true);
      expect(mockSession.revoke).toHaveBeenCalledOnce();
    });

    it('prevents revoking the current session', async () => {
      const mockSession = {
        id: 'session-1',
        revoke: vi.fn(),
      };

      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
      });

      const service = createService({
        sessionManager: mockSessionManager,
        sessionRepo: {
          findById: vi.fn().mockResolvedValue(mockSession),
        },
      });

      const result = await service.revokeSession('session-1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_OPERATION');
      }
      expect(mockSession.revoke).not.toHaveBeenCalled();
    });

    it('returns VALIDATION_ERROR when sessionId is missing', async () => {
      const service = createService({ sessionRepo: {} });

      const result = await service.revokeSession();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('revokes all sessions except current', async () => {
      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
      });
      mockSessionManager.cleanupOtherSessions.mockResolvedValue(3);

      const service = createService({ sessionManager: mockSessionManager });

      const result = await service.revokeAllSessions();

      expect(result.ok).toBe(true);
      expect(result.count).toBe(3);
    });
  });

  // =============================================
  // getCurrentUser
  // =============================================

  describe('getCurrentUser', () => {
    it('returns identity and session from repositories', async () => {
      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'session-1',
        toClientDTO: vi.fn().mockReturnValue({ id: 'session-1', identityId: 'user-1' }),
      });

      const service = createService({
        sessionManager: mockSessionManager,
        credentialRepo: {
          findById: vi.fn().mockResolvedValue({
            toClientDTO: () => ({
              id: 'user-1',
              identifiers: [{ type: 'Email', value: 'user@example.com' }],
            }),
          }),
        },
      });

      const result = await service.getCurrentUser();

      expect(result.identity).toBeDefined();
      expect(result.session).toBeDefined();
    });

    it('returns fallback identity when repository lookup fails', async () => {
      mockSessionManager.getCurrentSession.mockReturnValue({
        identityId: 'user-1',
        id: 'sess-1',
        isValid: () => true,
        deviceInfo: { deviceId: 'dev-1', deviceType: 'DESKTOP' },
        toClientDTO: () => ({ id: 'sess-1', identityId: 'user-1', isCurrentSession: true }),
      });

      const service = createService({
        sessionManager: mockSessionManager,
        credentialRepo: { findById: vi.fn().mockResolvedValue(null) },
      });

      const result = await service.getCurrentUser();

      expect(result.identity.id).toBe('user-1');
      expect(result.session).toBeDefined();
    });

    it('falls back to token cache when no session exists', async () => {
      mockSessionManager.getCurrentSession.mockReturnValue(null);
      const mockTokenMgr = createMockTokenManager({
        getCachedTokenData: vi.fn().mockReturnValue({ identityId: 'cached-user' }),
      });

      const service = createService({
        sessionManager: mockSessionManager,
        tokenManager: mockTokenMgr,
      });

      const result = await service.getCurrentUser();

      expect(result.identity.id).toBe('cached-user');
      expect(result.session).toBeNull();
    });
  });
});
