import { beforeEach, describe, expect, it } from 'vitest';
import type {
  AuthBootstrapSnapshot,
  AuthIdentityClientDTO,
  AuthResponseDTO,
  AuthSessionClientDTO,
} from '@dailyuse/contracts/authentication';
import { createTestPinia } from '@dailyuse/test-utils';
import { useAuthenticationStore } from './authenticationStore';

function createIdentity(
  overrides: Partial<AuthIdentityClientDTO> = {},
): AuthIdentityClientDTO {
  return {
    id: 'identity-1' as AuthIdentityClientDTO['id'],
    status: 'Authenticated',
    ...overrides,
  } as AuthIdentityClientDTO;
}

function createSession(
  overrides: Partial<AuthSessionClientDTO> = {},
): AuthSessionClientDTO {
  return {
    id: 'session-1' as AuthSessionClientDTO['id'],
    expiresAt: Date.now() + 60_000,
    ...overrides,
  } as AuthSessionClientDTO;
}

describe('useAuthenticationStore', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('hydrates desktop bootstrap state and prefers runtime snapshot for auth status', () => {
    const store = useAuthenticationStore();
    const snapshot = {
      status: {
        authenticated: true,
        mode: 'desktop',
      },
      currentUser: {
        identity: createIdentity(),
        session: createSession(),
      },
    } as AuthBootstrapSnapshot;

    store.hydrateDesktopBootstrapSnapshot(snapshot);

    expect(store.desktopBootstrapSnapshot).toStrictEqual(snapshot);
    expect(store.isAuthenticated).toBe(true);
    expect(store.getIdentityId).toBe('identity-1');
    expect(store.currentSession?.id).toBe('session-1');
    expect(store.getActiveSessionCount).toBe(1);
    expect(store.accessToken).toBeNull();
  });

  it('handles auth response, session mutation, tokens, and reset', () => {
    const store = useAuthenticationStore();
    const response = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      identity: createIdentity({ id: 'identity-2' as AuthIdentityClientDTO['id'] }),
      session: createSession({ id: 'session-2' as AuthSessionClientDTO['id'] }),
      authMode: 'password',
    } as AuthResponseDTO & { authMode: string };

    store.handleAuthResponse(response);
    store.setActiveSessions([
      createSession({ id: 'session-2' as AuthSessionClientDTO['id'] }),
      createSession({ id: 'session-3' as AuthSessionClientDTO['id'] }),
    ]);
    store.removeActiveSession('session-2');
    store.setLoading(true);
    store.setError('bad token');
    store.setIsInitializing(true);

    expect(store.isAuthenticated).toBe(true);
    expect(store.authMode).toBe('password');
    expect(store.accessToken).toBe('access-token');
    expect(store.refreshToken).toBe('refresh-token');
    expect(store.activeSessions.map((session) => session.id)).toEqual(['session-3']);
    expect(store.error).toBe('bad token');
    expect(store.isInitializing).toBe(true);

    store.clearTokens();
    store.clearActiveSessions();
    store.clearCurrentIdentity();

    expect(store.accessToken).toBeNull();
    expect(store.refreshToken).toBeNull();
    expect(store.currentIdentity).toBeNull();
    expect(store.currentSession).toBeNull();
    expect(store.activeSessions).toEqual([]);

    store.reset();
    expect(store.desktopBootstrapSnapshot).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });
});
