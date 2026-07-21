import { describe, expect, it } from 'vitest';
import { AuthChannels } from './ipc-channels';

/**
 * Auth IPC surface (stage-6 residual):
 * 2FA and account API-key management were NOT_IMPLEMENTED dual-track stubs
 * with no renderer/app-vue consumers. Keep session/device/auth live channels.
 */
describe('AuthChannels surface', () => {
  it('does not expose retired 2FA or API-key management channels', () => {
    expect(AuthChannels).not.toHaveProperty('TWO_FACTOR_ENABLE');
    expect(AuthChannels).not.toHaveProperty('TWO_FACTOR_DISABLE');
    expect(AuthChannels).not.toHaveProperty('TWO_FACTOR_VERIFY');
    expect(AuthChannels).not.toHaveProperty('TWO_FACTOR_STATUS');
    expect(AuthChannels).not.toHaveProperty('TWO_FACTOR_BACKUP_CODES');
    expect(AuthChannels).not.toHaveProperty('API_KEY_CREATE');
    expect(AuthChannels).not.toHaveProperty('API_KEY_LIST');
    expect(AuthChannels).not.toHaveProperty('API_KEY_REVOKE');
    expect(AuthChannels).not.toHaveProperty('API_KEY_ROTATE');

    const values = Object.values(AuthChannels);
    expect(values).not.toContain('auth:2fa:enable');
    expect(values).not.toContain('auth:2fa:disable');
    expect(values).not.toContain('auth:2fa:verify');
    expect(values).not.toContain('auth:2fa:get-status');
    expect(values).not.toContain('auth:2fa:generate-backup-codes');
    expect(values).not.toContain('auth:api-key:create');
    expect(values).not.toContain('auth:api-key:list');
    expect(values).not.toContain('auth:api-key:revoke');
    expect(values).not.toContain('auth:api-key:rotate');
  });

  it('keeps active auth session, device, and login channels', () => {
    expect(AuthChannels.LOGIN).toBe('auth:login');
    expect(AuthChannels.ENTER_GUEST_MODE).toBe('auth:enter-guest-mode');
    expect(AuthChannels.GET_STATUS).toBe('auth:get-status');
    expect(AuthChannels.INITIALIZE).toBe('auth:initialize');
    expect(AuthChannels.SESSION_LIST).toBe('auth:session:list');
    expect(AuthChannels.SESSION_GET_CURRENT).toBe('auth:session:get-current');
    expect(AuthChannels.DEVICE_LIST).toBe('auth:device:list');
    expect(AuthChannels.DEVICE_GET_CURRENT).toBe('auth:device:get-current');
  });
});
