import { describe, expect, it } from 'vitest';
import { AuthChannels } from './ipc-channels';

/**
 * Auth IPC surface (stage-6 residual):
 * Retired dual-track / unused diagnostic channels with no AuthIpcAdapter or
 * renderer consumers. Keep login, guest, status, and session list/revoke.
 */
describe('AuthChannels surface', () => {
  it('does not expose retired 2FA, API-key, device, or diagnostic channels', () => {
    for (const key of [
      'TWO_FACTOR_ENABLE',
      'TWO_FACTOR_DISABLE',
      'TWO_FACTOR_VERIFY',
      'TWO_FACTOR_STATUS',
      'TWO_FACTOR_BACKUP_CODES',
      'API_KEY_CREATE',
      'API_KEY_LIST',
      'API_KEY_REVOKE',
      'API_KEY_ROTATE',
      'DEVICE_LIST',
      'DEVICE_GET_CURRENT',
      'DEVICE_REVOKE',
      'DEVICE_RENAME',
      'VERIFY_TOKEN',
      'TOKEN_STATUS',
      'SESSION_STATUS',
      'CLEANUP_SESSIONS',
      'SESSION_GET_CURRENT',
      'SESSION_REVOKE_ALL',
    ] as const) {
      expect(AuthChannels).not.toHaveProperty(key);
    }

    const values = Object.values(AuthChannels);
    for (const channel of [
      'auth:2fa:enable',
      'auth:api-key:create',
      'auth:device:list',
      'auth:verify-token',
      'auth:token-status',
      'auth:session-status',
      'auth:cleanup-sessions',
      'auth:session:get-current',
      'auth:session:revoke-all',
    ]) {
      expect(values).not.toContain(channel);
    }
  });

  it('keeps active auth session and login channels used by AuthIpcAdapter', () => {
    expect(AuthChannels.LOGIN).toBe('auth:login');
    expect(AuthChannels.ENTER_GUEST_MODE).toBe('auth:enter-guest-mode');
    expect(AuthChannels.GET_STATUS).toBe('auth:get-status');
    expect(AuthChannels.INITIALIZE).toBe('auth:initialize');
    expect(AuthChannels.SESSION_LIST).toBe('auth:session:list');
    expect(AuthChannels.SESSION_REVOKE).toBe('auth:session:revoke');
  });
});
